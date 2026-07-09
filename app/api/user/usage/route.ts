import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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

    const totalUsed = await prisma.interview.count({
      where: { userId: user.id },
    });

    const MAX_USES = 3;

    return NextResponse.json({
      success: true,
      data: {
        totalUsed,
        maxUses: MAX_USES,
        remaining: Math.max(0, MAX_USES - totalUsed),
        isLimitReached: totalUsed >= MAX_USES,
      },
    });
  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
