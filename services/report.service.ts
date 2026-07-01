import { query } from "@/lib/db/neon";
import { uid } from "@/lib/utils";
import type { Evaluation, Report } from "@/types";

/** Persist a report row (JSONB evaluation) and return it. */
export async function saveReport(
  userId: string,
  interviewId: string,
  evaluation: Evaluation
): Promise<Report> {
  const report: Report = {
    id: uid("rpt"),
    interviewId,
    userId,
    evaluation,
    createdAt: new Date().toISOString(),
  };

  // NOTE: requires DATABASE_URL + schema.sql applied.
  await query(
    `INSERT INTO reports (interview_id, user_id, evaluation)
     VALUES ($1, $2, $3)`,
    [interviewId, userId, JSON.stringify(evaluation)]
  ).catch(() => {
    // Swallow in demo mode when DB is unavailable.
  });

  return report;
}

export async function listReports(userId: string): Promise<Report[]> {
  return query<Report>(
    `SELECT id, interview_id AS "interviewId", user_id AS "userId",
            evaluation, created_at AS "createdAt"
     FROM reports WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  ).catch(() => [] as Report[]);
}

export async function getReport(reportId: string): Promise<Report | null> {
  const rows = await query<Report>(
    `SELECT id, interview_id AS "interviewId", user_id AS "userId",
            evaluation, created_at AS "createdAt"
     FROM reports WHERE id = $1 LIMIT 1`,
    [reportId]
  ).catch(() => [] as Report[]);
  return rows[0] ?? null;
}