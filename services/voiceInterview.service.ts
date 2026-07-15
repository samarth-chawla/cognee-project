import "server-only";

import { prisma } from "@/lib/db/prisma";
import { saveInterviewAnswer } from "@/services/answer.service";
import { accumulateDeepgramAudio } from "@/services/pipelineUsage.service";


/**
 * Voice Agent interview progression. The Deepgram Voice Agent only conducts the
 * conversation; the backend remains the source of truth for question order,
 * transcript storage, and completion. This service saves the transcript for the
 * just-completed question, then returns the next Gemini-generated question (or a
 * `done` flag) so the client can inject it into the same live agent session.
 */

/** Question shape stored in `Interview.questions` JSON (see interview.service.ts). */
type StoredInterviewQuestion = {
  sequence: number;
  category: string;
  difficulty: string;
  displayQuestion: string;
  ttsTranscript: string;
  expectedDiscussion: string | null;
};

type StoredQuestionsBlob = {
  questions: StoredInterviewQuestion[];
};

/** Question shape returned to the client for the voice session. */
export interface VoiceQuestion {
  sequence: number;
  /** Natural-speech text the agent speaks verbatim. Falls back to displayQuestion. */
  ttsTranscript: string;
  /** Human-readable question text (for the transcript UI). */
  displayQuestion: string;
  category: string;
  difficulty: string;
}

export interface AdvanceTurnResult {
  /** True when the just-answered question was the last one. */
  done: boolean;
  /** Zero-based index of `nextQuestion` (or the total when done). */
  index: number;
  totalQuestions: number;
  /** Next question to speak, or null when the interview is complete. */
  nextQuestion: VoiceQuestion | null;
}

export interface SaveAnswerAndAdvanceInput {
  interviewId: string;
  userId: string;
  /** Sequence (1-based) of the question that was just answered. */
  sequence: number;
  transcript: string;
  durationSec?: number;
}

/** Normalize the `Interview.questions` JSON blob into a sorted array. */
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

function toVoiceQuestion(q: StoredInterviewQuestion): VoiceQuestion {
  const display = q.displayQuestion ?? "";
  return {
    sequence: q.sequence,
    ttsTranscript: q.ttsTranscript?.trim() || display,
    displayQuestion: display,
    category: q.category ?? "technical",
    difficulty: q.difficulty ?? "medium",
  };
}

/** Load the ordered questions for an interview owned by `userId`. */
export async function getInterviewQuestions(
  interviewId: string,
  userId: string
): Promise<VoiceQuestion[]> {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { id: true, questions: true },
  });

  if (!interview) {
    throw new Error("INTERVIEW_NOT_FOUND");
  }

  return normalizeStoredQuestions(interview.questions)
    .sort((a, b) => a.sequence - b.sequence)
    .map(toVoiceQuestion);
}

/**
 * Persist the transcript for the answered question, then resolve the next one.
 * Reuses `saveInterviewAnswer` (which upserts `Answer.answers` and flips the
 * interview to ONGOING) so voice and V1 share identical storage semantics.
 */
export async function saveAnswerAndAdvance(
  input: SaveAnswerAndAdvanceInput
): Promise<AdvanceTurnResult> {
  console.log(`[VoiceService] saveAnswerAndAdvance called for interview=${input.interviewId}, sequence=${input.sequence}`);
  
  const questions = await getInterviewQuestions(input.interviewId, input.userId);
  const totalQuestions = questions.length;
  console.log(`[VoiceService] Found ${totalQuestions} questions for interview. Input sequence: ${input.sequence}`);

  await saveInterviewAnswer({
    interviewId: input.interviewId,
    userId: input.userId,
    sequence: input.sequence,
    transcript: input.transcript,
    duration: Math.round(input.durationSec ?? 0),
  });

  // Accumulate audio seconds for Deepgram cost tracking (best-effort)
  if (input.durationSec && input.durationSec > 0) {
    await accumulateDeepgramAudio(input.interviewId, input.durationSec);
  }


  // Next question is the one whose sequence directly follows the answered one.
  const nextQuestion =
    questions.find((q) => q.sequence > input.sequence) ?? null;

  console.log(`[VoiceService] Next question selected: ${nextQuestion ? `sequence ${nextQuestion.sequence}` : 'null (Done)'}`);

  const nextIndex = nextQuestion
    ? questions.findIndex((q) => q.sequence === nextQuestion.sequence)
    : totalQuestions;

  return {
    done: nextQuestion === null,
    index: nextIndex,
    totalQuestions,
    nextQuestion,
  };
}
