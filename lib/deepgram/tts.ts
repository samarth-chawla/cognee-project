import "server-only";

import { deepgramHeaders, deepgramUrl } from "./client";

export interface TTSOptions {
  /** Deepgram Aura model to use. Defaults to aura-2-thalia-en. */
  model?: string;
}

/**
 * Call Deepgram TTS and return the raw audio Response.
 * Caller can stream or buffer depending on context.
 * Throws on non-OK HTTP status with the Deepgram error body forwarded.
 */
export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Response> {
  const model = options.model ?? "aura-2-thalia-en";

  const upstream = await fetch(deepgramUrl(`/speak?model=${model}`), {
    method: "POST",
    headers: deepgramHeaders("application/json"),
    body: JSON.stringify({ text }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(
      `Deepgram TTS error ${upstream.status}: ${detail || upstream.statusText}`
    );
  }

  return upstream;
}

/**
 * Convenience wrapper that buffers the full audio into an ArrayBuffer.
 * Use for small payloads where streaming is not required.
 */
export async function synthesizeSpeechToBuffer(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  const res = await synthesizeSpeech(text, options);
  return res.arrayBuffer();
}
