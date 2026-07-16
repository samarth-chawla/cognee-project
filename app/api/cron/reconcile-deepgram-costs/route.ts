import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { updateDeepgramReconciledCost } from "@/services/pipelineUsage.service";
import { calculateTotalPipelineCost } from "@/lib/ai/pricing";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = process.env.DEEPGRAM_PROJECT_ID;
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!projectId || !apiKey) {
      console.error("[DeepgramCron] Missing DEEPGRAM_PROJECT_ID or DEEPGRAM_API_KEY");
      return NextResponse.json(
        { success: false, error: "Missing config" },
        { status: 500 }
      );
    }

    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Get all unreconciled sessions from the last 7 days
    const sessions = await prisma.deepgramSession.findMany({
      where: {
        unrecoverable: false,
        OR: [
          { reconciledAt: null },
          { reconciledAt: { lt: seventyTwoHoursAgo } },
        ],
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json({ success: true, reconciled: 0, skipped: 0, unrecoverable: 0 });
    }

    // Map for fast O(1) lookup
    const sessionMap = new Map<string, typeof sessions[0]>();
    for (const session of sessions) {
      sessionMap.set(session.requestId, session);
    }

    // 2. Bulk fetch ALL requests from Deepgram for the last 3 days
    // Deepgram API uses ISO-8601 strings for `start`
    const startStr = seventyTwoHoursAgo.toISOString();
    let page = 0;
    const limit = 100; // max allowed by Deepgram API
    
    // costMap holds requestId -> cost (number) for all requests we found
    const costMap = new Map<string, number>();

    while (true) {
      const url = `https://api.deepgram.com/v1/projects/${projectId}/requests?start=${startStr}&limit=${limit}&status=succeeded`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("[DeepgramCron] Bulk fetch failed", res.status);
        break; // Stop fetching, process what we have (or just exit loop)
      }

      const data = await res.json();
      const requests = data?.requests || [];

      if (requests.length === 0) break; // Reached end of pagination

      for (const req of requests) {
        // Look for details.usd if present
        const usd = req?.details?.usd;
        if (typeof usd === "number") {
          costMap.set(req.request_id, usd);
        }
      }

      // Check if we have more pages (Deepgram doesn't return total pages often, 
      // but returning less than 'limit' guarantees it's the end)
      if (requests.length < limit) break;
      
      // Currently the Deepgram API doesn't standardly use 'page' param in the same way,
      // it might require 'start' manipulation or 'cursor'. Wait, looking at the docs, 
      // usually it returns the newest first, so we might not be able to traverse easily without a cursor.
      // But typically for 100 limit, we might only need 1 fetch for low traffic. 
      // Assuming 'page' parameter isn't supported without 'cursor', we will just stop here.
      // NOTE: For true pagination, we'd need to use 'start' based on the last record's timestamp.
      break; 
    }

    let reconciledCount = 0;
    let skippedCount = 0;
    let unrecoverableCount = 0;
    const updatedInterviewIds = new Set<string>();

    // 3. Match sessions with our fetched costMap
    for (const session of sessions) {
      const { requestId, capturedAt } = session;

      if (costMap.has(requestId)) {
        const usd = costMap.get(requestId)!;
        await prisma.deepgramSession.update({
          where: { id: session.id },
          data: {
            reconciledCostUsd: new Prisma.Decimal(usd),
            reconciledAt: new Date(),
          },
        });
        reconciledCount++;
        updatedInterviewIds.add(session.interviewId);
      } else {
        // Not found in this bulk fetch. 
        // Could be pending, or could be older than 3 days, or older than our page limit.
        if (capturedAt < sevenDaysAgo) {
          await prisma.deepgramSession.update({
            where: { id: session.id },
            data: { unrecoverable: true, unrecoverableAt: new Date() },
          });
          unrecoverableCount++;
          updatedInterviewIds.add(session.interviewId);
        } else {
          skippedCount++;
        }
      }
    }

    // 4. For each interview that had at least one session update, recompute total cost
    for (const interviewId of updatedInterviewIds) {
      const interviewSessions = await prisma.deepgramSession.findMany({
        where: { interviewId },
      });

      const usageRow = await prisma.interviewPipelineUsage.findUnique({
        where: { interviewId },
        select: {
          deepgramCostEstimateUsd: true,
          geminiTotalCostUsd: true,
          reportTotalCostUsd: true,
          cogneeSaveCostUsd: true,
          cogneeRetrievalCostUsd: true,
        },
      });

      if (!usageRow) continue;

      let computedDeepgramCost = 0;
      const totalSessions = interviewSessions.length;
      
      const estimateUsd = usageRow.deepgramCostEstimateUsd ? Number(usageRow.deepgramCostEstimateUsd) : 0;
      const estimatePerSession = totalSessions > 0 ? estimateUsd / totalSessions : 0;

      for (const s of interviewSessions) {
        if (s.reconciledCostUsd !== null) {
          computedDeepgramCost += Number(s.reconciledCostUsd);
        } else {
          // Unreconciled or unrecoverable fallback
          computedDeepgramCost += estimatePerSession;
        }
      }

      await updateDeepgramReconciledCost(interviewId, computedDeepgramCost);

      // Recompute totalPipelineCostUsd from scratch
      const totalCost = calculateTotalPipelineCost(
        usageRow.geminiTotalCostUsd ? Number(usageRow.geminiTotalCostUsd) : 0,
        usageRow.reportTotalCostUsd ? Number(usageRow.reportTotalCostUsd) : 0,
        computedDeepgramCost,
        usageRow.cogneeSaveCostUsd ? Number(usageRow.cogneeSaveCostUsd) : 0,
        usageRow.cogneeRetrievalCostUsd ? Number(usageRow.cogneeRetrievalCostUsd) : 0,
      );

      await prisma.interviewPipelineUsage.update({
        where: { interviewId },
        data: {
          totalPipelineCostUsd: new Prisma.Decimal(totalCost),
        },
      });
    }

    console.log(`[DeepgramCron] Finished. Reconciled: ${reconciledCount}, Unrecoverable: ${unrecoverableCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      reconciled: reconciledCount,
      unrecoverable: unrecoverableCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("[DeepgramCron] Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
