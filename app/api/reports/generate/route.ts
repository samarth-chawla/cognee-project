import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { errorResponse, fail, ok } from "@/lib/utils/api";
import { evaluateInterview } from "@/services/interview.service";
import { persistInterviewMemory } from "@/services/memory.service";
import { saveReport, getReport } from "@/services/report.service";
import { prisma } from "@/lib/db/prisma";
import { withInFlight } from "@/lib/utils/dedup";
import { FRIENDLY } from "@/lib/utils/messages";

const bodySchema = z.object({
  interviewId: z.string().min(1),
});

const MAX_EVAL_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Evaluate with retry + backoff. On total failure, mark the interview FAILED so
 * it is never stranded ONGOING, then rethrow so the caller returns an error the
 * UI can surface with a Retry button. A later retry runs fresh (report still
 * absent) and, on success, flips the status to COMPLETED.
 */
async function evaluateWithRetry(interviewId: string, userId: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_EVAL_ATTEMPTS; attempt++) {
    try {
      // skipHistory: report is generated purely from this interview's answers —
      // no Cognee recall during generation.
      return await evaluateInterview({ interviewId, userId, skipHistory: true });
    } catch (reason) {
      lastError = reason;
      console.error("[Interview] Evaluation attempt failed", {
        interviewId,
        attempt,
        maxAttempts: MAX_EVAL_ATTEMPTS,
        reason: reason instanceof Error ? reason.message : String(reason),
      });
      if (attempt < MAX_EVAL_ATTEMPTS) {
        await sleep(attempt * 1500); // 1.5s, 3s backoff
      }
    }
  }

  // All attempts failed — don't leave the interview stuck ONGOING.
  try {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "FAILED", endedAt: new Date() },
    });
  } catch (reason) {
    console.error("[Interview] Failed to mark interview FAILED", {
      interviewId,
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json(fail("unauthorized"), { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user)
      return NextResponse.json(fail("user not found"), { status: 404 });

    const body = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail("interviewId required"), { status: 400 });
    }

    const { interviewId } = parsed.data;

    // De-duplicated + idempotent: shares the same lock key as /api/interview/end
    // so the two routes never evaluate the same interview twice, and a cached
    // report is returned instead of re-running Gemini / re-writing memory.
    const evaluation = await withInFlight(`eval:${interviewId}`, async () => {
      const existing = await prisma.report.findUnique({
        where: { interviewId },
      });

      if (existing) {
        console.log("[Interview] Report already exists — returning cached", {
          interviewId,
        });
        const cached = await getReport(existing.id);
        if (cached) return cached.evaluation;
      }

      console.log("[Interview] Evaluation started (reports/generate)", {
        interviewId,
      });

      // Gemini can fail transiently (5xx / 429 / timeout). Retry with backoff
      // before giving up. evaluateInterview only reads + calls Gemini here — no
      // writes happen until it returns — so retrying is safe.
      const result = await evaluateWithRetry(interviewId, user.id);

      const report = await saveReport(user.id, interviewId, result);

      const completedInterview = await prisma.interview.findFirst({
        where: { id: interviewId, userId: user.id },
        select: {
          userId: true,
          company: true,
          customCompanyName: true,
          role: true,
          interviewType: true,
        },
      });

      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });

      // Cognee memory write happens AFTER the report is saved, in the background
      // so it never blocks or fails the response. persistInterviewMemory never
      // throws, but we guard anyway.
      void persistInterviewMemory(
        { ...report, interview: completedInterview ?? undefined },
        { historicalTrend: result.historicalProgress?.overallTrend ?? null },
      ).catch((reason) =>
        console.error("[Interview] Background memory persist failed", {
          interviewId,
          reason: reason instanceof Error ? reason.message : String(reason),
        }),
      );

      console.log("[Interview] Evaluation completed (reports/generate)", {
        interviewId,
      });
      return result;
    });

    return NextResponse.json(ok(evaluation));
  } catch (reason) {
    console.error("[Interview] Report generation failed", { reason });
    // errorResponse already sanitizes to a friendly message server-side.
    return errorResponse(reason, FRIENDLY.aiRetry);
  }
}
