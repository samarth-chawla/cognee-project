import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getLimits, getUsageWindowBounds } from "@/lib/config/limits";
import { InterviewStatus } from "@prisma/client";
import { logger } from "@/lib/utils/logger";

const COUNTED_STATUSES = [
  InterviewStatus.READY,
  InterviewStatus.ONGOING,
  InterviewStatus.COMPLETED,
  InterviewStatus.CANCELLED,
];

// Live interviews for this user in the current window PLUS any interviews used
// under a same-email account deleted within this window (anti-abuse carry-over).
export async function getCurrentWindowInterviewCount(userId: string): Promise<number> {
  const { start, end } = getUsageWindowBounds();

  const liveCount = await prisma.interview.count({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
      status: { in: COUNTED_STATUSES },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  let priorUsed = 0;
  if (user?.email) {
    const agg = await prisma.accountDeletionLog.aggregate({
      where: { email: user.email, deletedAt: { gte: start, lte: end } },
      _sum: { usedCount: true },
    });
    priorUsed = agg._sum.usedCount ?? 0;
  }

  return liveCount + priorUsed;
}

/** @deprecated use getCurrentWindowInterviewCount */
export const getCurrentMonthInterviewCount = getCurrentWindowInterviewCount;

export async function canGenerateInterview(userId: string): Promise<boolean> {
  const { MAX_INTERVIEWS, WINDOW } = getLimits();
  const count = await getCurrentWindowInterviewCount(userId);
  const allowed = count < MAX_INTERVIEWS;
  const remaining = Math.max(0, MAX_INTERVIEWS - count);

  logger.info("[Usage] Interview generation check", {
    userId,
    window: WINDOW,
    currentUsage: count,
    remainingInterviews: remaining,
    allowed,
  });

  return allowed;
}

export async function getRemainingInterviews(userId: string): Promise<number> {
  const { MAX_INTERVIEWS } = getLimits();
  const count = await getCurrentWindowInterviewCount(userId);
  return Math.max(0, MAX_INTERVIEWS - count);
}
