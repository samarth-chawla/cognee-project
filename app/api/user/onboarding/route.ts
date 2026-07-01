import { NextRequest } from "next/server";

import { requireUserId, AuthError } from "@/services/auth.service";
import { upsertProfile } from "@/services/user.service";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { success, failure, unauthorized, handleZodError } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const clerkId = await requireUserId();

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const profile = await upsertProfile(clerkId, parsed.data);

    return success({ profile });
  } catch (reason) {
    if (reason instanceof AuthError) {
      return unauthorized();
    }
    const message = reason instanceof Error ? reason.message : "Onboarding failed";
    return failure(message, 500);
  }
}
