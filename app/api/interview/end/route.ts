import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getReport } from "@/services/report.service";
import { finalizeDeepgram } from "@/services/pipelineUsage.service";

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

    // De-duplicate + make idempotent: check if report already exists
    try {
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
          return NextResponse.json({ success: true, data: cached });
        }
      }

      // ── MARK INTERVIEW COMPLETED SYNCHRONOUSLY ───────────────────────────
      await ensureCompleted(interviewId);
      await finalizeDeepgram(interviewId);

      // ── QUEUE REPORT GENERATION ──────────────────────────────────────────
      await prisma.reportGenerationJob.upsert({
        where: { interviewId },
        create: {
          interviewId,
          userId: user.id,
          status: "PENDING",
        },
        update: {}, // If it already exists, leave it as is
      });

      // ── TRIGGER ASYNC PROCESSING ─────────────────────────────────────────
      // Fire-and-forget request to the cron endpoint to process the pending job immediately
      const baseUrl = request.nextUrl.origin;
      fetch(`${baseUrl}/api/cron/process-reports`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET || ""}`
        }
      }).catch(err => console.error("[Interview] Failed to trigger async report processing", err));

      const report = { _isQueuedSentinel: true };

      if ((report as any)._isQueuedSentinel) {
        return NextResponse.json({
          success: true,
          queued: true,
          message: "Your interview report is currently being generated. It will appear on your dashboard when it's ready."
        });
      }

      return NextResponse.json({ success: true, data: report });
    } catch (error: unknown) {
      console.error("[Interview] Evaluation queueing failed", { error });
      const message = error instanceof Error ? error.message : "Unknown queue error";
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
