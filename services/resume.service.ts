import "server-only";

import { prisma } from "@/lib/db";

export async function saveResumeMetadata(userId: string, fileUrl: string) {
  return prisma.resume.create({
    data: { userId, fileUrl },
  });
}

export async function getLatestResume(userId: string) {
  return prisma.resume.findFirst({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });
}

// TODO: Resume parsing with Gemini
