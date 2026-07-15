/**
 * services/memory.service.ts
 *
 * Orchestrates interview memory persistence: validate → build → remember → improve.
 *
 * Phase 8: uses structured logger, timing, and validateMemory() before
 * calling remember(). Legacy dead code (rememberEvaluation, getMemory,
 * queryMemory) removed — those functions were never called from production
 * code paths and referenced a legacy in-process Cognee stub.
 */

import {
  improve as improveInCognee,
  remember as rememberInCognee,
} from "@/services/cognee.service";
import {
  buildMemory,
  type MemoryBuilderReport,
} from "@/services/memory-builder.service";
import {
  startTimer,
  elapsed,
  log,
  logRememberStart,
  logRememberComplete,
  logRememberFailed,
  logImproveStart,
  logImproveComplete,
  logImproveFailed,
  logValidationFailed,
} from "@/lib/cognee/logger";
import { validateMemory } from "@/lib/cognee/validator";

// ── Helpers ───────────────────────────────────────────────────────────────

function getRememberResultId(result: unknown): string {
  if (!result || typeof result !== "object") return "unknown";
  const record = result as Record<string, unknown>;
  const id =
    record.id ?? record.data_id ?? record.dataset_id ?? record.pipeline_run_id;
  return typeof id === "string" && id ? id : "unknown";
}

function getErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Build, validate, and persist interview memory to Cognee.
 *
 * Flow:
 *   buildMemory(report)
 *   → validateMemory(memory)     — skip and log if invalid
 *   → remember(memory)           — timed, errors logged not thrown
 *   → improve()                  — timed, errors logged not thrown
 *
 * This function never throws. All Cognee failures are logged and swallowed
 * so interview/report completion is never blocked.
 */
export async function persistInterviewMemory(
  report: MemoryBuilderReport,
  options?: { historicalTrend?: string | null },
): Promise<void> {
  // 1. Build semantic memory
  log("Building semantic memory");
  const memory = buildMemory(report, options);

  // 2. Validate before touching Cognee
  const validation = validateMemory(memory);
  if (!validation.valid) {
    logValidationFailed({
      interviewId: memory.interviewId,
      issues: validation.issues,
    });
    return;
  }

  // 3. remember()
  const rememberTimer = startTimer();
  logRememberStart({ interviewId: memory.interviewId, userId: memory.userId });

  try {
    // Pass memory.userId so memories go into the user's own Cognee dataset.
    // Without this, all users share one dataset and concurrent writes cause 409 conflicts.
    const result = await rememberInCognee(memory, memory.userId, memory.interviewId);
    const memoryId = getRememberResultId(result);
    logRememberComplete({
      interviewId: memory.interviewId,
      memoryId,
      durationMs: elapsed(rememberTimer),
    });
  } catch (reason) {
    logRememberFailed({
      interviewId: memory.interviewId,
      reason: getErrorMessage(reason),
      durationMs: elapsed(rememberTimer),
    });
    // remember() failed — skip improve(), return gracefully
    return;
  }

  // 4. improve() — best-effort, never blocks completion
  const improveTimer = startTimer();
  logImproveStart();

  try {
    // Pass memory.userId so improve() enriches the same dataset that remember() wrote to.
    await improveInCognee(memory.userId);
    logImproveComplete(elapsed(improveTimer));
  } catch (reason) {
    logImproveFailed(getErrorMessage(reason), elapsed(improveTimer));
  }
}
