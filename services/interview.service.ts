import { prisma } from "@/lib/db/prisma";
import { Difficulty, InterviewStatus } from "@prisma/client";
import { LIMITS } from "@/lib/config/limits";
import { complete, parseJSON } from "@/lib/ai";
import {
  buildEvaluationPrompt,
  evaluationSystemPrompt,
} from "@/lib/ai/prompts";
import { buildHistoricalContextBlock } from "@/lib/ai/evaluationPromptBuilder";
import { recallHistoricalMemory } from "@/services/cognee.service";
import {
  startTimer,
  elapsed,
  log,
  debug,
  logEvaluationStart,
  logEvaluationComplete,
} from "@/lib/cognee/logger";
import { uid } from "@/lib/utils";
import type { AIProvider, Evaluation } from "@/types";


/** Evaluate answered questions and return a structured evaluation. */
export async function evaluateInterview(params: {
  interviewId: string;
  userId: string;
  provider?: AIProvider;
}): Promise<Evaluation> {
  const { interviewId, userId, provider } = params;

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: {
      id: true,
      role: true,
      interviewType: true,
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
  const historicalMemory = await recallHistoricalMemory({
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

  const raw = await complete(
    evaluationSystemPrompt,
    buildEvaluationPrompt({ role: interview.role, qa, historicalContextBlock }),
    { provider, json: true },
  );

  const parsed = parseJSON<Omit<Evaluation, "id" | "interviewId" | "createdAt">>(raw);

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
    // Check monthly limit inside the transaction to prevent race conditions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const count = await tx.interview.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { in: [InterviewStatus.READY, InterviewStatus.ONGOING, InterviewStatus.COMPLETED, InterviewStatus.CANCELLED] }
      }
    });

    if (count >= LIMITS.MAX_INTERVIEWS_PER_MONTH) {
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

