import type { ID } from "./index";

export interface QuestionFeedback {
  sequence: number;
  question: string;
  feedback: string;
  score: number;
}

export interface Evaluation {
  id: ID;
  interviewId: ID;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  behavioralScore: number;
  problemSolvingScore: number;
  strengths: string[];
  weaknesses: string[];
  missingTopics: string[];
  recommendations: string[];
  questionFeedback: QuestionFeedback[];
  createdAt: string;
}

export interface Report {
  id: ID;
  interviewId: ID;
  userId: ID;
  evaluation: Evaluation;
  createdAt: string;
}
