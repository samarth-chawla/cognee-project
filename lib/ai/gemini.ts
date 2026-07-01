import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_MODELS } from "@/constants";

let client: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  }
  return client;
}

/** Text generation with Gemini. */
export async function geminiComplete(
  system: string,
  user: string,
  opts: { json?: boolean; model?: string } = {}
): Promise<string> {
  const model = getGemini().getGenerativeModel({
    model: opts.model ?? DEFAULT_MODELS.gemini,
    systemInstruction: system,
    ...(opts.json
      ? { generationConfig: { responseMimeType: "application/json" } }
      : {}),
  });
  const res = await model.generateContent(user);
  return res.response.text();
}
