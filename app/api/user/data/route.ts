import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.interview.deleteMany({ where: { userId: user.id } }),
      prisma.resume.deleteMany({ where: { userId: user.id } }),
      prisma.jobDescription.deleteMany({ where: { userId: user.id } }),
      prisma.interviewAnalytics.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ success: true, message: "User data deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
