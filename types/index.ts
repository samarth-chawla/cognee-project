// Shared TypeScript types for Interview Memory Agent

export type ID = string;

export type Role = "candidate" | "admin";

export interface User {
  id: ID;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

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
  role: string; // target job role, e.g. "Frontend Engineer"
  status: InterviewStatus;
  questions: Question[];
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCriterion {
  name: string;
  score: number; // 0-10
  feedback: string;
}

export interface Evaluation {
  id: ID;
  interviewId: ID;
  overallScore: number; // 0-100
  summary: string;
  strengths: string[];
  weaknesses: string[];
  criteria: EvaluationCriterion[];
  createdAt: string;
}

export interface Report {
  id: ID;
  interviewId: ID;
  userId: ID;
  evaluation: Evaluation;
  createdAt: string;
}

// Cognee memory graph node
export interface MemoryNode {
  id: ID;
  userId: ID;
  content: string;
  kind: "fact" | "preference" | "weakness" | "strength" | "note";
  source?: string; // e.g. interviewId
  createdAt: string;
}

export interface MemoryQueryResult {
  nodes: MemoryNode[];
  answer?: string; // synthesized answer from Cognee search
}

// Speech
export interface TranscriptChunk {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

// Generic API envelope
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type AIProvider = "openai" | "gemini";
