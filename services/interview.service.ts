import { complete, parseJSON } from "@/lib/ai";
import {
  buildQuestionGenPrompt,
  questionGenSystemPrompt,
  buildEvaluationPrompt,
  evaluationSystemPrompt,
} from "@/lib/ai/prompts";
import { searchMemory } from "@/lib/cognee";
import { uid } from "@/lib/utils";
import type {
  AIProvider,
  Answer,
  Evaluation,
  Question,
} from "@/types";
import { MAX_INTERVIEW_QUESTIONS } from "@/lib/utils/constants";

/** Generate personalized interview questions using memory + LLM. */
export async function generateQuestions(params: {
  userId: string;
  role: string;
  count?: number;
  provider?: AIProvider;
  jobDescription?: string;
}): Promise<Question[]> {
  const { userId, role, count = MAX_INTERVIEW_QUESTIONS, provider, jobDescription } = params;

  const mem = await searchMemory(userId, `weaknesses and background for ${role}`);
  const prompt = buildQuestionGenPrompt({ role, count, memory: mem.nodes, jobDescription });

  const raw = await complete(questionGenSystemPrompt, prompt, {
    provider,
    json: true,
  });
  const parsed = parseJSON<{ questions: Omit<Question, "id">[] }>(raw);
  return parsed.questions.map((q) => ({ ...q, id: uid("q") }));
}

/** Evaluate answered questions and return a structured evaluation. */
export async function evaluateInterview(params: {
  interviewId: string;
  role: string;
  questions: Question[];
  answers: Answer[];
  provider?: AIProvider;
}): Promise<Evaluation> {
  const { interviewId, role, questions, answers, provider } = params;

  const qa = questions.map((question) => ({
    question,
    answer: answers.find((a) => a.questionId === question.id),
  }));

  const raw = await complete(
    evaluationSystemPrompt,
    buildEvaluationPrompt({ role, qa }),
    { provider, json: true }
  );

  const parsed = parseJSON<Omit<Evaluation, "id" | "interviewId" | "createdAt">>(
    raw
  );

  return {
    id: uid("eval"),
    interviewId,
    createdAt: new Date().toISOString(),
    ...parsed,
  };
}
