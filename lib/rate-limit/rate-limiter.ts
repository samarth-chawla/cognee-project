/**
 * Centralized, IP-based rate limiter.
 *
 * Edge-compatible (no Node-only APIs) so it can run inside Next.js middleware
 * as well as be imported by route handlers if needed. The store is an
 * in-process fixed-window counter kept on `globalThis` so it survives module
 * reloads in development.
 *
 * NOTE: an in-memory store is shared across requests on a single server
 * process only. For multi-instance / serverless deployments, swap the `buckets`
 * Map for a shared store (e.g. Redis) — every other function in this file stays
 * the same. No database schema or auth changes are required to do so.
 */

export interface RateLimitWindow {
  /** Maximum number of requests allowed within this window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Limit of the window reported in the headers (the most restrictive one). */
  limit: number;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Epoch (ms) when the current window resets. */
  resetAt: number;
  /** Seconds until the window resets (used for the Retry-After header). */
  retryAfterSec: number;
  /** Window length (ms) of the exceeded window, for diagnostics. */
  windowMs: number;
}

/** Standard JSON body returned with HTTP 429. */
export const RATE_LIMIT_BODY = {
  success: false,
  code: "RATE_LIMIT_EXCEEDED",
  message: "Too many requests. Please try again shortly.",
} as const;

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> =
  globalForRateLimit.__rateLimitBuckets ??
  (globalForRateLimit.__rateLimitBuckets = new Map<string, Bucket>());

function now(): number {
  return Date.now();
}

/**
 * Evaluate `windows` for the given key (typically `<ip>|<ruleIndex>`).
 * All windows must pass for the request to be allowed. If any window is
 * exceeded the request is blocked and no counters are incremented.
 */
export function checkRateLimit(
  key: string,
  windows: RateLimitWindow[],
): RateLimitResult {
  const t = now();

  const states = windows.map((w) => {
    const bucketKey = `${key}::${w.windowMs}`;
    let bucket = buckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= t) {
      bucket = { count: 0, resetAt: t + w.windowMs };
      buckets.set(bucketKey, bucket);
    }
    return { w, bucket };
  });

  let allowed = true;
  let exceededWindowMs = windows[0]?.windowMs ?? 60_000;
  let minRetryAfter = Number.POSITIVE_INFINITY;

  for (const { w, bucket } of states) {
    if (bucket.count >= w.limit) {
      allowed = false;
      exceededWindowMs = w.windowMs;
      const retry = Math.ceil((bucket.resetAt - t) / 1000);
      if (retry < minRetryAfter) minRetryAfter = retry;
    }
  }

  if (allowed) {
    for (const { bucket } of states) bucket.count += 1;
  }

  let limit = 0;
  let remaining = Number.POSITIVE_INFINITY;
  let resetAt = 0;
  for (const { w, bucket } of states) {
    if (w.limit > limit) limit = w.limit;
    const rem = Math.max(0, w.limit - bucket.count);
    if (rem < remaining) remaining = rem;
    if (bucket.resetAt > resetAt) resetAt = bucket.resetAt;
  }

  return {
    allowed,
    limit,
    remaining: allowed ? (remaining === Number.POSITIVE_INFINITY ? 0 : remaining) : 0,
    resetAt: resetAt || t,
    retryAfterSec: allowed
      ? 0
      : Math.max(1, minRetryAfter === Number.POSITIVE_INFINITY ? 1 : minRetryAfter),
    windowMs: exceededWindowMs,
  };
}

export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
}

export function rateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
