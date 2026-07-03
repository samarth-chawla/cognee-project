import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { processInterviewGeneration } from "@/services/questionGenerator.service";

const bodySchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = bodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: result.error.format() },
        { status: 400 }
      );
    }

    const { interviewId } = result.data;

    // Verify ownership
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { user: true },
    });

    if (!interview || interview.user.clerkId !== userId) {
      return NextResponse.json(
        { success: false, error: "Interview not found or unauthorized" },
        { status: 404 }
      );
    }

    const generationResult = await processInterviewGeneration(interviewId);

    return NextResponse.json({
      success: true,
      data: {
        interviewId: generationResult.interviewId,
        status: "READY",
        totalQuestions: generationResult.totalQuestions,
        currentQuestion: generationResult.currentQuestion ? {
          id: generationResult.currentQuestion.id,
          sequence: generationResult.currentQuestion.sequence,
          category: generationResult.currentQuestion.category,
          difficulty: generationResult.currentQuestion.difficulty,
          displayQuestion: generationResult.currentQuestion.displayQuestion,
          ttsTranscript: generationResult.currentQuestion.ttsTranscript,
        } : null
      },
    });

  } catch (error: any) {
    console.error("[INTERVIEW_GENERATE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
