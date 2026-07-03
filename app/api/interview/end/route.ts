import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { evaluateInterview } from "@/services/interview.service";
import { saveReport } from "@/services/report.service";

const bodySchema = z.object({
  interviewId: z.string().min(1, "interviewId is required"),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 }
      );
    }

    const { interviewId } = parsed.data;

    // ── Step 1: Load questions + answers from DB and run Gemini evaluation ──
    const evaluation = await evaluateInterview({
      interviewId,
      userId: user.id,
    });

    // ── Step 2: Persist report to Prisma Report table ──
    const report = await saveReport(user.id, interviewId, evaluation);

    // ── Step 3: Mark interview as COMPLETED ──
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });

    // ── Step 4: Console log for MVP verification ──
    console.log("[MVP REPORT]", JSON.stringify(report, null, 2));

    // ── Step 5: Return to frontend — STOP here (no Cognee, no analytics) ──
    return NextResponse.json({ success: true, data: report });

  } catch (error: any) {
    console.error("[INTERVIEW_END_ERROR]", error);

    if (error.message === "INTERVIEW_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to finish interview" },
      { status: 500 }
    );
  }
}
