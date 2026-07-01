import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, ok } from "@/lib/utils/api";
import { evaluateInterview } from "@/services/interview.service";
import { rememberEvaluation } from "@/services/memory.service";
import { saveReport } from "@/services/report.service";
import type { AIProvider, Interview } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { interview, provider } = (await request.json()) as { interview: Interview; provider?: AIProvider };
    if (!interview) return NextResponse.json(fail("interview required"), { status: 400 });
    const evaluation = await evaluateInterview({ interviewId: interview.id, role: interview.role, questions: interview.questions, answers: interview.answers, provider });
    await Promise.allSettled([saveReport(interview.userId, interview.id, evaluation), rememberEvaluation(interview.userId, interview.id, evaluation)]);
    return NextResponse.json(ok(evaluation));
  } catch (reason) { return errorResponse(reason, "report generation error"); }
}
