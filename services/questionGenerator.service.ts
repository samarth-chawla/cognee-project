import { Difficulty, InterviewStatus } from "@prisma/client";

import { generateInterviewQuestions } from "@/lib/ai/questionGenerator";
import { prisma } from "@/lib/db/prisma";
import { prepareInterviewPrompt } from "./promptBuilder.service";
import { resolveCompanyName, replaceCompanyPlaceholder } from "@/lib/utils/company";
import { withInFlight } from "@/lib/utils/dedup";
import { initPipelineUsage } from "@/services/pipelineUsage.service";


type StoredInterviewQuestion = {
  sequence: number;
  category: string;
  difficulty: Difficulty;
  displayQuestion: string;
  ttsTranscript: string;
  expectedDiscussion: string | null;
};

type UiInterviewQuestion = StoredInterviewQuestion & {
  id: string;
  prompt: string;
  type: string;
};

type InterviewQuestionsBlob = {
  questions: StoredInterviewQuestion[];
};

type GeneratedQuestion = {
  sequence?: unknown;
  category?: unknown;
  difficulty?: unknown;
  displayQuestion?: unknown;
  prompt?: unknown;
  ttsTranscript?: unknown;
  expectedDiscussion?: unknown;
};

function normalizeDifficulty(value?: string): Difficulty {
  const normalized = value?.toUpperCase();
  if (
    normalized === "EASY" ||
    normalized === "MEDIUM" ||
    normalized === "HARD"
  ) {
    return normalized;
  }

  return Difficulty.MEDIUM;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toStoredQuestion(
  question: GeneratedQuestion,
  index: number,
): StoredInterviewQuestion {
  const displayQuestion =
    readString(question.displayQuestion) ?? readString(question.prompt) ?? "";

  return {
    sequence:
      typeof question.sequence === "number" ? question.sequence : index + 1,
    category: readString(question.category) ?? "General",
    difficulty: normalizeDifficulty(readString(question.difficulty)),
    displayQuestion,
    ttsTranscript: readString(question.ttsTranscript) ?? displayQuestion,
    expectedDiscussion: readString(question.expectedDiscussion) ?? null,
  };
}

function toUiQuestion(
  interviewId: string,
  question: StoredInterviewQuestion,
): UiInterviewQuestion {
  return {
    ...question,
    id: `${interviewId}-${question.sequence}`,
    prompt: question.displayQuestion,
    type: question.category.toLowerCase(),
  };
}

function extractStoredQuestions(
  raw: unknown,
): StoredInterviewQuestion[] | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    return raw as StoredInterviewQuestion[];
  }

  if (typeof raw === "object" && raw !== null && "questions" in raw) {
    const questions = (raw as InterviewQuestionsBlob).questions;
    return Array.isArray(questions) ? questions : null;
  }

  return null;
}

export async function processInterviewGeneration(params: {
  userId: string;
  interviewId?: string;
}) {
  const { userId, interviewId } = params;

  const interview = interviewId
    ? await prisma.interview.findFirst({
        where: { id: interviewId, userId },
        include: {
          user: {
            include: { profile: true },
          },
          resume: true,
          jobDescription: true,
        },
      })
    : await prisma.interview.findFirst({
        where: {
          userId,
          status: {
            in: [InterviewStatus.GENERATING, InterviewStatus.FAILED],
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: { profile: true },
          },
          resume: true,
          jobDescription: true,
        },
      });

  if (!interview) {
    throw new Error("Interview not found");
  }

  if (interview.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const existingQuestions = extractStoredQuestions(interview.questions);
  if (interview.status === InterviewStatus.READY && existingQuestions?.length) {
    const questions = existingQuestions.map((question) =>
      toUiQuestion(interview.id, question),
    );

    return {
      interviewId: interview.id,
      status: InterviewStatus.READY,
      totalQuestions: questions.length,
      questions,
      currentQuestion: questions[0] ?? null,
    };
  }

  // De-duplicate concurrent generation for the same interview: the first caller
  // runs Gemini, every other concurrent caller (double-click, retry race) awaits
  // the SAME result. No duplicate Gemini requests, no duplicate interviews.
  return withInFlight(interview.id, async () => {
    if (
      interview.status !== InterviewStatus.GENERATING &&
      interview.status !== InterviewStatus.FAILED
    ) {
      throw new Error("Interview is not ready for generation");
    }

    if (interview.status === InterviewStatus.FAILED) {
      const updateResult = await prisma.interview.updateMany({
        where: { id: interview.id, status: InterviewStatus.FAILED },
        data: { status: InterviewStatus.GENERATING },
      });
      if (updateResult.count === 0) {
        // Another serverless lambda already took the lock!
        throw new Error("CONCURRENT_GENERATION");
      }
    }

    const company = resolveCompanyName(interview);
    console.log("[Interview] Generation started", { interviewId: interview.id });

    // Init pipeline usage row (best-effort — never blocks generation)
    await initPipelineUsage(interview.id, interview.userId);

    try {
      const prompt = await prepareInterviewPrompt(interview);
      // Pass interviewId so question generation can track tokens + cost
      const questionsData = await generateInterviewQuestions(prompt, interview.id);

      if (!questionsData || questionsData.length === 0) {
        throw new Error("AI returned no questions");
      }

      const storedQuestions = questionsData.map((question, index) => {
        const q = toStoredQuestion(question as GeneratedQuestion, index);
        // Issue #5: never let a "[Company Name]" placeholder reach the candidate.
        return {
          ...q,
          displayQuestion: replaceCompanyPlaceholder(q.displayQuestion, company),
          ttsTranscript: replaceCompanyPlaceholder(q.ttsTranscript, company),
          expectedDiscussion: q.expectedDiscussion
            ? replaceCompanyPlaceholder(q.expectedDiscussion, company)
            : null,
        };
      });

      const questionsBlob: InterviewQuestionsBlob = {
        questions: storedQuestions,
      };

      // ── Race guard: re-check status before writing ──────────────────────
      // cancel() may have set status to CANCELLED while Gemini was running.
      // If so, discard the result silently — never flip CANCELLED → READY.
      const freshStatus = await prisma.interview.findUnique({
        where: { id: interview.id },
        select: { status: true },
      });

      if (freshStatus?.status !== InterviewStatus.GENERATING) {
        console.warn(
          "[Interview] Discarding Gemini result — interview no longer GENERATING",
          { interviewId: interview.id, currentStatus: freshStatus?.status },
        );
        return {
          interviewId: interview.id,
          status: freshStatus?.status ?? "CANCELLED",
          totalQuestions: 0,
          questions: [],
          currentQuestion: null,
        };
      }
      // ───────────────────────────────────────────────────────────────────

      await prisma.interview.update({
        where: { id: interview.id },
        data: {
          questions: questionsBlob,
          status: InterviewStatus.READY,
        },
      });

      const uiQuestions = storedQuestions.map(
        (question: StoredInterviewQuestion) =>
          toUiQuestion(interview.id, question),
      );

      console.log("[Interview] Generation completed", {
        interviewId: interview.id,
        totalQuestions: uiQuestions.length,
      });

      return {
        interviewId: interview.id,
        status: InterviewStatus.READY,
        totalQuestions: uiQuestions.length,
        questions: uiQuestions,
        currentQuestion: uiQuestions[0] ?? null,
      };
    } catch (error) {
      console.error("[Interview] Generation failed", {
        interviewId: interview.id,
        error,
      });
      // Leave the row in FAILED so it can be retried safely later — never stuck
      // forever in GENERATING.
      await prisma.interview.update({
        where: { id: interview.id },
        data: { status: InterviewStatus.FAILED },
      });
      throw error;
    }
  });
}
