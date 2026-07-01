import { NextRequest, NextResponse } from "next/server";
import { ok, fail, uid, nowISO } from "@/lib/utils";
import { generateQuestions } from "@/services/interviewService";
import type { AIProvider, Interview } from "@/types";

/**
 * POST /api/interview
 * body: { role, userId?, provider? }
 * Creates a new interview with AI-generated, memory-personalized questions.
 */
export async function POST(req: NextRequest) {
  try {
    const { role, userId = "demo-user", provider } = (await req.json()) as {
      role: string;
      userId?: string;
      provider?: AIProvider;
    };
    if (!role) return NextResponse.json(fail("role required"), { status: 400 });

    const questions = await generateQuestions({ userId, role, provider });

    const interview: Interview = {
      id: uid("intv"),
      userId,
      role,
      status: "in_progress",
      questions,
      answers: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    return NextResponse.json(ok(interview));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "interview error"),
      { status: 500 }
    );
  }
}

/** GET /api/interview — placeholder for listing a user's interviews. */
export async function GET() {
  return NextResponse.json(ok([]));
}
