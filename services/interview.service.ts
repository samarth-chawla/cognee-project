import { prisma } from "@/lib/db/prisma";
import { Difficulty } from "@prisma/client";
import { complete, parseJSON } from "@/lib/ai";
import {
  buildEvaluationPrompt,
  evaluationSystemPrompt,
} from "@/lib/ai/prompts";
import { searchMemory } from "@/lib/cognee";
import { uid } from "@/lib/utils";
import type {
  AIProvider,
  Answer,
  Evaluation,
  Question,
} from "@/types";
import { MAX_INTERVIEW_QUESTIONS } from "@/lib/utils/constants";


/** Evaluate answered questions and return a structured evaluation. */
export async function evaluateInterview(params: {
  interviewId: string;
  role: string;
  questions: Question[];
  answers: Answer[];
  provider?: AIProvider;
}): Promise<Evaluation> {
  const { interviewId, role, questions, answers, provider } = params;

  const qa = questions.map((question) => ({
    question,
    answer: answers.find((a) => a.questionId === question.id),
  }));

  const raw = await complete(
    evaluationSystemPrompt,
    buildEvaluationPrompt({ role, qa }),
    { provider, json: true }
  );

  const parsed = parseJSON<Omit<Evaluation, "id" | "interviewId" | "createdAt">>(
    raw
  );

  return {
    id: uid("eval"),
    interviewId,
    createdAt: new Date().toISOString(),
    ...parsed,
  };
}

export interface CreateInterviewParams {
  userId: string;
  company: string;
  companyType?: string;
  customCompanyName?: string;
  role: string;
  interviewType: string;
  difficulty: Difficulty;
  jobDescription?: string;
}

export async function createInterviewSession(params: CreateInterviewParams) {
  const { userId, company, companyType, customCompanyName, role, interviewType, difficulty, jobDescription } = params;

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!userProfile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const latestResume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });

  if (!latestResume) {
    throw new Error("RESUME_NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    let jobDescriptionId: string | undefined = undefined;

    if (jobDescription) {
      const createdJd = await tx.jobDescription.create({
        data: {
          userId,
          company: company === "Other" && customCompanyName ? customCompanyName : company,
          title: role,
          rawText: jobDescription,
          parsedSkills: [],
        },
      });
      jobDescriptionId = createdJd.id;
    }

    const interview = await tx.interview.create({
      data: {
        userId,
        resumeId: latestResume.id,
        jobDescriptionId,
        company,
        companyType,
        customCompanyName,
        role,
        interviewType,
        difficulty,
        status: "GENERATING",
      },
    });

    return interview;
  });
}
