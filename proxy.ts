import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

import { checkRateLimit, rateLimitHeaders, RATE_LIMIT_BODY } from "@/lib/rate-limit/rate-limiter";
import { findRuleIndex, RATE_LIMIT_CONFIG } from "@/lib/rate-limit/config";

const isProtectedRoute = createRouteMatcher([
  // App pages (require auth)
  "/onboarding",
  "/dashboard(.*)",
  // API routes (require auth — except webhooks)
  "/api/auth/me",
  "/api/user(.*)",
  "/api/interview(.*)",
  "/api/reports(.*)",
  "/api/memory(.*)",
  "/api/analytics",
  "/api/speech(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhook/clerk",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

/**
 * Per-IP rate limiting, centralized in lib/rate-limit.
 *
 * Constraints (see docs/API_REFERENCE.md):
 *   - Only /api/* routes are limited.
 *   - OPTIONS (CORS preflight) and /api/webhook/* (Svix-signed) are excluded.
 *   - Set DISABLE_RATE_LIMIT=true to bypass (local testing only).
 *
 * The actual limits live in lib/rate-limit/config.ts (single source of truth)
 * and the limiter logic in lib/rate-limit/rate-limiter.ts.
 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

type RateLimitOutcome =
  | { kind: "skip" }
  | { kind: "blocked"; response: NextResponse }
  | { kind: "allowed"; result: ReturnType<typeof checkRateLimit> };

function evaluateRateLimit(req: NextRequest): RateLimitOutcome {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/")) return { kind: "skip" };
  if (req.method === "OPTIONS") return { kind: "skip" };
  // Webhooks are verified by Svix signature — never IP-rate-limit them.
  if (pathname.startsWith("/api/webhook")) return { kind: "skip" };
  if (process.env.DISABLE_RATE_LIMIT === "true") return { kind: "skip" };

  const ruleIndex = findRuleIndex(pathname);
  const rule = RATE_LIMIT_CONFIG[ruleIndex];
  const ip = getClientIp(req);
  const result = checkRateLimit(`${ip}|${ruleIndex}`, rule.windows);

  if (!result.allowed) {
    return {
      kind: "blocked",
      response: new NextResponse(JSON.stringify(RATE_LIMIT_BODY), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSec),
          ...rateLimitHeaders(result),
        },
      }),
    };
  }

  return { kind: "allowed", result };
}

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
): Promise<Response | null | undefined | void> {
  const outcome = evaluateRateLimit(request);

  // Blocked by rate limit — short-circuit before Clerk runs.
  if (outcome.kind === "blocked") return outcome.response;

  // Otherwise run the existing Clerk auth middleware unchanged.
  const res = await clerk(request, event);

  // Annotate the response with rate-limit headers when allowed. We only
  // decorate a response Clerk actually returned (e.g. 401/307); for public
  // routes where Clerk continues without a response, we leave it untouched to
  // avoid perturbing Clerk's request-rewrite flow.
  if (outcome.kind === "allowed" && res && "headers" in res) {
    const h = rateLimitHeaders(outcome.result);
    res.headers.set("X-RateLimit-Limit", h["X-RateLimit-Limit"]);
    res.headers.set("X-RateLimit-Remaining", h["X-RateLimit-Remaining"]);
    res.headers.set("X-RateLimit-Reset", h["X-RateLimit-Reset"]);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
