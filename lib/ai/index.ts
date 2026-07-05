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

/**
 * Extract the first balanced top-level JSON value (object or array) from an LLM
 * response. Tolerates code fences, leading prose, AND trailing junk after the
 * JSON (e.g. a second object or a stray "line 77" the model appended), which is
 * what plain `JSON.parse` chokes on ("Unexpected non-whitespace character after
 * JSON"). Scans with a depth counter that ignores braces inside strings.
 */
export function extractJSON<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  // Fast path: already clean JSON.
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall through to balanced extraction.
  }

  const start = cleaned.search(/[{[]/);
  if (start === -1) {
    throw new SyntaxError("No JSON object or array found in AI output");
  }

  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, i + 1)) as T;
      }
    }
  }

  throw new SyntaxError("Unbalanced JSON in AI output");
}

/** Parse a JSON string returned by an LLM, tolerating fences and trailing junk. */
export function parseJSON<T>(raw: string): T {
  return extractJSON<T>(raw);
}
