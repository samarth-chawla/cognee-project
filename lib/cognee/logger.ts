/**
 * lib/cognee/logger.ts
 *
 * Phase 8 – Production Hardening: Centralized structured logger for all
 * Cognee operations.
 *
 * Design decisions:
 * - All logs are prefixed with [Cognee] for grepping.
 * - Timing helpers (startTimer / elapsed) measure wall-clock ms for each op.
 * - Verbose / debug output is gated behind NODE_ENV !== "production" to keep
 *   prod logs clean. Warnings and errors are always emitted.
 * - No external logging library is introduced — uses console.* so it works
 *   inside Next.js edge, Node.js, and serverless environments unchanged.
 */

const PREFIX = "[Cognee]";

// ── Log-level constants ───────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production";

// ── Timing helpers ────────────────────────────────────────────────────────

/** Returns a high-resolution start timestamp (ms). */
export function startTimer(): number {
  return Date.now();
}

/** Returns elapsed milliseconds since startTimer() was called. */
export function elapsed(start: number): number {
  return Date.now() - start;
}

/** Formats elapsed time as a human-readable string: "412 ms". */
export function formatMs(ms: number): string {
  return `${ms} ms`;
}

// ── Core log functions ────────────────────────────────────────────────────

/** Always emitted — normal operation milestones. */
export function log(operation: string, data?: Record<string, unknown>): void {
  if (data && Object.keys(data).length > 0) {
    console.log(`${PREFIX} ${operation}`, data);
  } else {
    console.log(`${PREFIX} ${operation}`);
  }
}

/**
 * Emitted only in non-production environments.
 * Use for verbose debug details (full memory text, prompt length, focus arrays).
 */
export function debug(operation: string, data?: Record<string, unknown>): void {
  if (IS_PROD) return;
  if (data && Object.keys(data).length > 0) {
    console.log(`${PREFIX} ${operation}`, data);
  } else {
    console.log(`${PREFIX} ${operation}`);
  }
}

/** Always emitted — non-fatal issues that should be investigated. */
export function warn(operation: string, data?: Record<string, unknown>): void {
  if (data && Object.keys(data).length > 0) {
    console.warn(`${PREFIX} ${operation}`, data);
  } else {
    console.warn(`${PREFIX} ${operation}`);
  }
}

/** Always emitted — failures. */
export function error(operation: string, data?: Record<string, unknown>): void {
  if (data && Object.keys(data).length > 0) {
    console.error(`${PREFIX} ${operation}`, data);
  } else {
    console.error(`${PREFIX} ${operation}`);
  }
}

// ── Operation-specific structured log helpers ─────────────────────────────

export function logRecallStart(context: {
  userId: string;
  role?: string | null;
  company?: string | null;
  interviewType?: string | null;
  purpose: "question-generation" | "evaluation-history" | "memory-page";
}): void {
  log("Recall started", {
    purpose: context.purpose,
    userId: context.userId,
    role: context.role ?? null,
    company: context.company ?? null,
    interviewType: context.interviewType ?? null,
  });
}

export function logRecallComplete(context: {
  purpose: "question-generation" | "evaluation-history" | "memory-page";
  count: number;
  durationMs: number;
}): void {
  log("Recall completed", {
    purpose: context.purpose,
    retrieved: context.count,
    duration: formatMs(context.durationMs),
  });
}

export function logRecallFailed(context: {
  purpose: "question-generation" | "evaluation-history" | "memory-page";
  reason: string;
  durationMs: number;
}): void {
  warn("Recall failed — continuing without memory", {
    purpose: context.purpose,
    reason: context.reason,
    duration: formatMs(context.durationMs),
  });
}

export function logRememberStart(context: {
  interviewId: string | null;
  userId: string | null;
}): void {
  log("Remember started", {
    interviewId: context.interviewId,
    userId: context.userId,
  });
}

export function logRememberComplete(context: {
  interviewId: string | null;
  memoryId: string;
  durationMs: number;
}): void {
  log("Memory stored", {
    interviewId: context.interviewId,
    memoryId: context.memoryId,
    duration: formatMs(context.durationMs),
  });
}

export function logRememberFailed(context: {
  interviewId: string | null;
  reason: string;
  durationMs: number;
}): void {
  warn("Remember failed — memory not persisted", {
    interviewId: context.interviewId,
    reason: context.reason,
    duration: formatMs(context.durationMs),
  });
}

export function logImproveStart(): void {
  log("Improve started");
}

export function logImproveComplete(durationMs: number): void {
  log("Memory graph optimized", { duration: formatMs(durationMs) });
}

export function logImproveFailed(reason: string, durationMs: number): void {
  warn("Improve failed — graph not optimized", {
    reason,
    duration: formatMs(durationMs),
  });
}

export function logForgetStart(context: {
  userId: string;
  dataset: string;
}): void {
  log("Forget started", { userId: context.userId, dataset: context.dataset });
}

export function logForgetComplete(context: {
  userId: string;
  dataset: string;
  durationMs: number;
}): void {
  log("Memory dataset deleted", {
    userId: context.userId,
    dataset: context.dataset,
    duration: formatMs(context.durationMs),
  });
}

export function logForgetFailed(context: {
  userId: string;
  reason: string;
  durationMs: number;
}): void {
  error("Forget failed — memories may remain", {
    userId: context.userId,
    reason: context.reason,
    duration: formatMs(context.durationMs),
  });
}

export function logValidationFailed(context: {
  interviewId: string | null;
  issues: string[];
}): void {
  warn("Memory validation failed — skipping remember()", {
    interviewId: context.interviewId,
    issues: context.issues,
  });
}

export function logPersonalizationSummary(context: {
  hasMemory: boolean;
  recurringWeaknesses: string[];
  recurringStrengths: string[];
  promptLength: number;
}): void {
  debug("Personalization applied", {
    hasMemory: context.hasMemory,
    recurringWeaknesses: context.recurringWeaknesses,
    recurringStrengths: context.recurringStrengths,
    promptLength: context.promptLength,
  });
}

// NOTE: report-generation Gemini calls are NOT Cognee. They log under a
// [Gemini] prefix so the timeline doesn't look like Cognee runs before the
// report. Cognee memory writes (remember/improve) happen only AFTER the report
// is saved, via persistInterviewMemory.
export function logEvaluationStart(context: {
  interviewId: string;
  hasHistory: boolean;
}): void {
  console.log("[Gemini] evaluation started", {
    interviewId: context.interviewId,
    hasHistory: context.hasHistory,
  });
}

export function logEvaluationComplete(context: {
  interviewId: string;
  hasHistoricalProgress: boolean;
  durationMs: number;
}): void {
  console.log("[Gemini] evaluation completed", {
    interviewId: context.interviewId,
    hasHistoricalProgress: context.hasHistoricalProgress,
    duration: formatMs(context.durationMs),
  });
}

// Namespace export for convenience: import * as cogneeLog from "@/lib/cognee/logger"
export const cogneeLog = {
  log,
  debug,
  warn,
  error,
  startTimer,
  elapsed,
  formatMs,
  logRecallStart,
  logRecallComplete,
  logRecallFailed,
  logRememberStart,
  logRememberComplete,
  logRememberFailed,
  logImproveStart,
  logImproveComplete,
  logImproveFailed,
  logForgetStart,
  logForgetComplete,
  logForgetFailed,
  logValidationFailed,
  logPersonalizationSummary,
  logEvaluationStart,
  logEvaluationComplete,
};
