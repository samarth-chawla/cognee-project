import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createInterviewSession } from "@/services/interview.service";
import { success, failure, errorResponse, unauthorized, handleZodError } from "@/lib/utils/api";
import { prisma } from "@/lib/db/prisma";
import { canGenerateInterview } from "@/services/usage.service";
import { Difficulty } from "@prisma/client";

const StartInterviewSchema = z.object({
  company: z.string().min(1, "Company is required").optional(),
  companyType: z.string().optional(),
  customCompanyName: z.string().optional(),
  role: z.string().min(1, "Role is required").optional(),
  interviewType: z.string().min(1, "Interview type is required").optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  jobDescription: z.string().optional(),
  forceNew: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.company === "Other") {
    if (!data.companyType || data.companyType.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "companyType is required when company is 'Other'",
        path: ["companyType"],
      });
    }

    if (!data.customCompanyName || data.customCompanyName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customCompanyName is required when company is 'Other'",
        path: ["customCompanyName"],
      });
    }
  }
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return failure("User not found", 404);
    }

    const body = await request.json();
    
    const parsed = StartInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const interview = await createInterviewSession({
      userId: user.id,
      company: parsed.data.company,
      companyType: parsed.data.companyType,
      customCompanyName: parsed.data.customCompanyName,
      role: parsed.data.role,
      interviewType: parsed.data.interviewType,
      difficulty: parsed.data.difficulty,
      jobDescription: parsed.data.jobDescription,
      forceNew: parsed.data.forceNew,
    });

    return success({
      interviewId: interview.id,
      status: interview.status,
    });

  } catch (error: any) {
    if (error.message === "INTERVIEW_LIMIT_REACHED") {
      return new Response(JSON.stringify({
        success: false,
        code: "INTERVIEW_LIMIT_REACHED",
        message: "You have reached the monthly interview limit.",
        remaining: 0
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (error.message === "PROFILE_NOT_FOUND") {
      return failure("Profile not found", 404);
    }
    if (error.message === "RESUME_NOT_FOUND") {
      return failure("Parsed resume not found", 404);
    }
    if (error.message === "INTERVIEW_CONFIG_INCOMPLETE") {
      return failure("Interview configuration is incomplete", 400);
    }
    return errorResponse(error, "Failed to create interview session");
  }
}
