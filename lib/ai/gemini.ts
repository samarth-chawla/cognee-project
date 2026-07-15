import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_MODELS } from "@/lib/utils/constants";

let client: GoogleGenerativeAI | null = null;

// Primary: gemini-2.5-flash-lite (DEFAULT_MODELS.gemini). Single fallback:
// gemini-2.5-flash. gemini-flash-latest removed — that rolling alias kept
// 404ing / retrying uselessly under load.
const GEMINI_FALLBACK_MODELS = [
  DEFAULT_MODELS.gemini,   // primary
  "gemini-2.5-flash",      // fallback only
] as const;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/** Total attempts for a single model before falling back to the next model. */
const MAX_ATTEMPTS = 3;
/** Wait (ms) BEFORE attempt N: attempt 2 → 1s, attempt 3 → 2s. Attempt 1 = immediate. */
const BACKOFF_MS = [1000, 2000];

export function getGemini(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  }
  return client;
}

/** Extract the HTTP-ish status Gemini's SDK attaches to its errors, if any. */
function geminiStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

/**
 * True for transient failures we should retry: 429/500/502/503/504, plus
 * network/timeout conditions surfaced as exceptions by the SDK or fetch layer
 * (e.g. ECONNRESET, "fetch failed", "UNAVAILABLE", deadline exceeded).
 */
export function isRetryableGeminiError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const status = geminiStatus(error);
  if (status !== undefined && RETRYABLE_STATUS.has(status)) return true;

  return /(ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|socket hung up|fetch failed|network|timeout|timed out|deadline|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|rate limit|429|503|502|500|504)/i.test(
    error.message || "",
  );
}


function isGeminiModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = geminiStatus(error);
  return status === 404 || /404|not found/i.test(error.message);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Text generation with Gemini, with centralized transient-error retry.
 *
 * Retry policy (per model):
 *   Attempt 1 — immediate
 *   Attempt 2 — after 1s
 *   Attempt 3 — after 2s
 * Retries only on 429/500/502/503/504/network-timeout. Non-retryable errors
 * (e.g. auth, 400, model-not-found) fail fast. If a model is exhausted, the
 * next fallback model in GEMINI_FALLBACK_MODELS is tried once. On success no
 * further retries occur — no duplicate requests after success.
 *
 * All detailed failure info is logged server-side with the [Gemini] prefix;
 * nothing provider-specific leaks to the caller.
 */
export async function geminiComplete(
  system: string,
  user: string,
  opts: { json?: boolean; model?: string } = {},
): Promise<string> {
  const requestedModel = opts.model ?? DEFAULT_MODELS.gemini;
  const modelsToTry = [
    requestedModel,
    ...GEMINI_FALLBACK_MODELS.filter((model) => model !== requestedModel),
  ];

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Backoff BEFORE each retry: attempt 1 immediate, attempt 2 after 1s,
      // attempt 3 after 2s (per the documented retry policy).
      if (attempt > 1) {
        const waitMs = BACKOFF_MS[attempt - 2];
        if (waitMs > 0) {
          console.warn("[Gemini] Retry", `${attempt}/${MAX_ATTEMPTS}`, {
            model: modelName,
            afterMs: waitMs,
          });
          await sleep(waitMs);
        }
      }

      try {
        const model = getGemini().getGenerativeModel({
          model: modelName,
          systemInstruction: system,
          ...(opts.json
            ? { generationConfig: { responseMimeType: "application/json" } }
            : {}),
        });
        const res = await model.generateContent(user);
        return res.response.text();
      } catch (error) {
        lastError = error;

        // Model not found → skip straight to the next model, no retry.
        if (isGeminiModelNotFoundError(error)) {
          console.warn("[Gemini] model unavailable; trying fallback", {
            model: modelName,
          });
          break;
        }

        // Non-retryable (auth, bad request, client error) → fail fast.
        if (!isRetryableGeminiError(error)) {
          throw error;
        }
        // Retryable transient → loop will back off and retry (or fall through
        // to the next model once MAX_ATTEMPTS is exhausted).
      }
    }
  }

  console.error("[Gemini] all models exhausted", {
    requestedModel,
    modelsTried: modelsToTry.length,
  });
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage-aware variant (for pipeline cost tracking)
// ─────────────────────────────────────────────────────────────────────────────

export interface GeminiUsageResult {
  text: string;
  /** Model that actually produced the response (may differ from requested if fallback triggered) */
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Like geminiComplete() but also returns token usage metadata from the SDK.
 * Use this whenever the caller needs to track cost (question generation, report generation).
 *
 * The SDK's response.usageMetadata provides:
 *   promptTokenCount     → inputTokens
 *   candidatesTokenCount → outputTokens
 *   totalTokenCount      → totalTokens
 *
 * Falls back to 0 if the SDK omits usageMetadata (shouldn't happen in practice).
 */
export async function geminiCompleteWithUsage(
  system: string,
  user: string,
  opts: { json?: boolean; model?: string } = {},
): Promise<GeminiUsageResult> {
  const requestedModel = opts.model ?? DEFAULT_MODELS.gemini;
  const modelsToTry = [
    requestedModel,
    ...GEMINI_FALLBACK_MODELS.filter((model) => model !== requestedModel),
  ];

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        const waitMs = BACKOFF_MS[attempt - 2];
        if (waitMs > 0) {
          console.warn("[Gemini] Retry", `${attempt}/${MAX_ATTEMPTS}`, {
            model: modelName,
            afterMs: waitMs,
          });
          await sleep(waitMs);
        }
      }

      try {
        const model = getGemini().getGenerativeModel({
          model: modelName,
          systemInstruction: system,
          ...(opts.json
            ? { generationConfig: { responseMimeType: "application/json" } }
            : {}),
        });
        const res = await model.generateContent(user);
        const usage = res.response.usageMetadata;

        return {
          text: res.response.text(),
          model: modelName,
          inputTokens: usage?.promptTokenCount ?? 0,
          outputTokens: usage?.candidatesTokenCount ?? 0,
          totalTokens: usage?.totalTokenCount ?? 0,
        };
      } catch (error) {
        lastError = error;

        if (isGeminiModelNotFoundError(error)) {
          console.warn("[Gemini] model unavailable; trying fallback", { model: modelName });
          break;
        }

        if (!isRetryableGeminiError(error)) {
          throw error;
        }
      }
    }
  }

  console.error("[Gemini] all models exhausted (with usage)", {
    requestedModel,
    modelsTried: modelsToTry.length,
  });
  throw lastError;
}
