import OpenAI from "openai";
import { DEFAULT_MODELS } from "@/constants";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** Chat completion that returns raw text. */
export async function openaiComplete(
  system: string,
  user: string,
  opts: { json?: boolean; model?: string } = {}
): Promise<string> {
  const res = await getOpenAI().chat.completions.create({
    model: opts.model ?? DEFAULT_MODELS.openai,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  });
  return res.choices[0]?.message?.content ?? "";
}
