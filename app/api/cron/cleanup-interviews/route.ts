import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { InterviewStatus } from "@prisma/client";
import { abortPipeline } from "@/services/pipelineUsage.service";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find ONGOING or READY interviews not updated in the last 60 minutes
    const staleThreshold = new Date(Date.now() - 60 * 60 * 1000);

    const abandoned = await prisma.interview.findMany({
      where: {
        status: { in: [InterviewStatus.ONGOING, InterviewStatus.READY] },
        updatedAt: { lt: staleThreshold },
      },
      select: { id: true },
    });

    if (abandoned.length === 0) {
      return NextResponse.json({ success: true, cleanedUp: 0 });
    }

    await prisma.interview.updateMany({
      where: { id: { in: abandoned.map((i) => i.id) } },
      data: { status: InterviewStatus.FAILED },
    });

    // We can safely Promise.all here because abandoned interviews per hour should be very low
    await Promise.all(
      abandoned.map((i) =>
        abortPipeline({
          interviewId: i.id,
          reason: "STALE_TIMEOUT",
          completedBy: "CRON",
        })
      )
    );

    console.log(`[CRON] Cleaned up ${abandoned.length} stale interviews`);

    return NextResponse.json({
      success: true,
      cleanedUp: abandoned.length,
    });
  } catch (error) {
    console.error("[CRON_CLEANUP_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
