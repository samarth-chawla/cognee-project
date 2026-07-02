import "server-only";

import { prisma } from "@/lib/db";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import type { ProfileUpdateInput } from "@/lib/validations/profile";

export async function getFullProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      resumes: {
        orderBy: { uploadedAt: "desc" },
        take: 1,
      },
      jobDescriptions: {
        orderBy: { uploadedAt: "desc" },
        take: 1,
      },
      analytics: true,
    },
  });
}

export async function upsertProfile(userId: string, input: OnboardingInput) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      experience: input.experience,
      githubUrl: input.githubUrl || null,
      linkedinUrl: input.linkedinUrl || null,
      targetRole: input.targetRole,
      preferredInterviewMode: input.preferredInterviewMode,
      preferredDifficulty: input.preferredDifficulty,
      targetCompanies: input.targetCompanies,
      interviewTypes: input.interviewTypes,
    },
    update: {
      experience: input.experience,
      githubUrl: input.githubUrl || null,
      linkedinUrl: input.linkedinUrl || null,
      targetRole: input.targetRole,
      preferredInterviewMode: input.preferredInterviewMode,
      preferredDifficulty: input.preferredDifficulty,
      targetCompanies: input.targetCompanies,
      interviewTypes: input.interviewTypes,
    },
  });
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
