import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { evaluateInterview } from "@/services/interview.service";
import { persistInterviewMemory } from "@/services/memory.service";
import { saveReport, getReport } from "@/services/report.service";
import { withInFlight } from "@/lib/utils/dedup";
import { toFriendlyError } from "@/lib/utils/errors";
import { FRIENDLY } from "@/lib/utils/messages";
import { isRetryableGeminiError } from "@/lib/ai/gemini";

const bodySchema = z.object({
  interviewId: z.string().min(1, "interviewId is required"),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 },
      );
    }

    const { interviewId } = parsed.data;

    // De-duplicate + make idempotent: the same interview is evaluated at most
    // once even if /api/interview/end and /api/reports/generate race, or the
    // client retries. Subsequent calls return the existing report.
    try {
      const report = await withInFlight(`eval:${interviewId}`, async () => {
        const existing = await prisma.report.findUnique({
          where: { interviewId },
        });

        if (existing) {
          console.log("[Interview] Evaluation already exists — returning cached", {
            interviewId,
          });
          const cached = await getReport(existing.id);
          if (cached) {
            await ensureCompleted(interviewId);
            return cached;
          }
        }

        console.log("[Interview] Evaluation started", { interviewId });

        const evaluation = await evaluateInterview({
          interviewId,
          userId: user.id,
        });

        const saved = await saveReport(user.id, interviewId, evaluation);

        const completedInterview = await prisma.interview.update({
          where: { id: interviewId },
          data: { status: "COMPLETED", endedAt: new Date() },
          select: {
            userId: true,
            company: true,
            customCompanyName: true,
            role: true,
            interviewType: true,
          },
        });

        // Best-effort memory — never blocks completion (swallowed inside).
        await persistInterviewMemory(
          { ...saved, interview: completedInterview },
          { historicalTrend: evaluation.historicalProgress?.overallTrend ?? null },
        );

        console.log("[Interview] Evaluation completed", { interviewId });
        return saved;
      });

      return NextResponse.json({ success: true, data: report });
    } catch (error: unknown) {
      console.error("[Interview] Evaluation failed", { error });

      if (isRetryableGeminiError(error)) {
        try {
          await prisma.reportGenerationJob.upsert({
            where: { interviewId },
            update: {
              status: "PENDING",
              nextRetryAt: new Date(Date.now() + 60000), // Retry in 1 min
              lastError: error instanceof Error ? error.message : String(error)
            },
            create: {
              interviewId,
              userId: user.id,
              status: "PENDING",
              nextRetryAt: new Date(Date.now() + 60000),
              lastError: error instanceof Error ? error.message : String(error)
            }
          });
          
          // Ensure interview is marked COMPLETED so it doesn't stay ONGOING
          await ensureCompleted(interviewId);

          return NextResponse.json({ 
            success: true, 
            queued: true,
            message: "Your interview has been saved successfully. We're currently experiencing high AI demand. Your report will be generated automatically and will appear on your dashboard when it's ready." 
          });
        } catch (jobError) {
          console.error("[Interview] Failed to queue report generation job", { jobError });
        }
      }

      const message = toFriendlyError(error, FRIENDLY.aiRetry);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  } catch (globalError) {
    console.error("[Interview] Route error", { globalError });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/** Ensure the interview is marked COMPLETED even on the idempotent path. */
async function ensureCompleted(interviewId: string): Promise<void> {
  try {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  } catch {
    // Non-fatal — report already exists; status is best-effort.
  }
}
