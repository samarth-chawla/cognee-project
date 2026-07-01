import { addMemory, cognify, listMemory, searchMemory } from "@/lib/cognee";
import type { Evaluation, MemoryNode } from "@/types";

/** Persist evaluation insights into the candidate's long-term memory. */
export async function rememberEvaluation(
  userId: string,
  interviewId: string,
  evaluation: Evaluation
): Promise<void> {
  await Promise.all([
    ...evaluation.strengths.map((s) =>
      addMemory(userId, s, "strength", interviewId)
    ),
    ...evaluation.weaknesses.map((w) =>
      addMemory(userId, w, "weakness", interviewId)
    ),
    addMemory(userId, evaluation.summary, "note", interviewId),
  ]);
  await cognify(userId);
}

export async function getMemory(userId: string): Promise<MemoryNode[]> {
  return listMemory(userId);
}

export async function queryMemory(userId: string, q: string) {
  return searchMemory(userId, q);
}
