// Usage-limit configuration. EDIT THE TWO CONSTANTS BELOW to change the limit
// — no env vars, no DB changes. Just edit + restart the server.
//
//   MAX_INTERVIEWS - max interviews allowed per window (e.g. 3)
//   USAGE_WINDOW   - "day" | "week" | "month"            (e.g. "month")
//
// To go from "3 per month" to "3 per week": set USAGE_WINDOW = "week".

export type UsageWindow = "day" | "week" | "month";

export const MAX_INTERVIEWS = 10;
export const USAGE_WINDOW: UsageWindow = "month";

export function getLimits() {
  return { MAX_INTERVIEWS, WINDOW: USAGE_WINDOW };
}

// Human-readable label for the active window, for client-facing messages.
export function getWindowLabel(window: UsageWindow = USAGE_WINDOW): string {
  return window;
}

// Inclusive [start, end] bounds for the current window relative to `now`.
export function getUsageWindowBounds(
  now: Date = new Date()
): { start: Date; end: Date } {
  if (USAGE_WINDOW === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (USAGE_WINDOW === "week") {
    const dayOfWeek = now.getDay(); // 0 = Sunday .. 6 = Saturday
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek,
      0, 0, 0, 0
    );
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 6,
      23, 59, 59, 999
    );
    return { start, end };
  }

  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// Back-compat alias so any stray reference still resolves.
export const LIMITS = {
  get MAX_INTERVIEWS_PER_MONTH() {
    return MAX_INTERVIEWS;
  },
};
