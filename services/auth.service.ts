import "server-only";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.userId ?? null;
}

export async function requireUserId(): Promise<string> {
  const clerkId = await getAuthenticatedUserId();
  if (!clerkId) {
    throw new AuthError("Unauthorized");
  }
  return clerkId;
}

export async function getOrCreateDBUser(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      clerkId,
      email: "",
      fullName: "Candidate",
      profile: { create: {} },
      analytics: { create: {} },
    },
  });
}

export async function syncClerkUser(clerkId: string, email: string, fullName?: string | null) {
  const existing = await prisma.user.findUnique({ where: { clerkId } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { email, fullName: fullName || existing.fullName },
    });
  }

  return prisma.user.create({
    data: {
      clerkId,
      email,
      fullName: fullName || email.split("@")[0] || "Candidate",
      profile: { create: {} },
      analytics: { create: {} },
    },
  });
}

export async function getDBUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      profile: true,
      analytics: true,
    },
  });
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
