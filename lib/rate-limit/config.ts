/**
 * Single source of truth for rate-limit configuration.
 *
 * Every API route maps to exactly one rule. Rules are evaluated in array
 * order and the FIRST matching rule wins, so list more specific routes before
 * more general ones. The final `default` rule is a catch-all so that any
 * current or future `/api/*` route is always guarded.
 *
 * Each rule may declare multiple windows (e.g. a per-minute ceiling plus a
 * per-second burst guard). A request is allowed only if it satisfies ALL of
 * the rule's windows.
 *
 * Limits follow docs/API_REFERENCE.md and the suggested limits in the task
 * brief. To retune, edit only this file.
 */

import type { RateLimitWindow } from "./rate-limiter";

export interface RateLimitRule {
  /** Human-readable name (used for logging / diagnostics). */
  name: string;
  /** Returns true if this rule applies to the given pathname. */
  match: (pathname: string) => boolean;
  windows: RateLimitWindow[];
}

const MIN = 60_000;
const TEN_MIN = 10 * MIN;

/** Static routes that live directly under /api/interview as a single segment. */
const EXCLUDED_INTERVIEW_SINGLE = new Set([
  "/api/interview/start",
  "/api/interview/generate",
  "/api/interview/answer",
  "/api/interview/cancel",
  "/api/interview/end",
  "/api/interview/history",
  "/api/interview/next",
]);

/** True only for `base/<id>` (exactly one path segment after `base`). */
function isSingleSegment(pathname: string, base: string): boolean {
  if (!pathname.startsWith(base)) return false;
  const rest = pathname.slice(base.length);
  if (!rest.startsWith("/")) return false;
  const seg = rest.slice(1);
  return seg !== "" && seg.split("/").length === 1;
}

export const RATE_LIMIT_CONFIG: RateLimitRule[] = [
  // ---------------- Interview ----------------
  {
    name: "interview.generate",
    match: (p) => p === "/api/interview/generate",
    // Costly LLM call: 3/min with a 1-per-5s burst guard.
    windows: [
      { limit: 3, windowMs: MIN },
      { limit: 1, windowMs: 5_000 },
    ],
  },
  {
    name: "interview.start",
    match: (p) => p === "/api/interview/start",
    // Creates a session + Cognee recall. Moderate.
    windows: [
      { limit: 10, windowMs: MIN },
      { limit: 1, windowMs: 3_000 },
    ],
  },
  {
    name: "interview.answer",
    match: (p) => p === "/api/interview/answer",
    // Cheap DB save, multiple per interview.
    windows: [
      { limit: 30, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },
  {
    name: "interview.voice.answer",
    match: (p) => p === "/api/interview/voice/answer",
    // Realtime voice turn — generous so active interviews are not throttled.
    windows: [
      { limit: 60, windowMs: MIN },
      { limit: 5, windowMs: 1_000 },
    ],
  },
  {
    name: "interview.voice.token",
    match: (p) => p === "/api/interview/voice/token",
    // Mint short-lived Deepgram token — realtime, generous.
    windows: [
      { limit: 30, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },
  {
    name: "interview.end",
    match: (p) => p === "/api/interview/end",
    // Report generation (LLM).
    windows: [{ limit: 5, windowMs: MIN }],
  },
  {
    name: "interview.cancel",
    match: (p) => p === "/api/interview/cancel",
    windows: [
      { limit: 20, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },
  {
    name: "interview.history",
    match: (p) => p === "/api/interview/history",
    windows: [{ limit: 60, windowMs: MIN }],
  },
  {
    name: "interview.next",
    match: (p) => p === "/api/interview/next",
    // Not implemented (501) — guarded anyway (cheap).
    windows: [{ limit: 60, windowMs: MIN }],
  },
  {
    name: "interview.[id]",
    match: (p) =>
      isSingleSegment(p, "/api/interview") &&
      !EXCLUDED_INTERVIEW_SINGLE.has(p) &&
      !p.startsWith("/api/interview/voice"),
    // Not implemented (501) — guarded anyway (cheap).
    windows: [{ limit: 60, windowMs: MIN }],
  },

  // ---------------- Reports ----------------
  {
    name: "reports.generate",
    match: (p) => p === "/api/reports/generate",
    // Raw evaluation pipeline (LLM): 5/min.
    windows: [{ limit: 5, windowMs: MIN }],
  },
  {
    name: "reports.[id]",
    match: (p) => isSingleSegment(p, "/api/reports") && p !== "/api/reports/generate",
    windows: [{ limit: 60, windowMs: MIN }],
  },
  {
    name: "analytics",
    match: (p) => p === "/api/analytics",
    windows: [{ limit: 60, windowMs: MIN }],
  },

  // ---------------- Memory ----------------
  {
    name: "memory.graph",
    match: (p) => p === "/api/memory/graph",
    windows: [{ limit: 20, windowMs: MIN }],
  },
  {
    name: "memory.insights",
    match: (p) => p === "/api/memory/insights",
    // Placeholder (501) — guarded anyway (cheap).
    windows: [{ limit: 20, windowMs: MIN }],
  },
  {
    name: "memory.timeline",
    match: (p) => p === "/api/memory/timeline",
    // Placeholder (501) — guarded anyway (cheap).
    windows: [{ limit: 20, windowMs: MIN }],
  },

  // ---------------- Cognee ----------------
  {
    name: "cognee.forget",
    match: (p) => p === "/api/cognee/forget",
    // Destructive (account-deletion use only) — tight.
    windows: [
      { limit: 5, windowMs: MIN },
      { limit: 1, windowMs: 10_000 },
    ],
  },
  {
    name: "cognee.health",
    match: (p) => p === "/api/cognee/health",
    // Health/connectivity probe — very generous.
    windows: [
      { limit: 120, windowMs: MIN },
      { limit: 10, windowMs: 1_000 },
    ],
  },

  // ---------------- Auth ----------------
  {
    name: "auth.me",
    match: (p) => p === "/api/auth/me",
    // Upserts user/profile on first visit — general GET cadence.
    windows: [
      { limit: 60, windowMs: MIN },
      { limit: 3, windowMs: 1_000 },
    ],
  },

  // ---------------- User / Profile ----------------
  {
    name: "user.onboarding",
    match: (p) => p === "/api/user/onboarding",
    // Profile write: 30/min.
    windows: [
      { limit: 30, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },
  {
    name: "user.profile",
    match: (p) => p === "/api/user/profile",
    // GET + PATCH: 30/min.
    windows: [
      { limit: 30, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },
  {
    name: "user.usage",
    match: (p) => p === "/api/user/usage",
    windows: [{ limit: 60, windowMs: MIN }],
  },
  {
    name: "user.data",
    match: (p) => p === "/api/user/data",
    // Destructive transaction — tight.
    windows: [
      { limit: 10, windowMs: MIN },
      { limit: 1, windowMs: 3_000 },
    ],
  },
  {
    name: "user.delete-account",
    match: (p) => p === "/api/user/delete-account",
    // Destructive + Clerk delete — tight.
    windows: [
      { limit: 5, windowMs: MIN },
      { limit: 1, windowMs: 10_000 },
    ],
  },
  {
    name: "user.resume",
    match: (p) => p === "/api/user/resume",
    // File upload + parse: 5 per 10 minutes.
    windows: [{ limit: 5, windowMs: TEN_MIN }],
  },
  {
    name: "user.job-description",
    match: (p) => p === "/api/user/job-description",
    // Cheap record save.
    windows: [
      { limit: 20, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },

  // ---------------- Speech / Voice (realtime-friendly) ----------------
  {
    name: "speech.token",
    match: (p) => p === "/api/speech/token",
    windows: [
      { limit: 30, windowMs: MIN },
      { limit: 2, windowMs: 1_000 },
    ],
  },
  {
    name: "speech.speak",
    match: (p) => p === "/api/speech/speak",
    // TTS streaming, called often during an interview — generous.
    windows: [
      { limit: 60, windowMs: MIN },
      { limit: 5, windowMs: 1_000 },
    ],
  },
  {
    name: "speech.transcribe",
    match: (p) => p === "/api/speech/transcribe",
    // STT, called often during an interview — generous.
    windows: [
      { limit: 60, windowMs: MIN },
      { limit: 5, windowMs: 1_000 },
    ],
  },

  // ---------------- Health ----------------
  {
    name: "health",
    match: (p) => p === "/api/health",
    // Liveness ping — very generous.
    windows: [
      { limit: 120, windowMs: MIN },
      { limit: 10, windowMs: 1_000 },
    ],
  },

  // ---------------- Fallback ----------------
  {
    // Catch-all for any /api route not explicitly listed above. Guarantees
    // no API route is left unguarded.
    name: "default",
    match: () => true,
    windows: [
      { limit: 60, windowMs: MIN },
      { limit: 3, windowMs: 1_000 },
    ],
  },
];

export function findRuleIndex(pathname: string): number {
  const idx = RATE_LIMIT_CONFIG.findIndex((r) => r.match(pathname));
  return idx === -1 ? RATE_LIMIT_CONFIG.length - 1 : idx;
}
