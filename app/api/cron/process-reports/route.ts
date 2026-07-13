import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { evaluateInterview } from "@/services/interview.service";
import { saveReport, getReport } from "@/services/report.service";
import { persistInterviewMemory } from "@/services/memory.service";

export async function GET(request: NextRequest) {
  // 1. Verify Authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch pending jobs that are due
    const pendingJobs = await prisma.reportGenerationJob.findMany({
      where: {
        status: "PENDING",
        nextRetryAt: { lte: new Date() },
      },
      take: 5, // Process in small batches to avoid serverless timeouts
      orderBy: { createdAt: "asc" },
      include: {
        interview: {
          select: {
            userId: true,
            company: true,
            customCompanyName: true,
            role: true,
            interviewType: true,
            status: true,
          }
        }
      }
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({ success: true, message: "No pending jobs." });
    }

    let processed = 0;
    let failed = 0;

    // 3. Process jobs
    for (const job of pendingJobs) {
      try {
        // Mark as processing
        await prisma.reportGenerationJob.update({
          where: { id: job.id },
          data: { status: "PROCESSING", startedAt: new Date() },
        });

        // Idempotency check: Does a report already exist?
        const existingReport = await prisma.report.findUnique({
          where: { interviewId: job.interviewId },
        });

        if (existingReport) {
          await prisma.reportGenerationJob.update({
            where: { id: job.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
          processed++;
          continue;
        }

        console.log(`[Job] Processing report generation for interview ${job.interviewId}`);

        // Generate report
        const evaluation = await evaluateInterview({
          interviewId: job.interviewId,
          userId: job.userId,
        });

        const saved = await saveReport(job.userId, job.interviewId, evaluation);

        // Memory persistence
        await persistInterviewMemory(
          { ...saved, interview: job.interview as any },
          { historicalTrend: evaluation.historicalProgress?.overallTrend ?? null },
        );

        // Ensure interview is marked completed
        if (job.interview.status !== "COMPLETED") {
           await prisma.interview.update({
             where: { id: job.interviewId },
             data: { status: "COMPLETED", endedAt: new Date() }
           });
        }

        // Complete job
        await prisma.reportGenerationJob.update({
          where: { id: job.id },
          data: { status: "COMPLETED", completedAt: new Date(), lastError: null },
        });

        // EMAIL DISABLED AS PER USER REQUEST
        // email notification would go here

        processed++;
      } catch (error: any) {
        console.error(`[Job] Failed processing job ${job.id}`, error);
        failed++;

        const newRetryCount = job.retryCount + 1;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        let failureReason = "UNKNOWN";
        if (/429|rate limit/i.test(errorMessage)) failureReason = "RATE_LIMITED";
        else if (/500|502|503|504/i.test(errorMessage)) failureReason = "SERVICE_UNAVAILABLE";
        else if (/fetch failed|network|timeout/i.test(errorMessage)) failureReason = "NETWORK_ERROR";

        if (newRetryCount >= 10) {
          await prisma.reportGenerationJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              lastError: errorMessage,
              retryCount: newRetryCount,
              failureReason: failureReason as any
            }
          });
        } else {
          // Exponential backoff: 1m, 2m, 4m, 8m, 16m...
          const backoffMinutes = Math.pow(2, newRetryCount - 1);
          const nextRetry = new Date(Date.now() + backoffMinutes * 60000);

          await prisma.reportGenerationJob.update({
            where: { id: job.id },
            data: {
              status: "PENDING",
              lastError: errorMessage,
              retryCount: newRetryCount,
              nextRetryAt: nextRetry,
              failureReason: failureReason as any
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processed} jobs. Failed ${failed} jobs.`
    });

  } catch (error: any) {
    console.error("[Job] Global cron error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
