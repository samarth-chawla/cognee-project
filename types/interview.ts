import type { ID } from "./index";

export type InterviewStatus = "pending" | "in_progress" | "completed" | "aborted";
export type QuestionType = "behavioral" | "technical" | "system_design" | "coding";

export interface Question {
  id: ID;
  type: QuestionType;
  prompt: string;
  expectedPoints?: string[];
  difficulty?: "easy" | "medium" | "hard";
}

export interface Answer {
  questionId: ID;
  text: string;
  audioUrl?: string;
  durationSec?: number;
  createdAt: string;
}

export interface Interview {
  id: ID;
  userId: ID;
  role: string;
  status: InterviewStatus;
  questions: Question[];
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
}
