import { NextRequest, NextResponse } from "next/server";
import { listReports } from "@/services/report.service";
import { summarizeAnalytics } from "@/services/analytics.service";
import { errorResponse, ok } from "@/lib/utils/api";
export async function GET(request: NextRequest) {
  try { const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user"; return NextResponse.json(ok(summarizeAnalytics(await listReports(userId)))); }
  catch (reason) { return errorResponse(reason, "analytics error"); }
}
