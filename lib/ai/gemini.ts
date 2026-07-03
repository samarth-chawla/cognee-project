import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_MODELS } from "@/lib/utils/constants";

let client: GoogleGenerativeAI | null = null;

const GEMINI_FALLBACK_MODELS = [
  DEFAULT_MODELS.gemini,
  "gemini-2.5-flash",
  "gemini-flash-latest",
] as const;

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  "gemini-1.5-flash-latest": DEFAULT_MODELS.gemini,
  "gemini-1.5-flash": DEFAULT_MODELS.gemini,
};

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
  const requestedModel = normalizeGeminiModel(
    opts.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODELS.gemini
  );
  const modelsToTry = [
    requestedModel,
    ...GEMINI_FALLBACK_MODELS.filter((model) => model !== requestedModel),
  ];

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    try {
      const model = getGemini().getGenerativeModel({
        model: modelName,
        systemInstruction: system,
        ...(opts.json
          ? { generationConfig: { responseMimeType: "application/json" } }
          : {}),
      });
      const res = await model.generateContent(user);
      return res.response.text();
    } catch (error) {
      lastError = error;

      if (!isGeminiModelNotFoundError(error)) {
        throw error;
      }

      console.warn("Gemini model unavailable; trying fallback", {
        model: modelName,
      });
    }
  }

  throw lastError;
}

function normalizeGeminiModel(model: string) {
  return GEMINI_MODEL_ALIASES[model] ?? model;
}

function isGeminiModelNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = "status" in error ? error.status : undefined;
  return status === 404 || /404|not found/i.test(error.message);
}
