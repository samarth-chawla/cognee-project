import "server-only";
import { prisma } from "@/lib/db/prisma";
import { LIMITS } from "@/lib/config/limits";
import { InterviewStatus } from "@prisma/client";
import { logger } from "@/lib/utils/logger";

export async function getCurrentMonthInterviewCount(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.interview.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: {
        in: [InterviewStatus.READY, InterviewStatus.ONGOING, InterviewStatus.COMPLETED, InterviewStatus.CANCELLED],
      },
    },
  });

  return count;
}

export async function canGenerateInterview(userId: string): Promise<boolean> {
  const count = await getCurrentMonthInterviewCount(userId);
  const allowed = count < LIMITS.MAX_INTERVIEWS_PER_MONTH;
  const remaining = Math.max(0, LIMITS.MAX_INTERVIEWS_PER_MONTH - count);
  
  logger.info("[Usage] Interview generation check", {
    userId,
    currentMonthUsage: count,
    remainingInterviews: remaining,
    allowed
  });

  return allowed;
}

export async function getRemainingInterviews(userId: string): Promise<number> {
  const count = await getCurrentMonthInterviewCount(userId);
  return Math.max(0, LIMITS.MAX_INTERVIEWS_PER_MONTH - count);
}
