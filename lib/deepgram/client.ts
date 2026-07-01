const DEEPGRAM_API = "https://api.deepgram.com/v1";

export function deepgramHeaders(contentType?: string): HeadersInit {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("DEEPGRAM_API_KEY is not configured");
  return { Authorization: `Token ${key}`, ...(contentType ? { "Content-Type": contentType } : {}) };
}

export function deepgramUrl(path: string) {
  return `${DEEPGRAM_API}${path}`;
}
