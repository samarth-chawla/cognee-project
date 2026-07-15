import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withInFlight } from "@/lib/utils/dedup";
import { abortPipeline } from "@/services/pipelineUsage.service";

const bodySchema = z.object({
  interviewId: z.string().min(1),
});

/** Statuses that can be cancelled. Terminal statuses are left untouched (idempotent). */
const CANCELLABLE_STATUSES = ["PENDING", "GENERATING", "READY", "ONGOING"] as const;

/**
 * POST /api/interview/cancel
 *
 * Marks an active interview as CANCELLED.
 *
 * Guards:
 *  - Ownership verified — only the authenticated user can cancel their own interview.
 *  - Status verified   — only ACTIVE statuses can be cancelled; terminal ones are no-ops.
 *  - withInFlight      — prevents two concurrent cancels from racing on the same interview.
 *
 * Idempotent: calling cancel on an already-terminal interview returns success without
 * any DB mutation, so double-calls and retries are safe.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "interviewId required" }, { status: 400 });
    }

    const { interviewId } = parsed.data;

    // ── Ownership check ───────────────────────────────────────────────────
    // Never cancel by interviewId alone — always scope to the authenticated user.
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      select: { id: true, status: true },
    });

    if (!interview) {
      // Not found or not owned — treat as success (idempotent).
      return NextResponse.json({ success: true });
    }

    // ── Status check ──────────────────────────────────────────────────────
    // If already terminal, return success without any mutation.
    if (!CANCELLABLE_STATUSES.includes(interview.status as any)) {
      return NextResponse.json({ success: true });
    }

    // ── Atomic cancel with in-flight dedup ───────────────────────────────
    // withInFlight ensures only one cancel runs at a time for this interview.
    // Concurrent cancel calls await the same promise instead of racing.
    await withInFlight(`cancel:${interviewId}`, async () => {
      // Re-read inside the lock to guard against a race between the status
      // check above and this update.
      const current = await prisma.interview.findUnique({
        where: { id: interviewId },
        select: { status: true },
      });

      if (!current || !CANCELLABLE_STATUSES.includes(current.status as any)) {
        return; // Already terminal — nothing to do.
      }

      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: "CANCELLED", endedAt: new Date() },
      });

      // Close out any pending pipeline stages since the interview was cancelled
      await abortPipeline({
        interviewId,
        reason: "USER_CANCELLED",
        completedBy: "USER"
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[INTERVIEW_CANCEL_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel interview" },
      { status: 500 },
    );
  }
}
