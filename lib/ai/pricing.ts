/**
 * lib/ai/pricing.ts
 *
 * SINGLE SOURCE OF TRUTH for all AI provider pricing.
 *
 * To update prices: change PRICING_CONFIG only.
 * Never scatter cost calculations across service files.
 *
 * Pricing verified: 2026-07-15
 * Sources:
 *   Gemini  → https://ai.google.dev/gemini-api/docs/pricing
 *   Deepgram → https://deepgram.com/pricing (Voice Agent API)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeminiModelPricing {
  /** Cost in USD per 1 million input tokens */
  inputPerMToken: number;
  /** Cost in USD per 1 million output tokens */
  outputPerMToken: number;
}

export interface DeepgramPricing {
  /**
   * Voice Agent API: unified STT + LLM + TTS flat rate per second.
   * Official rate: $4.50/hr = $0.075/min = $0.00125/sec
   */
  voiceAgentPerSecond: number;
}

export interface CogneePricing {
  /**
   * Cognee Cloud does not expose a public billing API.
   * Track usage (nodes/edges) but store $0.00 cost until billing is available.
   */
  perOperation: number;
}

export interface PricingConfig {
  /** Semver-style date string. Bump whenever any provider changes pricing. */
  version: string;
  gemini: Record<string, GeminiModelPricing>;
  deepgram: DeepgramPricing;
  cognee: CogneePricing;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config — ONLY EDIT HERE to update prices
// ─────────────────────────────────────────────────────────────────────────────

export const PRICING_CONFIG: PricingConfig = {
  version: "2026-07-15",

  gemini: {
    /**
     * gemini-2.5-flash-lite — primary model (DEFAULT_MODELS.gemini)
     * Input:  $0.10 / 1M tokens
     * Output: $0.40 / 1M tokens
     */
    "gemini-2.5-flash-lite": {
      inputPerMToken: 0.10,
      outputPerMToken: 0.40,
    },

    /**
     * gemini-2.5-flash — fallback model
     * Input:  $0.30 / 1M tokens
     * Output: $2.50 / 1M tokens
     */
    "gemini-2.5-flash": {
      inputPerMToken: 0.30,
      outputPerMToken: 2.50,
    },

    /**
     * Catch-all for unknown/future models — use flash-lite pricing as a safe default.
     * This ensures no row ever has $0 cost due to an unrecognized model name.
     */
    __default__: {
      inputPerMToken: 0.10,
      outputPerMToken: 0.40,
    },
  },

  deepgram: {
    /**
     * Voice Agent API: $4.50/hr unified rate (STT + LLM + TTS bundled).
     * $4.50 / 3600 seconds = $0.00125 per second.
     */
    voiceAgentPerSecond: 0.00125,
  },

  cognee: {
    perOperation: 0.00,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline version — bump when the pipeline architecture changes significantly
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_VERSION = "1.0.0";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: sanitize error messages before storing
// ─────────────────────────────────────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,               // OpenAI/API keys
  /eyJ[a-zA-Z0-9._-]{20,}/g,            // JWTs
  /postgresql:\/\/[^\s]*/gi,             // DB connection strings
  /at\s+[\w.<>]+\s+\(.*:\d+:\d+\)/g,   // Stack trace frames
  /at\s+[\w.]+\s+\[as\s+[\w]+\]/g,     // Stack trace aliases
];

/**
 * Strip stack traces, API keys, and connection strings from error messages.
 * Store only the first 500 chars of the sanitized message.
 */
export function sanitizeError(error: unknown): string | null {
  if (!error) return null;

  let message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Unknown error";

  for (const pattern of SENSITIVE_PATTERNS) {
    message = message.replace(pattern, "[REDACTED]");
  }

  return message.slice(0, 500).trim() || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost calculation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Gemini cost for a single API call.
 *
 * Returns input cost, output cost, and total as separate values so they can be
 * stored independently (provider may change input/output rates at different times).
 */
export function calculateGeminiCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): { inputCostUsd: number; outputCostUsd: number; totalCostUsd: number } {
  const rates =
    PRICING_CONFIG.gemini[model] ?? PRICING_CONFIG.gemini["__default__"];

  const inputCostUsd = (inputTokens / 1_000_000) * rates.inputPerMToken;
  const outputCostUsd = (outputTokens / 1_000_000) * rates.outputPerMToken;

  return {
    inputCostUsd: round8(inputCostUsd),
    outputCostUsd: round8(outputCostUsd),
    totalCostUsd: round8(inputCostUsd + outputCostUsd),
  };
}

/**
 * Calculate Deepgram Voice Agent API cost from audio duration.
 *
 * @param audioSeconds - Total audio seconds of the voice session
 */
export function calculateDeepgramCost(audioSeconds: number): number {
  return round8(audioSeconds * PRICING_CONFIG.deepgram.voiceAgentPerSecond);
}

/**
 * Cognee does not expose a billing API.
 * Returns $0.00 — tracked for when billing becomes available.
 */
export function calculateCogneeCost(): number {
  return PRICING_CONFIG.cognee.perOperation;
}

/**
 * Sum all stage costs into a single pipeline total.
 * Accepts any number of cost values (undefined/null treated as 0).
 */
export function calculateTotalPipelineCost(...costs: (number | null | undefined)[]): number {
  const total = costs.reduce<number>((acc, c) => acc + (c ?? 0), 0);
  return round8(total);
}

/** Current pricing version string (from config). */
export function getCurrentPricingVersion(): string {
  return PRICING_CONFIG.version;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Round to 8 decimal places to match Prisma Decimal(12, 8). */
function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}
