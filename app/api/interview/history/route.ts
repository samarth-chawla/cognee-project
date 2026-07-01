import { NextRequest, NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/utils/api";
import { listReports } from "@/services/report.service";
export async function GET(request: NextRequest) {
  try { const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user"; return NextResponse.json(ok(await listReports(userId))); }
  catch (reason) { return errorResponse(reason, "history error"); }
}
