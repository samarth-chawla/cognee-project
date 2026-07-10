import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentWindowInterviewCount } from "@/services/usage.service";
import { getLimits, getWindowLabel } from "@/lib/config/limits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { MAX_INTERVIEWS, WINDOW } = getLimits();
    const totalUsed = await getCurrentWindowInterviewCount(user.id);

    return NextResponse.json({
      success: true,
      data: {
        totalUsed,
        maxUses: MAX_INTERVIEWS,
        remaining: Math.max(0, MAX_INTERVIEWS - totalUsed),
        isLimitReached: totalUsed >= MAX_INTERVIEWS,
        window: WINDOW,
        windowLabel: getWindowLabel(WINDOW),
      },
    });
  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
