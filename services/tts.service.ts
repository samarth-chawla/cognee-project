import "server-only";

import { synthesizeSpeech } from "@/lib/deepgram/tts";

export interface TTSRequest {
  text: string;
  model?: string;
}

export class TTSValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TTSValidationError";
  }
}

/**
 * Validate the TTS request and delegate to Deepgram.
 * Returns the raw upstream Response so the API route can stream it directly.
 * Throws TTSValidationError for bad input, Error for upstream failures.
 */
export async function speakText(request: TTSRequest): Promise<Response> {
  const text = request.text?.trim();

  if (!text) {
    throw new TTSValidationError("text must be a non-empty string");
  }

  if (text.length > 4096) {
    throw new TTSValidationError("text exceeds 4096 character limit");
  }

  return synthesizeSpeech(text, { model: request.model });
}
