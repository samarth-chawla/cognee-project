import type { ID } from "./index";

export interface QuestionFeedback {
  sequence: number;
  question: string;
  feedback: string;
  score: number;
}

/**
 * Phase 6 – Longitudinal Evaluation & Memory Evolution.
 *
 * Gemini populates this field when historical Cognee memory is available.
 * When no history exists the field is absent — existing consumers are unaffected.
 */
export interface HistoricalProgressTrend {
  /** Previous label, e.g. "Average", "Good", "Excellent". */
  previous: string;
  /** Current label for this interview. */
  current: string;
}

export interface HistoricalProgress {
  /** Topics/skills that were historically weak but performed well today. */
  improvedAreas: string[];
  /** Topics/skills that were historically strong but performed poorly today. */
  regressedAreas: string[];
  /** Consistently strong areas across history and this interview. */
  stableStrengths: string[];
  /** Topics that remain weak compared to history. */
  stillNeedsImprovement: string[];
  /** Communication quality trend across sessions. */
  communication?: HistoricalProgressTrend;
  /** Confidence level trend across sessions. */
  confidence?: HistoricalProgressTrend;
  /** One-to-three sentence learning trajectory summary. */
  overallTrend: string;
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
  /**
   * Phase 6: populated by Gemini when historical Cognee memory is available.
   * Optional so existing reports without history remain fully compatible.
   */
  historicalProgress?: HistoricalProgress;
}

export interface ReportInterviewContext {
  role: string;
  company: string | null;
  companyType: string | null;
  customCompanyName: string | null;
  interviewType: string | null;
  difficulty: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface Report {
  id: ID;
  interviewId: ID;
  userId: ID;
  interviewContext?: ReportInterviewContext;
  evaluation: Evaluation;
  createdAt: string;
}
