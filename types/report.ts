import type { ID } from "./index";

export interface EvaluationCriterion {
  name: string;
  score: number;
  feedback: string;
}

export interface Evaluation {
  id: ID;
  interviewId: ID;
  overallScore: number;
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
