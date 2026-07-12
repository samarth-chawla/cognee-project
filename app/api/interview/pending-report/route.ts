import { NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/utils/api";
import { getPendingReportInterview } from "@/services/report.service";
import { requireUserId, getOrCreateDBUser, AuthError } from "@/services/auth.service";

/**
 * Returns the user's latest interview that has answers but no report yet
 * (evaluation failed under high demand, or never finished), or null. The
 * reports page uses this to show a "Generate latest report" button.
 */
export async function GET() {
  try {
    const clerkId = await requireUserId();
    const user = await getOrCreateDBUser(clerkId);
    return NextResponse.json(ok(await getPendingReportInterview(user.id)));
  } catch (reason) {
    if (reason instanceof AuthError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return errorResponse(reason, "pending-report error");
  }
}
