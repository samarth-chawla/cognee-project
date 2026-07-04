import { currentUser } from "@clerk/nextjs/server";

import { isDeepgramConfigured } from "@/lib/deepgram/client";
import { createDeepgramToken } from "@/services/deepgram.service";
import { success, failure, unauthorized } from "@/lib/utils/api";

/**
 * GET /api/speech/token
 *
 * Returns a short-lived Deepgram access token the browser uses to open its own
 * WebSocket. Kept intentionally thin — all Deepgram logic lives in the service.
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return unauthorized();
    }

    if (!isDeepgramConfigured()) {
      return failure("Deepgram is not configured", 501);
    }

    const token = await createDeepgramToken();
    return success(token);
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Failed to create Deepgram token";
    return failure(message, 500);
  }
}
