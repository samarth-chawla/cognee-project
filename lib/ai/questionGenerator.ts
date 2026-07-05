import { geminiComplete } from "./gemini";
import { extractJSON } from "./index";
import { GENERATE_QUESTIONS_SYSTEM_PROMPT, JD_PARSER_SYSTEM_PROMPT } from "./prompts/interview";

export async function generateInterviewQuestions(userPrompt: string) {
  const resultText = await geminiComplete(
    GENERATE_QUESTIONS_SYSTEM_PROMPT,
    userPrompt,
    { json: true }
  );

  try {
    const json = extractJSON<{ questions?: unknown[] }>(resultText);
    return json.questions || [];
  } catch (err) {
    console.error("Failed to parse Gemini output:", err);
    console.error("Raw Gemini output was:\n", resultText);
    throw new Error("Failed to generate questions. AI returned invalid format.");
  }
}

export async function parseJobDescription(rawText: string) {
  const resultText = await geminiComplete(
    JD_PARSER_SYSTEM_PROMPT,
    rawText,
    { json: true }
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractJSON<any>(resultText);
  } catch (err) {
    console.error("Failed to parse Gemini output for JD:", err);
    return null;
  }
}
