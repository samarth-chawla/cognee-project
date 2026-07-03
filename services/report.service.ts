import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { Evaluation, Report } from "@/types";

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
      questionFeedback: [],
      createdAt: report.createdAt.toISOString(),
    },
    createdAt: report.createdAt.toISOString(),
  };
}

export async function listReports(userId: string): Promise<Report[]> {
  const reports = await prisma.report.findMany({
    where: { interview: { userId } },
    include: { interview: { select: { userId: true } } },
    orderBy: { createdAt: "desc" },
  });
  return reports.map((r) => prismaReportToReport(r, r.interview.userId));
}

export async function getReport(reportId: string): Promise<Report | null> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { interview: { select: { userId: true } } },
  });
  if (!report) return null;
  return prismaReportToReport(report, report.interview.userId);
}