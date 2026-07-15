/**
 * services/cognee.service.ts
 *
 * Single integration point for ALL Cognee Cloud operations.
 * No other file should import from @/lib/cognee/client directly for
 * data-plane calls — all remember / recall / improve / forget go here.
 *
 * Phase 8: structured logging via lib/cognee/logger, timing on every op,
 * consistent error boundaries so callers never need to handle Cognee errors
 * at the HTTP-route level.
 */

import { getCogneeClient } from "@/lib/cognee/client";
import {
  startTimer,
  elapsed,
  log,
  debug,
  logRecallStart,
  logRecallComplete,
  logRecallFailed,
  logForgetStart,
  logForgetComplete,
  logForgetFailed,
} from "@/lib/cognee/logger";
import {
  markCogneeSaveStart,
  markCogneeSaveSuccess,
  markCogneeSaveFailed,
  markCogneeRetrievalStart,
  markCogneeRetrievalSkipped,
  markCogneeRetrievalSuccess,
  markCogneeRetrievalFailed,
  classifyFailureReason,
  hasCogneeMemory,
} from "@/services/pipelineUsage.service";
import { sanitizeError } from "@/lib/ai/pricing";


// ── Public types ──────────────────────────────────────────────────────────

export type CogneeRecallResult = unknown[];

export type CandidateMemoryRecallParams = {
  userId: string;
  role?: string | null;
  company?: string | null;
  interviewType?: string | null;
};

export type CandidateMemoryFocus = {
  recurringStrengths: string[];
  recurringWeaknesses: string[];
  previouslyMissedTopics: string[];
  recentRecommendations: string[];
};

export type CandidateMemoryContext = {
  memories: string[];
  formatted: string | null;
  count: number;
  focus: CandidateMemoryFocus;
};

/** Params for historical evaluation recall (Phase 6). */
export type HistoricalEvaluationRecallParams = {
  userId: string;
  role?: string | null;
  interviewType?: string | null;
};

/** Structured historical context extracted for Gemini evaluation (Phase 6). */
export type HistoricalEvaluationContext = {
  memories: string[];
  formatted: string | null;
  count: number;
  previousScores: {
    overall: number | null;
    technical: number | null;
    communication: number | null;
    confidence: number | null;
    behavioral: number | null;
    problemSolving: number | null;
  };
  trends: {
    recurringStrengths: string[];
    recurringWeaknesses: string[];
    communicationTrend: string | null;
    confidenceTrend: string | null;
    improvementAreas: string[];
    stillNeedsWork: string[];
    previousRecommendations: string[];
  };
};

export type ForgetResult = {
  success: boolean;
  datasetDeleted: boolean;
  message: string;
};

// ── Health check ──────────────────────────────────────────────────────────

export async function healthCheck(): Promise<unknown> {
  const client = getCogneeClient();
  await client.initialize();
  return client.request("/health");
}

// ── Core primitives ───────────────────────────────────────────────────────

function serializeMemory(memory: unknown): string {
  return typeof memory === "string" ? memory : JSON.stringify(memory, null, 2);
}

function memoryFileName(memory: unknown): string {
  if (memory && typeof memory === "object" && "interviewId" in memory) {
    const interviewId = (memory as { interviewId?: unknown }).interviewId;
    if (typeof interviewId === "string" && interviewId.trim()) {
      return `interview-memory-${interviewId}-${Date.now()}.json`;
    }
  }
  return `memory-${Date.now()}.txt`;
}

export async function remember(
  memory: unknown,
  /** Per-user dataset name. Falls back to the global COGNEE_USER_ID if not supplied. */
  userId?: string | null,
  /** Optional: pipeline usage tracking. Pass the interviewId to record save metrics. */
  interviewId?: string | null,
): Promise<unknown> {
  const client = getCogneeClient();
  await client.initialize();

  // Use the caller-supplied userId to keep each user's memories in their own
  // Cognee dataset. Falling back to client.userId means memories land in the
  // shared service account bucket — OK for single-tenant dev, but causes 409
  // conflicts in multi-user production when concurrent pipelines hit the same dataset.
  const datasetName = userId?.trim() || client.userId;

  const serializedMemory = serializeMemory(memory);
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([serializedMemory], { type: "application/json" }),
    memoryFileName(memory),
  );
  formData.append("datasetName", datasetName);
  formData.append("run_in_background", "false");

  const saveStartedAt = Date.now();
  if (interviewId) {
    await markCogneeSaveStart(interviewId);
  }

  try {
    const result = await client.request("/api/v1/remember", {
      method: "POST",
      formData,
    });

    if (interviewId) {
      // Cognee /remember doesn't return node/edge counts — use 0 as defaults
      await markCogneeSaveSuccess(interviewId, 0, 0, Date.now() - saveStartedAt);
    }

    return result;
  } catch (err) {
    if (interviewId) {
      await markCogneeSaveFailed(
        interviewId,
        Date.now() - saveStartedAt,
        classifyFailureReason(err),
        sanitizeError(err),
      );
    }
    throw err;
  }
}


export async function recall(
  query: string,
  /** Per-user dataset to search. Falls back to the global COGNEE_USER_ID if not supplied. */
  userId?: string | null,
): Promise<CogneeRecallResult> {
  const client = getCogneeClient();
  await client.initialize();

  const datasetName = userId?.trim() || client.userId;

  return client.request<CogneeRecallResult>("/api/v1/recall", {
    method: "POST",
    body: {
      query,
      datasets: [datasetName],
      scope: "graph",
      topK: 5,
    },
  });
}

/**
 * Enrich and strengthen the knowledge graph for a user's dataset.
 * POST /api/v1/improve
 * Runs synchronously so the result is confirmed before continuing.
 * Callers are responsible for catching errors.
 *
 * @param userId - The user whose dataset to improve. Falls back to the shared
 *   COGNEE_USER_ID env var if omitted (dev-only fallback).
 */
export async function improve(
  /** Per-user dataset to optimize. Falls back to the global COGNEE_USER_ID if not supplied. */
  userId?: string | null,
): Promise<unknown> {
  const client = getCogneeClient();
  await client.initialize();

  // Must match the datasetName used in remember() — otherwise improve() runs
  // on the shared service bucket while the user's actual graph goes un-optimized.
  const datasetName = userId?.trim() || client.userId;

  return client.request("/api/v1/improve", {
    method: "POST",
    body: {
      datasetName,
      runInBackground: false,
    },
  });
}

// ── forget() ──────────────────────────────────────────────────────────────

/**
 * Permanently remove all Cognee memories for a given dataset.
 * POST /api/v1/forget — deletes the entire dataset.
 * Throws on failure so callers can surface the error.
 */
export async function forget(userId: string): Promise<ForgetResult> {
  const client = getCogneeClient();
  await client.initialize();

  // BUG FIX: use the caller-supplied userId as the dataset name, NOT client.userId
  // (which is the static COGNEE_USER_ID env var — a different value entirely).
  // memories are stored under the per-user dataset name, so the delete must target
  // that same name, otherwise Cognee returns 500 "An error occurred during deletion."
  const dataset = userId;
  const t = startTimer();

  logForgetStart({ userId, dataset });

  await client.request("/api/v1/forget", {
    method: "POST",
    body: { dataset, everything: false },
  });

  logForgetComplete({ userId, dataset, durationMs: elapsed(t) });

  return {
    success: true,
    datasetDeleted: true,
    message: `Cognee memory dataset "${dataset}" deleted for user ${userId}.`,
  };
}

// ── Shared text-extraction helpers ────────────────────────────────────────

function getRecallText(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const text = record.text ?? record.content ?? record.answer;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function isUsefulMemoryText(memory: string): boolean {
  return !/no (relevant |previous )?(interview )?memor(y|ies)|don't have|do not have|not enough information|unable to find/i.test(
    memory,
  );
}

function splitMemoryLines(memories: string[]): string[] {
  return memories.flatMap((memory) =>
    memory
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•\s]+/, "").trim())
      .filter(Boolean),
  );
}

function normalizeFocusItem(value: string): string {
  return value.replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
}

function extractSectionItems(
  memories: string[],
  sectionNames: string[],
): string[] {
  const lines = splitMemoryLines(memories);
  const sectionPattern = new RegExp(
    `^(${sectionNames.map((n) => n.replace(/\s+/g, "\\s+")).join("|")})\\b[:：]?`,
    "i",
  );
  const nextSectionPattern =
    /^(recurring strengths|technical strengths|strengths|recurring weaknesses|technical weaknesses|weaknesses|previously practiced topics|previously missed topics|missing topic|missing topics|recent recommendations|prior recommendations|recommendations|communication trend|confidence trend|improvement since last interview|areas still needing practice)\b/i;

  const items: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (sectionPattern.test(line)) {
      inSection = true;
      const inline = line.replace(sectionPattern, "").trim();
      if (inline) items.push(normalizeFocusItem(inline));
      continue;
    }
    if (inSection && nextSectionPattern.test(line)) {
      inSection = false;
    }
    if (inSection && !/:$/.test(line)) {
      items.push(normalizeFocusItem(line));
    }
  }

  return Array.from(new Set(items)).slice(0, 5);
}

// ── Generic memory read (used by /dashboard/memory) ──────────────────────

/** Free-form recall for UI display — returns clean fact lines, never throws. */
export async function recallFacts(
  query: string,
  /** User whose Cognee dataset to search. Falls back to COGNEE_USER_ID if omitted. */
  userId?: string | null,
): Promise<string[]> {
  try {
    const result = await recall(query, userId);
    return result
      .map(getRecallText)
      .filter((m): m is string => Boolean(m))
      .filter(isUsefulMemoryText)
      .flatMap((m) => splitMemoryLines([m]));
  } catch (reason) {
    logRecallFailed({
      purpose: "memory-page",
      reason: reason instanceof Error ? reason.message : String(reason),
      durationMs: 0,
    });
    return [];
  }
}

// ── Phase 4/5: recallCandidateMemory() ───────────────────────────────────

function buildCandidateMemoryQuery(params: CandidateMemoryRecallParams): string {
  const company = params.company?.trim() || "the target company";
  const role = params.role?.trim() || "the target role";
  const interviewType = params.interviewType?.trim() || "the upcoming interview";

  return `Retrieve only relevant previous semantic interview memories for candidate ${params.userId} preparing for a ${interviewType} interview for ${role} at ${company}.
Focus on information that should adapt the next Gemini-generated interview.
Return concise structured context using these exact headings when evidence exists:
- Recurring Strengths
- Recurring Weaknesses
- Previously Practiced Topics
- Previously Missed Topics
- Communication Trend
- Confidence Trend
- Improvement Since Last Interview
- Areas Still Needing Practice
- Recent Recommendations
Prioritize repeated patterns over one-off observations. Do not include raw transcripts, resume text, job descriptions, audio, or interview questions.`;
}

function buildCandidateMemoryFocus(memories: string[]): CandidateMemoryFocus {
  return {
    recurringStrengths: extractSectionItems(memories, [
      "Recurring Strengths", "Technical Strengths", "Strengths",
    ]),
    recurringWeaknesses: extractSectionItems(memories, [
      "Recurring Weaknesses", "Technical Weaknesses", "Weaknesses",
    ]),
    previouslyMissedTopics: extractSectionItems(memories, [
      "Previously Missed Topics", "Missing Topics", "Missing Topic",
    ]),
    recentRecommendations: extractSectionItems(memories, [
      "Recent Recommendations", "Prior Recommendations", "Recommendations",
    ]),
  };
}

function formatCandidateMemory(memories: string[]): string | null {
  if (memories.length === 0) return null;
  return memories
    .map((m, i) => `Memory ${i + 1}:\n${m}`)
    .join("\n\n")
    .slice(0, 3500);
}

/** Baseline candidate context: first interview / Cognee not consulted. */
export const EMPTY_CANDIDATE_CONTEXT: CandidateMemoryContext = {
  memories: [],
  formatted: null,
  count: 0,
  focus: {
    recurringStrengths: [],
    recurringWeaknesses: [],
    previouslyMissedTopics: [],
    recentRecommendations: [],
  },
};

export async function recallCandidateMemory(
  params: CandidateMemoryRecallParams,
  /** Optional: pass interviewId to record retrieval metrics in pipeline usage. */
  interviewId?: string | null,
): Promise<CandidateMemoryContext> {
  const empty = EMPTY_CANDIDATE_CONTEXT;

  // ── First-interview optimization ──────────────────────────────────────────
  // If there is no Cognee memory for this user, skip retrieval entirely.
  // A failed prior save means nothing to retrieve — SKIPPED is the correct status.
  if (interviewId) {
    const hasMemory = await hasCogneeMemory(params.userId);
    if (!hasMemory) {
      await markCogneeRetrievalSkipped(interviewId);
      log("No Cognee memory found — skipping retrieval for first interview");
      return empty;
    }
  }

  const t = startTimer();
  const retrievalStartedAt = Date.now();

  if (interviewId) {
    await markCogneeRetrievalStart(interviewId);
  }

  logRecallStart({
    purpose: "question-generation",
    userId: params.userId,
    role: params.role,
    company: params.company,
    interviewType: params.interviewType,
  });

  try {
    const result = await recall(buildCandidateMemoryQuery(params), params.userId);
    const memories = result
      .map(getRecallText)
      .filter((m): m is string => Boolean(m))
      .filter(isUsefulMemoryText);

    logRecallComplete({
      purpose: "question-generation",
      count: memories.length,
      durationMs: elapsed(t),
    });

    if (interviewId) {
      await markCogneeRetrievalSuccess(
        interviewId,
        memories.length,
        0, // Cognee /recall doesn't expose edge counts
        Date.now() - retrievalStartedAt,
      );
    }

    if (memories.length === 0) return empty;

    const focus = buildCandidateMemoryFocus(memories);

    debug("Personalization focus extracted", {
      recurringWeaknesses: focus.recurringWeaknesses,
      recurringStrengths: focus.recurringStrengths,
      previouslyMissedTopics: focus.previouslyMissedTopics,
    });

    return {
      memories,
      formatted: formatCandidateMemory(memories),
      count: memories.length,
      focus,
    };
  } catch (reason) {
    logRecallFailed({
      purpose: "question-generation",
      reason: reason instanceof Error ? reason.message : String(reason),
      durationMs: elapsed(t),
    });
    if (interviewId) {
      await markCogneeRetrievalFailed(
        interviewId,
        Date.now() - retrievalStartedAt,
        classifyFailureReason(reason),
        sanitizeError(reason),
      );
    }
    return empty;
  }
}


// ── Phase 6: recallHistoricalMemory() ────────────────────────────────────

function buildHistoricalEvaluationQuery(
  params: HistoricalEvaluationRecallParams,
): string {
  const role = params.role?.trim() || "this role";
  const interviewType = params.interviewType?.trim() || "this interview type";

  return `Retrieve the full historical interview performance record for candidate ${params.userId} for ${interviewType} interviews targeting ${role}.
Include all available information about:
- Previous overall scores, technical scores, communication scores, confidence scores, behavioral scores, problem-solving scores
- Recurring technical strengths observed across interviews
- Recurring technical weaknesses and gaps observed across interviews
- Communication quality trend across interviews (e.g., Improving, Stable, Declining)
- Confidence trend across interviews
- Topics that were previously weak but have improved since
- Topics that have been recommended repeatedly but remain unresolved
- Topics the candidate has mastered and need not be re-tested
- Improvement summary since last interview
Return this as structured evaluation context for Gemini to use when comparing the current interview against the candidate's progress history. Do not include raw transcripts, resume text, or interview questions.`;
}

function parseScoreFromMemory(memories: string[], labels: string[]): number | null {
  const lines = splitMemoryLines(memories);
  const pattern = new RegExp(
    `(${labels.map((l) => l.replace(/\s+/g, "\\s+")).join("|")})\\s*[:：]?\\s*(\\d{1,3})`,
    "i",
  );
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) {
      const score = Number(match[2]);
      if (score >= 0 && score <= 100) return score;
    }
  }
  return null;
}

function extractTrendValue(memories: string[], labels: string[]): string | null {
  const lines = splitMemoryLines(memories);
  const pattern = new RegExp(
    `(${labels.map((l) => l.replace(/\s+/g, "\\s+")).join("|")})\\s*[:：]?\\s*(.+)`,
    "i",
  );
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) {
      const value = match[2].trim();
      return value.length > 0 && value.length < 120 ? value : null;
    }
  }
  return null;
}

function buildHistoricalTrends(memories: string[]): HistoricalEvaluationContext["trends"] {
  return {
    recurringStrengths: extractSectionItems(memories, [
      "Recurring Strengths", "Technical Strengths", "Stable Strengths", "Strengths",
    ]),
    recurringWeaknesses: extractSectionItems(memories, [
      "Recurring Weaknesses", "Technical Weaknesses", "Still Needs Improvement", "Weaknesses",
    ]),
    communicationTrend: extractTrendValue(memories, ["Communication Trend", "Communication"]),
    confidenceTrend: extractTrendValue(memories, ["Confidence Trend", "Confidence"]),
    improvementAreas: extractSectionItems(memories, [
      "Improved Areas", "Improvement Since Last Interview", "Areas Improved", "Topics Improved",
    ]),
    stillNeedsWork: extractSectionItems(memories, [
      "Still Needs Improvement", "Areas Still Needing Practice", "Remaining Weaknesses",
    ]),
    previousRecommendations: extractSectionItems(memories, [
      "Recent Recommendations", "Prior Recommendations", "Recommendations",
    ]),
  };
}

function buildPreviousScores(memories: string[]): HistoricalEvaluationContext["previousScores"] {
  return {
    overall: parseScoreFromMemory(memories, ["Overall Score", "Overall"]),
    technical: parseScoreFromMemory(memories, ["Technical Score", "Technical"]),
    communication: parseScoreFromMemory(memories, ["Communication Score", "Communication"]),
    confidence: parseScoreFromMemory(memories, ["Confidence Score", "Confidence"]),
    behavioral: parseScoreFromMemory(memories, ["Behavioral Score", "Behavioral"]),
    problemSolving: parseScoreFromMemory(memories, [
      "Problem-Solving Score", "Problem Solving Score", "Problem-Solving", "Problem Solving",
    ]),
  };
}

function formatHistoricalMemory(memories: string[]): string | null {
  if (memories.length === 0) return null;
  return memories
    .map((m, i) => `Historical Record ${i + 1}:\n${m}`)
    .join("\n\n")
    .slice(0, 4000);
}

/** Baseline historical context: no prior interviews / Cognee not consulted. */
export const EMPTY_HISTORICAL_CONTEXT: HistoricalEvaluationContext = {
  memories: [],
  formatted: null,
  count: 0,
  previousScores: {
    overall: null, technical: null, communication: null,
    confidence: null, behavioral: null, problemSolving: null,
  },
  trends: {
    recurringStrengths: [], recurringWeaknesses: [],
    communicationTrend: null, confidenceTrend: null,
    improvementAreas: [], stillNeedsWork: [], previousRecommendations: [],
  },
};

export async function recallHistoricalMemory(
  params: HistoricalEvaluationRecallParams,
): Promise<HistoricalEvaluationContext> {
  const empty = EMPTY_HISTORICAL_CONTEXT;

  const t = startTimer();

  logRecallStart({
    purpose: "evaluation-history",
    userId: params.userId,
    role: params.role,
    interviewType: params.interviewType,
  });

  try {
    const result = await recall(buildHistoricalEvaluationQuery(params), params.userId);
    const memories = result
      .map(getRecallText)
      .filter((m): m is string => Boolean(m))
      .filter(isUsefulMemoryText);

    logRecallComplete({
      purpose: "evaluation-history",
      count: memories.length,
      durationMs: elapsed(t),
    });

    if (memories.length === 0) {
      log("No historical memory found — evaluating as baseline");
      return empty;
    }

    const previousScores = buildPreviousScores(memories);
    const trends = buildHistoricalTrends(memories);

    debug("Historical trends extracted", {
      hasPreviousOverallScore: previousScores.overall !== null,
      recurringWeaknesses: trends.recurringWeaknesses,
      recurringStrengths: trends.recurringStrengths,
    });

    return {
      memories,
      formatted: formatHistoricalMemory(memories),
      count: memories.length,
      previousScores,
      trends,
    };
  } catch (reason) {
    logRecallFailed({
      purpose: "evaluation-history",
      reason: reason instanceof Error ? reason.message : String(reason),
      durationMs: elapsed(t),
    });
    return empty;
  }
}
