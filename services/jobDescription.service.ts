import "server-only";

import { prisma } from "@/lib/db";
import type { JobDescriptionUploadInput } from "@/lib/validations/job-description";

export async function saveJobDescription(userId: string, input: JobDescriptionUploadInput) {
  return prisma.jobDescription.create({
    data: {
      userId,
      company: input.company,
      title: input.title,
      fileUrl: input.fileUrl || null,
    },
  });
}

export async function getLatestJobDescription(userId: string) {
  return prisma.jobDescription.findFirst({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });
}

// TODO: JD parsing with Gemini
