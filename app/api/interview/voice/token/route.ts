import { currentUser } from "@clerk/nextjs/server";

import { isDeepgramConfigured } from "@/lib/deepgram/client";
import { createDeepgramToken } from "@/services/deepgram.service";
import { success, failure, unauthorized } from "@/lib/utils/api";

/**
 * GET /api/interview/voice/token
 *
 * Mints a short-lived Deepgram access token the browser uses to open the Voice
 * Agent WebSocket (`wss://agent.deepgram.com/v1/agent/converse`) directly. A
 * longer TTL than the 30s STT/TTS token is used because the agent session must
 * survive the whole interview handshake — keepalive frames sustain the open
 * socket afterwards. Kept thin: all Deepgram logic lives in the service.
 */
const AGENT_TOKEN_TTL_SECONDS = 300;

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return unauthorized();
    }

    if (!isDeepgramConfigured()) {
      return failure("Deepgram is not configured", 501);
    }

    const token = await createDeepgramToken(AGENT_TOKEN_TTL_SECONDS);
    return success(token);
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Failed to create Deepgram token";
    return failure(message, 500);
  }
}
