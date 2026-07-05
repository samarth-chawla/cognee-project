import type { Report } from "@/types";

export type ScoreKey =
  | "overallScore"
  | "technicalScore"
  | "communicationScore"
  | "confidenceScore"
  | "behavioralScore"
  | "problemSolvingScore";

export const CATEGORY_KEYS: ScoreKey[] = [
  "technicalScore",
  "communicationScore",
  "confidenceScore",
  "behavioralScore",
  "problemSolvingScore",
];

export const CATEGORY_LABELS: Record<ScoreKey, string> = {
  overallScore: "Overall",
  technicalScore: "Technical",
  communicationScore: "Communication",
  confidenceScore: "Confidence",
  behavioralScore: "Behavioral",
  problemSolvingScore: "Problem Solving",
};

function sortByDateAsc(reports: Report[]): Report[] {
  return [...reports].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function scoreSeries(reports: Report[], key: ScoreKey): { date: string; value: number }[] {
  return sortByDateAsc(reports).map((r) => ({ date: r.createdAt, value: r.evaluation[key] }));
}

export function latestAndDelta(reports: Report[], key: ScoreKey): { value: number; delta: number | null } {
  const sorted = sortByDateAsc(reports);
  if (sorted.length === 0) return { value: 0, delta: null };
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const value = latest.evaluation[key];
  const delta = prev ? Math.round(value - prev.evaluation[key]) : null;
  return { value, delta };
}

export function strongestAndWeakestCategory(
  reports: Report[]
): { strongest: { label: string; value: number }; weakest: { label: string; value: number } } | null {
  const sorted = sortByDateAsc(reports);
  if (sorted.length === 0) return null;
  const latest = sorted[sorted.length - 1];
  const categories = CATEGORY_KEYS.map((key) => ({
    label: CATEGORY_LABELS[key],
    value: latest.evaluation[key],
  })).sort((a, b) => b.value - a.value);
  return { strongest: categories[0], weakest: categories[categories.length - 1] };
}

export function recurringPatterns(reports: Report[], limit = 3): { text: string; count: number }[] {
  const counts = new Map<string, { text: string; count: number }>();
  for (const report of reports) {
    const items = [...report.evaluation.weaknesses, ...report.evaluation.missingTopics];
    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { text: trimmed, count: 1 });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function companyReadiness(reports: Report[]): { company: string; average: number; count: number }[] {
  const groups = new Map<string, number[]>();
  for (const report of reports) {
    const company = report.interviewContext?.customCompanyName || report.interviewContext?.company;
    if (!company) continue;
    const scores = groups.get(company) ?? [];
    scores.push(report.evaluation.overallScore);
    groups.set(company, scores);
  }
  return Array.from(groups.entries())
    .map(([company, scores]) => ({
      company,
      average: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.average - a.average);
}

function toDayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function computeStreak(reports: Report[]): number {
  if (reports.length === 0) return 0;
  const days = Array.from(new Set(reports.map((r) => toDayKey(r.createdAt)))).sort((a, b) =>
    a < b ? 1 : -1
  );

  const today = new Date();
  const mostRecent = new Date(days[0]);
  const daysSinceMostRecent = Math.round((today.getTime() - mostRecent.getTime()) / 86400000);
  if (daysSinceMostRecent > 1) return 0; // streak broken — no session today or yesterday

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000);
    if (diff === 1) streak += 1;
    else break;
  }
  return streak;
}

export function weeklySessionCount(reports: Report[]): number {
  const now = Date.now();
  const weekMs = 7 * 86400000;
  return reports.filter((r) => now - new Date(r.createdAt).getTime() <= weekMs).length;
}

export function keyImprovements(reports: Report[], limit = 1): { label: string; deltaPct: number }[] {
  if (reports.length < 2) return [];
  const sorted = sortByDateAsc(reports);
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  return CATEGORY_KEYS.map((key) => ({
    label: CATEGORY_LABELS[key],
    deltaPct: Math.round(latest.evaluation[key] - first.evaluation[key]),
  }))
    .filter((c) => c.deltaPct > 0)
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, limit);
}
