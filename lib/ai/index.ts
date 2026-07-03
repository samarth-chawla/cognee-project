import type { AIProvider } from "@/types";
import { openaiComplete } from "./openai";
import { geminiComplete } from "./gemini";

export * from "./openai";
export * from "./gemini";

/** Provider-agnostic completion. Defaults to AI_PROVIDER env or "gemini". */
export async function complete(
  system: string,
  user: string,
  opts: { provider?: AIProvider; json?: boolean; model?: string } = {}
): Promise<string> {
  const provider =
    opts.provider ?? (process.env.AI_PROVIDER as AIProvider) ?? "gemini";
  return provider === "gemini"
    ? geminiComplete(system, user, opts)
    : openaiComplete(system, user, opts);
}

/** Parse a JSON string returned by an LLM, tolerating code fences. */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
