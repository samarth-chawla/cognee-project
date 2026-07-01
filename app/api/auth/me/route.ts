import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";
import { success, failure, unauthorized } from "@/lib/utils/api";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return unauthorized();
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser.username ||
      email.split("@")[0] ||
      "Candidate";

    // Upsert user — create if first visit, update name/email if changed
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      create: {
        clerkId: clerkUser.id,
        email,
        fullName,
        profile: { create: {} },
        analytics: { create: {} },
      },
      update: { email, fullName },
      include: {
        profile: true,
        analytics: true,
      },
    });

    // Migrate safety: ensure profile and analytics exist for users
    // who were created before these relations were required
    const profile =
      user.profile ??
      (await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }));

    const analytics =
      user.analytics ??
      (await prisma.interviewAnalytics.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }));

    return NextResponse.json(
      success({
        user: {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        profile,
        analytics,
      })
    );
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unable to load current user";
    return NextResponse.json(failure(message), { status: 500 });
  }
}
