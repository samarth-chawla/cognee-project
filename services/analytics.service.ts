import type { AnalyticsSummary, Report } from "@/types";

export function summarizeAnalytics(reports: Report[]): AnalyticsSummary {
  const scores = reports.map((report) => report.evaluation.overallScore);
  return {
    interviewCount: reports.length,
    averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
    strongestTopics: [],
    weakestTopics: [],
  };
}
