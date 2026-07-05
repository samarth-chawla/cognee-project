import { NextResponse } from "next/server";
import { listReports } from "@/services/report.service";
import { summarizeAnalytics } from "@/services/analytics.service";
import { requireUserId, getOrCreateDBUser, AuthError } from "@/services/auth.service";
import { errorResponse, ok } from "@/lib/utils/api";

export async function GET() {
  try {
    const clerkId = await requireUserId();
    const user = await getOrCreateDBUser(clerkId);
    return NextResponse.json(ok(summarizeAnalytics(await listReports(user.id))));
  } catch (reason) {
    if (reason instanceof AuthError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return errorResponse(reason, "analytics error");
  }
}
