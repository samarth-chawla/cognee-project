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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const generationResult = await processInterviewGeneration({
      userId: user.id,
      interviewId,
    });

    return NextResponse.json({
      success: true,
      data: {
        interviewId: generationResult.interviewId,
        status: generationResult.status,
        totalQuestions: generationResult.totalQuestions,
        questions: generationResult.questions,
        currentQuestion: generationResult.currentQuestion,
      },
    });

  } catch (error: any) {
    console.error("[INTERVIEW_GENERATE_ERROR]", error);
    if (error.message === "Interview not found") {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
