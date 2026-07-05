import { NextResponse } from "next/server";
import { errorResponse, ok } from "@/lib/utils/api";
import { listReports } from "@/services/report.service";
import { requireUserId, getOrCreateDBUser, AuthError } from "@/services/auth.service";

export async function GET() {
  try {
    const clerkId = await requireUserId();
    const user = await getOrCreateDBUser(clerkId);
    return NextResponse.json(ok(await listReports(user.id)));
  } catch (reason) {
    if (reason instanceof AuthError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return errorResponse(reason, "history error");
  }
}
