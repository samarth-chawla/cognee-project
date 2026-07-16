import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { interviewId, requestId, source } = body;

    if (!interviewId || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify interview belongs to user
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { userId: true },
    });

    if (!interview || interview.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Interview not found or unauthorized" },
        { status: 404 }
      );
    }

    // Determine connection number by counting existing sessions for this interview
    const existingCount = await prisma.deepgramSession.count({
      where: { interviewId },
    });

    // We use upsert on requestId to be safe against flaky network retries 
    // of the same POST request
    await prisma.deepgramSession.upsert({
      where: { requestId },
      update: {
        // If it already exists, just update the captureSource if needed
        ...(source ? { captureSource: source } : {}),
      },
      create: {
        interviewId,
        userId: user.id,
        requestId,
        connectionNumber: existingCount + 1,
        ...(source ? { captureSource: source } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VoiceSessionId] Error saving request ID:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
