import "server-only";

import { getDeepgramClient } from "@/lib/deepgram/client";

/** Default lifetime (seconds) for a browser token. Deepgram caps this low on purpose. */
const DEFAULT_TTL_SECONDS = 30;

export interface DeepgramTokenResult {
  /** Short-lived JWT the browser uses to authenticate directly with Deepgram. */
  token: string;
  /** ISO timestamp after which the token is rejected. */
  expiresAt: string;
  /** Seconds until expiry — convenient for client-side refresh scheduling. */
  expiresIn: number;
}

/**
 * Mint a short-lived Deepgram access token for client-side use.
 *
 * The browser cannot be trusted with the long-lived DEEPGRAM_API_KEY, so we
 * exchange it (server-side) for a 30s JWT scoped to the voice APIs. The frontend
 * opens its WebSocket directly to Deepgram using this token.
 */
export async function createDeepgramToken(
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<DeepgramTokenResult> {
  const client = getDeepgramClient();

  const grant = await client.auth.v1.tokens.grant({ ttl_seconds: ttlSeconds });

  if (!grant?.access_token) {
    throw new Error("Deepgram did not return an access token");
  }

  const expiresIn = grant.expires_in ?? ttlSeconds;

  return {
    token: grant.access_token,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    expiresIn,
  };
}
