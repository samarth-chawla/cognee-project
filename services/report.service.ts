import "server-only";

import { prisma } from "@/lib/db/prisma";
import { InterviewStatus } from "@prisma/client";
import type { Evaluation, Report } from "@/types";

export interface PendingReportInterview {
  interviewId: string;
  role: string;
  company: string | null;
  customCompanyName: string | null;
  status: string;
  createdAt: string;
}

/**
 * Latest interview that has answers but no report yet because evaluation failed
 * (status FAILED — e.g. deferred under high demand). Used to offer a "Generate
 * latest report" button. Returns null when nothing is pending. ONGOING is
 * excluded so an in-progress interview never shows the banner.
 */
export async function getPendingReportInterview(
  userId: string,
): Promise<PendingReportInterview | null> {
  const job = await prisma.reportGenerationJob.findFirst({
    where: {
      userId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      interview: {
        select: {
          id: true,
          role: true,
          company: true,
          customCompanyName: true,
          status: true,
          createdAt: true,
        }
      }
    }
  });

  if (!job) return null;
  const interview = job.interview;

  return {
    interviewId: interview.id,
    role: interview.role,
    company: interview.company,
    customCompanyName: interview.customCompanyName,
    status: interview.status,
    createdAt: interview.createdAt.toISOString(),
  };
}

/** Persist evaluation data to the Report table via Prisma and return a Report object. */
export async function saveReport(
  userId: string,
  interviewId: string,
  evaluation: Omit<Evaluation, "id" | "interviewId" | "createdAt">
): Promise<Report> {
  const report = await prisma.report.upsert({
    where: { interviewId },
    create: {
      interviewId,
      overallScore: evaluation.overallScore,
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      confidenceScore: evaluation.confidenceScore,
      behavioralScore: evaluation.behavioralScore,
      problemSolvingScore: evaluation.problemSolvingScore,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missingTopics: evaluation.missingTopics,
      recommendations: evaluation.recommendations,
    },
    update: {
      overallScore: evaluation.overallScore,
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      confidenceScore: evaluation.confidenceScore,
      behavioralScore: evaluation.behavioralScore,
      problemSolvingScore: evaluation.problemSolvingScore,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missingTopics: evaluation.missingTopics,
      recommendations: evaluation.recommendations,
    },
  });

  return {
    id: report.id,
    interviewId: report.interviewId,
    userId,
    evaluation: {
      id: report.id,
      interviewId: report.interviewId,
      overallScore: report.overallScore,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      confidenceScore: report.confidenceScore,
      behavioralScore: report.behavioralScore,
      problemSolvingScore: report.problemSolvingScore,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      missingTopics: report.missingTopics,
      recommendations: report.recommendations,
      questionFeedback: evaluation.questionFeedback,
      createdAt: report.createdAt.toISOString(),
    },
    createdAt: report.createdAt.toISOString(),
  };
}

function prismaReportToReport(report: any, userId: string): Report {
  const interview = report.interview;
  return {
    id: report.id,
    interviewId: report.interviewId,
    userId,
    interviewContext: interview
      ? {
          role: interview.role,
          company: interview.company,
          companyType: interview.companyType,
          customCompanyName: interview.customCompanyName,
          interviewType: interview.interviewType,
          difficulty: interview.difficulty,
          startedAt: interview.startedAt ? interview.startedAt.toISOString() : null,
          endedAt: interview.endedAt ? interview.endedAt.toISOString() : null,
        }
      : undefined,
    evaluation: {
      id: report.id,
      interviewId: report.interviewId,
      overallScore: report.overallScore,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      confidenceScore: report.confidenceScore,
      behavioralScore: report.behavioralScore,
      problemSolvingScore: report.problemSolvingScore,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      missingTopics: report.missingTopics,
      recommendations: report.recommendations,
      questionFeedback: [],
      createdAt: report.createdAt.toISOString(),
    },
    createdAt: report.createdAt.toISOString(),
  };
}

const INTERVIEW_SELECT = {
  userId: true,
  role: true,
  company: true,
  companyType: true,
  customCompanyName: true,
  interviewType: true,
  difficulty: true,
  startedAt: true,
  endedAt: true,
} as const;

export async function listReports(userId: string): Promise<Report[]> {
  const reports = await prisma.report.findMany({
    where: { interview: { userId } },
    include: { interview: { select: INTERVIEW_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  return reports.map((r) => prismaReportToReport(r, r.interview.userId));
}

export async function getReport(reportId: string): Promise<Report | null> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { interview: { select: INTERVIEW_SELECT } },
  });
  if (!report) return null;
  return prismaReportToReport(report, report.interview.userId);
}