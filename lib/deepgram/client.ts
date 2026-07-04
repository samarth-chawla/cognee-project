import "server-only";

import { DeepgramClient } from "@deepgram/sdk";

const DEEPGRAM_API = "https://api.deepgram.com/v1";

export function deepgramHeaders(contentType?: string): HeadersInit {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("DEEPGRAM_API_KEY is not configured");
  return { Authorization: `Token ${key}`, ...(contentType ? { "Content-Type": contentType } : {}) };
}

export function deepgramUrl(path: string) {
  return `${DEEPGRAM_API}${path}`;
}

/** True when a Deepgram API key is present in the environment. */
export function isDeepgramConfigured(): boolean {
  return Boolean(process.env.DEEPGRAM_API_KEY);
}

let cachedClient: DeepgramClient | null = null;

/**
 * Reusable server-side Deepgram SDK client (v5, Fern-generated).
 * Reads DEEPGRAM_API_KEY from the environment and memoizes the instance.
 * Never import this in client components — the API key must stay server-side.
 */
export function getDeepgramClient(): DeepgramClient {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not configured");
  if (!cachedClient) {
    cachedClient = new DeepgramClient({ apiKey });
  }
  return cachedClient;
}
