import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/utils";
import { listReports } from "@/services/reportService";

/**
 * GET /api/reports?userId=  -> list reports for a user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "demo-user";
    const reports = await listReports(userId);
    return NextResponse.json(ok(reports));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "reports error"),
      { status: 500 }
    );
  }
}
