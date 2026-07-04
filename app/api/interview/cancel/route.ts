import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({
  interviewId: z.string().min(1),
});

/**
 * POST /api/interview/cancel
 * Marks an in-progress or stale interview as ABORTED so the next
 * call to /api/interview/start always creates a fresh session.
 * Safe to call even if the interview is already COMPLETED/ABORTED.
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

    // Only abort if the interview belongs to this user and is still in a cancellable state.
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      select: { id: true, status: true },
    });

    if (!interview) {
      // Already gone or not owned — treat as success (idempotent).
      return NextResponse.json({ success: true });
    }

    const cancellableStatuses = ["READY", "GENERATING", "ONGOING", "FAILED"];
    if (cancellableStatuses.includes(interview.status)) {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: "CANCELLED", endedAt: new Date() },
      });
    }


    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[INTERVIEW_CANCEL_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel interview" },
      { status: 500 }
    );
  }
}
