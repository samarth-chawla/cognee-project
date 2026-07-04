import type { ID } from "./index";

export type InterviewStatus = "pending" | "in_progress" | "completed" | "aborted";
export type QuestionType = "behavioral" | "technical" | "system_design" | "coding";

export interface InterviewQuestion {
  id: ID;
  sequence: number;
  type: QuestionType;
  prompt: string;
  /** Natural-speech version for TTS — use this, never prompt/displayQuestion */
  ttsTranscript?: string;
  expectedPoints?: string[];
  difficulty?: "easy" | "medium" | "hard";
}

export interface Answer {
  sequence: number;
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
  questions: InterviewQuestion[];
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
}
