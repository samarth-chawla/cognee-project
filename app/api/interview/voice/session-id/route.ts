import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    console.log("[VoiceSessionId] Route hit. User ID:", user?.id);
    
    if (!user) {
      console.warn("[VoiceSessionId] Unauthorized request");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[VoiceSessionId] Request body:", body);
    
    const { interviewId, requestId, source } = body;

    if (!interviewId || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify interview belongs to user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found in DB" }, { status: 401 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { userId: true },
    });

    if (!interview || interview.userId !== dbUser.id) {
      return NextResponse.json(
        { success: false, error: "Interview not found or unauthorized" },
        { status: 404 }
      );
    }

    // Determine connection number by counting existing sessions for this interview
    const existingCount = await prisma.deepgramSession.count({
      where: { interviewId },
    });

    const pipelineUsage = await prisma.interviewPipelineUsage.findUnique({
      where: { interviewId },
      select: { id: true }
    });

    // We use upsert on requestId to be safe against flaky network retries 
    // of the same POST request
    const result = await prisma.deepgramSession.upsert({
      where: { requestId },
      update: {
        // If it already exists, just update the captureSource if needed
        ...(source ? { captureSource: source } : {}),
        ...(pipelineUsage ? { pipelineUsageId: pipelineUsage.id } : {}),
      },
      create: {
        interviewId,
        userId: dbUser.id,
        ...(pipelineUsage ? { pipelineUsageId: pipelineUsage.id } : {}),
        requestId,
        connectionNumber: existingCount + 1,
        ...(source ? { captureSource: source } : {}),
      },
    });

    console.log("[VoiceSessionId] Successfully upserted session:", result.requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VoiceSessionId] Error saving request ID:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
