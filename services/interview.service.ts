import { prisma } from "@/lib/db/prisma";
import { Difficulty, InterviewStatus } from "@prisma/client";
import { getLimits, getUsageWindowBounds } from "@/lib/config/limits";
import { complete, parseJSON } from "@/lib/ai";
import {
  buildEvaluationPrompt,
  evaluationSystemPrompt,
} from "@/lib/ai/prompts";
import { buildHistoricalContextBlock } from "@/lib/ai/evaluationPromptBuilder";
import { recallHistoricalMemory, EMPTY_HISTORICAL_CONTEXT } from "@/services/cognee.service";
import { resolveCompanyName, replaceCompanyPlaceholder } from "@/lib/utils/company";
import {
  startTimer,
  elapsed,
  debug,
  logEvaluationStart,
  logEvaluationComplete,
} from "@/lib/cognee/logger";
import { uid } from "@/lib/utils";
import type { Evaluation } from "@/types";


/** Evaluate answered questions and return a structured evaluation. */
export async function evaluateInterview(params: {
  interviewId: string;
  userId: string;
  /**
   * Skip the Cognee historical-memory recall and evaluate purely from this
   * interview's answers. Keeps report generation fast + independent of Cognee;
   * memory is written separately (persistInterviewMemory) after the report is
   * saved.
   */
  skipHistory?: boolean;
}): Promise<Evaluation> {
  const { interviewId, userId, skipHistory } = params;

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: {
      id: true,
      role: true,
      interviewType: true,
      company: true,
      customCompanyName: true,
      questions: true,
      answer: {
        select: { answers: true },
      },
    },
  });

  if (!interview) {
    throw new Error("INTERVIEW_NOT_FOUND");
  }

  // ── Phase 6: Recall historical memory before evaluation ──────────────────
  // Skipped during report generation — we only send this interview's answers to
  // Gemini. Cognee is written afterwards, not read here.
  const historicalMemory = skipHistory
    ? EMPTY_HISTORICAL_CONTEXT
    : await recallHistoricalMemory({
        userId,
        role: interview.role,
        interviewType: interview.interviewType ?? undefined,
      });

  const historicalContextBlock = buildHistoricalContextBlock(historicalMemory);

  if (historicalMemory.count > 0) {
    debug("Historical context ready for evaluation", {
      count: historicalMemory.count,
      hasPreviousScores: historicalMemory.previousScores.overall !== null,
      recurringWeaknesses: historicalMemory.trends.recurringWeaknesses,
    });
  }
  // ────────────────────────────────────────────────────────────────────────

  const questions = normalizeStoredQuestions(interview.questions);
  const answers = normalizeStoredAnswers(interview.answer?.answers);
  const qa = questions.map((question) => ({
    question,
    answer: answers.find((answer) => answer.sequence === question.sequence),
  }));

  const evalTimer = startTimer();
  logEvaluationStart({ interviewId, hasHistory: historicalMemory.count > 0 });

  const company = resolveCompanyName(interview);

  const raw = await complete(
    evaluationSystemPrompt,
    buildEvaluationPrompt({
      role: interview.role,
      qa,
      company,
      historicalContextBlock,
    }),
    { json: true },
  );

  // Issue #5: defensive final pass — never let a "[Company Name]" placeholder
  // survive into the evaluation the candidate sees.
  const sanitizedRaw = replaceCompanyPlaceholder(raw, company);
  const parsed = parseJSON<Omit<Evaluation, "id" | "interviewId" | "createdAt">>(
    sanitizedRaw,
  );

  logEvaluationComplete({
    interviewId,
    hasHistoricalProgress: Boolean(parsed.historicalProgress),
    durationMs: elapsed(evalTimer),
  });

  if (parsed.historicalProgress) {
    debug("Historical comparison generated", {
      improvedAreas: parsed.historicalProgress.improvedAreas,
      stableStrengths: parsed.historicalProgress.stableStrengths,
      overallTrend: parsed.historicalProgress.overallTrend,
    });
  }

  return {
    id: uid("eval"),
    interviewId,
    createdAt: new Date().toISOString(),
    ...parsed,
  };
}

type StoredInterviewQuestion = {
  sequence: number;
  category: string;
  difficulty: string;
  displayQuestion: string;
  ttsTranscript: string;
  expectedDiscussion: string | null;
};

type StoredInterviewAnswer = {
  sequence: number;
  transcript: string;
  duration: number;
  confidence: number | null;
};

type StoredQuestionsBlob = {
  questions: StoredInterviewQuestion[];
};

type StoredAnswersBlob = {
  answers: StoredInterviewAnswer[];
};

function normalizeStoredQuestions(raw: unknown): StoredInterviewQuestion[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw as StoredInterviewQuestion[];
  }

  if (typeof raw === "object" && raw !== null && "questions" in raw) {
    const questions = (raw as StoredQuestionsBlob).questions;
    return Array.isArray(questions) ? questions : [];
  }

  return [];
}

function normalizeStoredAnswers(raw: unknown): StoredInterviewAnswer[] {
  if (!raw || typeof raw !== "object" || !("answers" in raw)) {
    return [];
  }

  const answers = (raw as StoredAnswersBlob).answers;
  return Array.isArray(answers) ? answers : [];
}

export interface CreateInterviewParams {
  userId: string;
  company?: string;
  companyType?: string;
  customCompanyName?: string;
  role?: string;
  interviewType?: string;
  difficulty?: Difficulty;
  jobDescription?: string;
  forceNew?: boolean;
}

export async function createInterviewSession(params: CreateInterviewParams) {
  const {
    userId,
    company,
    companyType,
    customCompanyName,
    role,
    interviewType,
    difficulty,
    jobDescription,
    forceNew = false,
  } = params;

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!userProfile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const latestResume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });

  if (!latestResume) {
    throw new Error("RESUME_NOT_FOUND");
  }

  // Abort any stale interview (READY, ONGOING, GENERATING, FAILED) so we always
  // create a clean new session. The old row is tombstoned as ABORTED.
  const latestInterview = forceNew
    ? null
    : await prisma.interview.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
      });

  if (
    latestInterview &&
    ["READY", "ONGOING", "GENERATING", "FAILED"].includes(latestInterview.status)
  ) {
    await prisma.interview.update({
      where: { id: latestInterview.id },
      data: { status: "CANCELLED", endedAt: new Date() },
    });
  }




  return prisma.$transaction(async (tx) => {
    // Check the usage limit inside the transaction to prevent race conditions.
    // Window (day/week/month) + max count come from env-driven config.
    const { MAX_INTERVIEWS } = getLimits();
    const { start: windowStart, end: windowEnd } = getUsageWindowBounds();

    const count = await tx.interview.count({
      where: {
        userId,
        createdAt: { gte: windowStart, lte: windowEnd },
        status: { in: [InterviewStatus.READY, InterviewStatus.ONGOING, InterviewStatus.COMPLETED, InterviewStatus.CANCELLED] }
      }
    });

    // Carry forward interviews used under a same-email account deleted in THIS
    // window. Blocks "use quota → delete account → re-signup → fresh quota"
    // abuse. (A past window resets naturally, so only the current one counts.)
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    let priorUsed = 0;
    if (currentUser?.email) {
      const priorAgg = await tx.accountDeletionLog.aggregate({
        where: {
          email: currentUser.email,
          deletedAt: { gte: windowStart, lte: windowEnd },
        },
        _sum: { usedCount: true },
      });
      priorUsed = priorAgg._sum.usedCount ?? 0;
    }

    if (count + priorUsed >= MAX_INTERVIEWS) {
      throw new Error("INTERVIEW_LIMIT_REACHED");
    }

    let jobDescriptionId: string | undefined;

    if (jobDescription) {
      const companyName =
        company === "Other" && customCompanyName?.trim()
          ? customCompanyName.trim()
          : company ?? "";

      const createdJd = await tx.jobDescription.create({
        data: {
          userId,
          company: companyName,
          title: role ?? "",
          rawText: jobDescription,
          parsedSkills: [],
        },
      });
      jobDescriptionId = createdJd.id;
    }

    if (!role || !interviewType || !difficulty || !company) {
      throw new Error("INTERVIEW_CONFIG_INCOMPLETE");
    }

    // Always create a fresh interview — stale ones were aborted above.
    return tx.interview.create({
      data: {
        userId,
        resumeId: latestResume.id,
        ...(jobDescriptionId ? { jobDescriptionId } : {}),
        company: company === "Other" ? "Other" : company,
        companyType: company === "Other" ? companyType?.trim() || null : null,
        customCompanyName:
          company === "Other" ? customCompanyName?.trim() || null : null,
        role,
        interviewType,
        difficulty,
        status: "GENERATING",
      },
    });
  });
}

