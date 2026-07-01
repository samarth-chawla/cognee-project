import { nowISO, uid } from "@/lib/utils/helpers";
import type { Interview, Question } from "@/types";

export function createInterviewSession(userId: string, role: string, questions: Question[]): Interview {
  const now = nowISO();
  return { id: uid("intv"), userId, role, status: "in_progress", questions, answers: [], createdAt: now, updatedAt: now };
}
