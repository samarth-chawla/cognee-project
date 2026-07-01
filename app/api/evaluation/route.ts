import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/utils";
import { evaluateInterview } from "@/services/interviewService";
import { rememberEvaluation } from "@/services/memoryService";
import { saveReport } from "@/services/reportService";
import type { AIProvider, Interview } from "@/types";

/**
 * POST /api/evaluation
 * body: { interview, provider? }
 * Scores the interview, saves a report, and writes insights to memory.
 */
export async function POST(req: NextRequest) {
  try {
    const { interview, provider } = (await req.json()) as {
      interview: Interview;
      provider?: AIProvider;
    };
    if (!interview) {
      return NextResponse.json(fail("interview required"), { status: 400 });
    }

    const evaluation = await evaluateInterview({
      interviewId: interview.id,
      role: interview.role,
      questions: interview.questions,
      answers: interview.answers,
      provider,
    });

    // Persist + remember (best-effort in demo mode).
    await Promise.allSettled([
      saveReport(interview.userId, interview.id, evaluation),
      rememberEvaluation(interview.userId, interview.id, evaluation),
    ]);

    return NextResponse.json(ok(evaluation));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "evaluation error"),
      { status: 500 }
    );
  }
}
