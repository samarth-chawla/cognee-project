import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
