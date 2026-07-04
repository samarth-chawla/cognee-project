import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { saveAnswerAndAdvance } from "@/services/voiceInterview.service";

/**
 * POST /api/interview/voice/answer
 *
 * Voice Agent turn handler. Saves the transcript for the just-completed
 * question and returns the next question (or done) so the client injects it
 * into the same live agent session. Separate from the V1 `/api/interview/answer`
 * route, which stays untouched. Thin: all logic lives in the service.
 */
const bodySchema = z.object({
  interviewId: z.string().min(1, "interviewId is required"),
  sequence: z.number().int().positive(),
  transcript: z.string().min(1, "transcript is required"),
  durationSec: z.number().int().nonnegative().optional(),
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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const result = await saveAnswerAndAdvance({
      interviewId: parsed.data.interviewId,
      userId: user.id,
      sequence: parsed.data.sequence,
      transcript: parsed.data.transcript,
      durationSec: parsed.data.durationSec,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error?.message === "INTERVIEW_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save answer" },
      { status: 500 }
    );
  }
}
