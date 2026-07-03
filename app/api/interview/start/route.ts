import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/services/interview.service";
import { createInterviewSession } from "@/lib/interview/session";
import { errorResponse, fail, ok } from "@/lib/utils/api";
import type { AIProvider } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { role, userId = "demo-user", provider, jobDescription } = (await request.json()) as { 
      role: string; 
      userId?: string; 
      provider?: AIProvider;
      jobDescription?: string;
    };
    if (!role) return NextResponse.json(fail("role required"), { status: 400 });
    const questions = await generateQuestions({ userId, role, provider, jobDescription });
    return NextResponse.json(ok(createInterviewSession(userId, role, questions)));
  } catch (reason) { return errorResponse(reason, "interview start error"); }
}
