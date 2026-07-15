/**
 * services/pipelineUsage.service.ts
 *
 * Single service for all InterviewPipelineUsage CRUD.
 *
 * Design principles:
 * - All updates are best-effort: always awaited (no lost metrics on early exit)
 *   but wrapped in try/catch so observability failures never crash the pipeline.
 * - hasCogneeMemory() is the first-interview guard — checks real Cognee state,
 *   not just whether a completed interview exists in the DB.
 * - finalizeUsage() is always called at interview end to seal the row.
 */

import "server-only";

import { prisma } from "@/lib/db/prisma";
import { PipelineStatus, PipelineFailureReason, Prisma } from "@prisma/client";
import {
  calculateGeminiCost,
  calculateDeepgramCost,
  calculateCogneeCost,
  calculateTotalPipelineCost,
  getCurrentPricingVersion,
  PIPELINE_VERSION,
} from "@/lib/ai/pricing";
import { recall } from "@/services/cognee.service";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeminiUsageMetadata {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface StageUpdateData {
  status?: PipelineStatus;
  failureReason?: PipelineFailureReason;
  lastError?: string | null;
  attemptCountDelta?: number; // added to current value
  retryCountDelta?: number;   // added to current value
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  // Stage-specific extras — typed loosely, Prisma will validate
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create the pipeline usage row when an interview is first kicked off.
 * Pulls metadata from the Interview row for dashboard denormalization.
 * Checks hasCogneeMemory() to set isFirstInterview flag.
 */
export async function initPipelineUsage(
  interviewId: string,
  userId: string,
): Promise<void> {
  try {
    // Pull interview metadata for dashboard denormalization
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        role: true,
        company: true,
        customCompanyName: true,
        difficulty: true,
        user: {
          select: {
            profile: { select: { preferredInterviewMode: true } },
          },
        },
      },
    });

    const isFirst = !(await hasCogneeMemory(userId));

    await prisma.interviewPipelineUsage.upsert({
      where: { interviewId },
      create: {
        interviewId,
        userId,
        pipelineStatus: PipelineStatus.PENDING,
        pipelineStartedAt: new Date(),
        pricingVersion: getCurrentPricingVersion(),
        pipelineVersion: PIPELINE_VERSION,
        currency: "USD",
        isFirstInterview: isFirst,
        role: interview?.role ?? null,
        company: interview?.customCompanyName ?? interview?.company ?? null,
        difficulty: interview?.difficulty ?? null,
        interviewMode:
          interview?.user?.profile?.preferredInterviewMode ?? null,
      },
      // Idempotent — if row already exists (e.g. retry), don't overwrite
      update: {},
    });
  } catch (err) {
    // Best-effort: never block the interview if observability write fails
    console.error("[PipelineUsage] initPipelineUsage failed", { interviewId, err });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage updates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Best-effort update of any stage fields on the usage row.
 * Always awaited (so metrics aren't lost on process exit) but wrapped in
 * try/catch so failures never cascade to the main pipeline.
 */
export async function updateStage(
  interviewId: string,
  data: Prisma.InterviewPipelineUsageUpdateInput,
): Promise<void> {
  try {
    await prisma.interviewPipelineUsage.update({
      where: { interviewId },
      data,
    });
  } catch (err) {
    console.error("[PipelineUsage] updateStage failed", { interviewId, err });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage-specific helpers (typed wrappers around updateStage)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Question Generation ─────────────────────────────────────────────────────

export async function markQuestionGenerationStart(interviewId: string): Promise<void> {
  await updateStage(interviewId, {
    pipelineStatus: PipelineStatus.PROCESSING,
    questionGenerationStatus: PipelineStatus.PROCESSING,
    questionGenerationStartedAt: new Date(),
    questionGenerationAttemptCount: { increment: 1 },
  });
}

export async function markQuestionGenerationSuccess(
  interviewId: string,
  usage: GeminiUsageMetadata,
  durationMs: number,
): Promise<void> {
  const cost = calculateGeminiCost(usage.model, usage.inputTokens, usage.outputTokens);

  await updateStage(interviewId, {
    questionGenerationStatus: PipelineStatus.SUCCESS,
    questionGenerationCompletedAt: new Date(),
    questionGenerationDurationMs: durationMs,
    geminiModel: usage.model,
    geminiInputTokens: usage.inputTokens,
    geminiOutputTokens: usage.outputTokens,
    geminiTotalTokens: usage.totalTokens,
    geminiInputCostUsd: new Prisma.Decimal(cost.inputCostUsd),
    geminiOutputCostUsd: new Prisma.Decimal(cost.outputCostUsd),
    geminiTotalCostUsd: new Prisma.Decimal(cost.totalCostUsd),
  });
}

export async function markQuestionGenerationFailed(
  interviewId: string,
  durationMs: number,
  reason: PipelineFailureReason,
  lastError: string | null,
): Promise<void> {
  await updateStage(interviewId, {
    questionGenerationStatus: PipelineStatus.FAILED,
    questionGenerationFailureReason: reason,
    questionGenerationLastError: lastError,
    questionGenerationCompletedAt: new Date(),
    questionGenerationDurationMs: durationMs,
    questionGenerationRetryCount: { increment: 1 },
  });
}

// ─── Deepgram Voice ──────────────────────────────────────────────────────────

export async function markDeepgramStart(interviewId: string, model?: string): Promise<void> {
  await updateStage(interviewId, {
    deepgramStatus: PipelineStatus.PROCESSING,
    deepgramStartedAt: new Date(),
    deepgramAttemptCount: { increment: 1 },
    ...(model ? { deepgramModel: model } : {}),
  });
}

export async function accumulateDeepgramAudio(
  interviewId: string,
  additionalSeconds: number,
): Promise<void> {
  // Increment audio seconds — this is called per voice turn
  try {
    await prisma.interviewPipelineUsage.update({
      where: { interviewId },
      data: {
        deepgramAudioSeconds: { increment: additionalSeconds },
      },
    });
  } catch (err) {
    console.error("[PipelineUsage] accumulateDeepgramAudio failed", { interviewId, err });
  }
}

export async function markDeepgramSuccess(
  interviewId: string,
  totalAudioSeconds: number,
  durationMs: number,
): Promise<void> {
  const cost = calculateDeepgramCost(totalAudioSeconds);
  await updateStage(interviewId, {
    deepgramStatus: PipelineStatus.SUCCESS,
    deepgramCompletedAt: new Date(),
    deepgramDurationMs: durationMs,
    deepgramAudioSeconds: totalAudioSeconds,
    deepgramCostUsd: new Prisma.Decimal(cost),
  });
}

export async function markDeepgramFailed(
  interviewId: string,
  durationMs: number,
  reason: PipelineFailureReason,
  lastError: string | null,
): Promise<void> {
  await updateStage(interviewId, {
    deepgramStatus: PipelineStatus.FAILED,
    deepgramFailureReason: reason,
    deepgramLastError: lastError,
    deepgramCompletedAt: new Date(),
    deepgramDurationMs: durationMs,
    deepgramRetryCount: { increment: 1 },
  });
}

// ─── Report Generation ───────────────────────────────────────────────────────

export async function markReportGenerationStart(interviewId: string): Promise<void> {
  await updateStage(interviewId, {
    reportGenerationStatus: PipelineStatus.PROCESSING,
    reportGenerationStartedAt: new Date(),
    reportGenerationAttemptCount: { increment: 1 },
  });
}

export async function markReportGenerationSuccess(
  interviewId: string,
  usage: GeminiUsageMetadata,
  reportSizeBytes: number,
  durationMs: number,
): Promise<void> {
  const cost = calculateGeminiCost(usage.model, usage.inputTokens, usage.outputTokens);

  await updateStage(interviewId, {
    reportGenerationStatus: PipelineStatus.SUCCESS,
    reportGenerationCompletedAt: new Date(),
    reportGenerationDurationMs: durationMs,
    reportGeminiModel: usage.model,
    reportInputTokens: usage.inputTokens,
    reportOutputTokens: usage.outputTokens,
    reportTotalTokens: usage.totalTokens,
    reportSizeBytes,
    reportInputCostUsd: new Prisma.Decimal(cost.inputCostUsd),
    reportOutputCostUsd: new Prisma.Decimal(cost.outputCostUsd),
    reportTotalCostUsd: new Prisma.Decimal(cost.totalCostUsd),
  });
}

export async function markReportGenerationFailed(
  interviewId: string,
  durationMs: number,
  reason: PipelineFailureReason,
  lastError: string | null,
): Promise<void> {
  await updateStage(interviewId, {
    reportGenerationStatus: PipelineStatus.FAILED,
    reportGenerationFailureReason: reason,
    reportGenerationLastError: lastError,
    reportGenerationCompletedAt: new Date(),
    reportGenerationDurationMs: durationMs,
    reportGenerationRetryCount: { increment: 1 },
  });
}

// ─── Cognee Save ─────────────────────────────────────────────────────────────

export async function markCogneeSaveStart(interviewId: string): Promise<void> {
  await updateStage(interviewId, {
    cogneeSaveStatus: PipelineStatus.PROCESSING,
    cogneeSaveStartedAt: new Date(),
    cogneeSaveAttemptCount: { increment: 1 },
  });
}

export async function markCogneeSaveSuccess(
  interviewId: string,
  nodesCreated: number,
  edgesCreated: number,
  durationMs: number,
): Promise<void> {
  await updateStage(interviewId, {
    cogneeSaveStatus: PipelineStatus.SUCCESS,
    cogneeSaveCompletedAt: new Date(),
    cogneeSaveDurationMs: durationMs,
    cogneeNodesCreated: nodesCreated,
    cogneeEdgesCreated: edgesCreated,
    cogneeSaveCostUsd: new Prisma.Decimal(calculateCogneeCost()),
  });
}

export async function markCogneeSaveFailed(
  interviewId: string,
  durationMs: number,
  reason: PipelineFailureReason,
  lastError: string | null,
): Promise<void> {
  await updateStage(interviewId, {
    cogneeSaveStatus: PipelineStatus.FAILED,
    cogneeSaveFailureReason: reason,
    cogneeSaveLastError: lastError,
    cogneeSaveCompletedAt: new Date(),
    cogneeSaveDurationMs: durationMs,
    cogneeSaveRetryCount: { increment: 1 },
  });
}

// ─── Cognee Retrieval ────────────────────────────────────────────────────────

export async function markCogneeRetrievalStart(interviewId: string): Promise<void> {
  await updateStage(interviewId, {
    cogneeRetrievalStatus: PipelineStatus.PROCESSING,
    cogneeRetrievalStartedAt: new Date(),
    cogneeRetrievalAttemptCount: { increment: 1 },
  });
}

export async function markCogneeRetrievalSkipped(interviewId: string): Promise<void> {
  await updateStage(interviewId, {
    cogneeRetrievalStatus: PipelineStatus.SKIPPED,
    cogneeRetrievalStartedAt: new Date(),
    cogneeRetrievalCompletedAt: new Date(),
    cogneeRetrievalDurationMs: 0,
    cogneeRetrievalAttemptCount: 0,
    cogneeRetrievedNodes: 0,
    cogneeRetrievedEdges: 0,
    cogneeRetrievalCostUsd: new Prisma.Decimal(0),
  });
}

export async function markCogneeRetrievalSuccess(
  interviewId: string,
  retrievedNodes: number,
  retrievedEdges: number,
  durationMs: number,
): Promise<void> {
  await updateStage(interviewId, {
    cogneeRetrievalStatus: PipelineStatus.SUCCESS,
    cogneeRetrievalCompletedAt: new Date(),
    cogneeRetrievalDurationMs: durationMs,
    cogneeRetrievedNodes: retrievedNodes,
    cogneeRetrievedEdges: retrievedEdges,
    cogneeRetrievalCostUsd: new Prisma.Decimal(calculateCogneeCost()),
  });
}

export async function markCogneeRetrievalFailed(
  interviewId: string,
  durationMs: number,
  reason: PipelineFailureReason,
  lastError: string | null,
): Promise<void> {
  await updateStage(interviewId, {
    cogneeRetrievalStatus: PipelineStatus.FAILED,
    cogneeRetrievalFailureReason: reason,
    cogneeRetrievalLastError: lastError,
    cogneeRetrievalCompletedAt: new Date(),
    cogneeRetrievalDurationMs: durationMs,
    cogneeRetrievalRetryCount: { increment: 1 },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Finalize
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gracefully ends the Deepgram usage tracking if it was left PROCESSING.
 */
export async function finalizeDeepgram(
  interviewId: string,
  opts?: { failed?: boolean }
): Promise<void> {
  try {
    const row = await prisma.interviewPipelineUsage.findUnique({
      where: { interviewId },
      select: { deepgramStatus: true, deepgramStartedAt: true, deepgramAudioSeconds: true }
    });
    
    if (!row || row.deepgramStatus !== PipelineStatus.PROCESSING || !row.deepgramStartedAt) {
      return;
    }
    
    const durationMs = Date.now() - row.deepgramStartedAt.getTime();
    
    if (opts?.failed) {
      await markDeepgramFailed(
        interviewId, 
        durationMs, 
        PipelineFailureReason.UNKNOWN, 
        "Session aborted"
      );
    } else {
      await markDeepgramSuccess(interviewId, row.deepgramAudioSeconds ?? 0, durationMs);
    }
  } catch (err) {
    console.error("[PipelineUsage] finalizeDeepgram failed", { interviewId, err });
  }
}


/**
 * Seal the pipeline usage row after the interview fully completes.
 * Computes totalPipelineCostUsd, totalPipelineDurationMs, pipelineStatus,
 * and optionally updates reportScore.
 */
export async function finalizeUsage(
  interviewId: string,
  opts?: { reportScore?: number; failed?: boolean },
): Promise<void> {
  try {
    const row = await prisma.interviewPipelineUsage.findUnique({
      where: { interviewId },
      select: {
        pipelineStartedAt: true,
        questionGenerationStatus: true,
        deepgramStatus: true,
        reportGenerationStatus: true,
        cogneeSaveStatus: true,
        cogneeRetrievalStatus: true,
        geminiTotalCostUsd: true,
        reportTotalCostUsd: true,
        deepgramCostUsd: true,
        cogneeSaveCostUsd: true,
        cogneeRetrievalCostUsd: true,
      },
    });

    if (!row) {
      console.warn("[PipelineUsage] finalizeUsage: row not found", { interviewId });
      return;
    }

    const stages = [
      { name: "questionGeneration", status: row.questionGenerationStatus },
      { name: "deepgram", status: row.deepgramStatus },
      { name: "reportGeneration", status: row.reportGenerationStatus },
      { name: "cogneeSave", status: row.cogneeSaveStatus },
      { name: "cogneeRetrieval", status: row.cogneeRetrievalStatus },
    ];

    // Issue #6: If ANY stage is PROCESSING, DO NOT finalize.
    const processingStages = stages.filter((s) => s.status === PipelineStatus.PROCESSING);
    if (processingStages.length > 0) {
      console.error("[PipelineUsage] finalizeUsage: Cannot finalize, stages still PROCESSING", {
        interviewId,
        processingStages: processingStages.map(s => s.name)
      });
      return;
    }

    // Issues #4 & #5: Handle PENDING stages (e.g. from cancelled interview or early failure)
    const pendingStages = stages.filter((s) => s.status === PipelineStatus.PENDING);
    if (pendingStages.length > 0) {
      console.error("[PipelineUsage] finalizeUsage: Cannot finalize, stages still PENDING", {
        interviewId,
        pendingStages: pendingStages.map(s => s.name)
      });
      return;
    }

    const now = new Date();
    const updateData: Prisma.InterviewPipelineUsageUpdateInput = {};

    // Determine pipeline status based on all stages and explicit opts.failed flag
    const hasFailed = stages.some((s) => s.status === PipelineStatus.FAILED);
    const finalPipelineStatus = (hasFailed || opts?.failed) 
      ? PipelineStatus.FAILED 
      : PipelineStatus.SUCCESS;

    const startedAt = row.pipelineStartedAt ?? now;
    const totalDurationMs = now.getTime() - startedAt.getTime();

    const totalCost = calculateTotalPipelineCost(
      row.geminiTotalCostUsd ? Number(row.geminiTotalCostUsd) : 0,
      row.reportTotalCostUsd ? Number(row.reportTotalCostUsd) : 0,
      row.deepgramCostUsd ? Number(row.deepgramCostUsd) : 0,
      row.cogneeSaveCostUsd ? Number(row.cogneeSaveCostUsd) : 0,
      row.cogneeRetrievalCostUsd ? Number(row.cogneeRetrievalCostUsd) : 0,
    );

    await prisma.interviewPipelineUsage.update({
      where: { interviewId },
      data: {
        ...updateData,
        pipelineStatus: finalPipelineStatus,
        pipelineCompletedAt: now,
        totalPipelineDurationMs: totalDurationMs,
        totalPipelineCostUsd: new Prisma.Decimal(totalCost),
        ...(opts?.reportScore !== undefined ? { reportScore: opts.reportScore } : {}),
      },
    });
  } catch (err) {
    console.error("[PipelineUsage] finalizeUsage failed", { interviewId, err });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// First-interview detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the user has any Cognee memory data (i.e., at least one
 * successful Cognee save exists). This is more reliable than checking for a
 * completed interview, since a user could have a completed interview but with a
 * failed Cognee save — in which case retrieval would return nothing anyway.
 *
 * Falls back to false (skip retrieval = safe) if the Cognee check itself fails.
 */
export async function hasCogneeMemory(userId: string): Promise<boolean> {
  try {
    // Check our own DB first (faster, no Cognee network call)
    const successfulSave = await prisma.interviewPipelineUsage.findFirst({
      where: {
        userId,
        cogneeSaveStatus: PipelineStatus.SUCCESS,
      },
      select: { id: true },
    });
    if (successfulSave) return true;

    // Fallback: ask Cognee directly for a lightweight recall
    // A non-empty result means memory exists even if our DB record is missing
    const result = await recall("interview history", userId);
    return Array.isArray(result) && result.length > 0;
  } catch {
    // Safe default: skip retrieval if we can't determine memory state
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Failure reason classifier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a raw error to a PipelineFailureReason enum value.
 * Never expose the raw error — use sanitizeError() before storing lastError.
 */
export function classifyFailureReason(error: unknown): PipelineFailureReason {
  if (!(error instanceof Error)) return PipelineFailureReason.UNKNOWN;

  const msg = error.message.toLowerCase();

  if (/429|quota|rate.?limit|resource.?exhausted/i.test(msg))
    return PipelineFailureReason.RATE_LIMITED;

  if (/timeout|timed.?out|deadline/i.test(msg))
    return PipelineFailureReason.TIMEOUT;

  if (/econnreset|econnrefused|enotfound|network|fetch.?failed|socket/i.test(msg))
    return PipelineFailureReason.NETWORK_ERROR;

  if (/503|502|service.?unavailable|unavailable|overloaded/i.test(msg))
    return PipelineFailureReason.SERVICE_UNAVAILABLE;

  if (/p\d{4}|database|prisma|transaction/i.test(msg))
    return PipelineFailureReason.DATABASE_ERROR;

  if (/401|403|unauthorized|forbidden|auth/i.test(msg))
    return PipelineFailureReason.AUTH_ERROR;

  if (/provider|gemini|deepgram|cognee/i.test(msg))
    return PipelineFailureReason.PROVIDER_ERROR;

  if (/invalid|bad.?request|400|schema|parse/i.test(msg))
    return PipelineFailureReason.INVALID_INPUT;

  return PipelineFailureReason.UNKNOWN;
}
