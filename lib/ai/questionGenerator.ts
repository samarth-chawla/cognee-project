import { geminiCompleteWithUsage, geminiComplete } from "./gemini";
import { extractJSON } from "./index";
import { GENERATE_QUESTIONS_SYSTEM_PROMPT, JD_PARSER_SYSTEM_PROMPT } from "./prompts/interview";
import {
  markQuestionGenerationStart,
  markQuestionGenerationSuccess,
  markQuestionGenerationFailed,
  classifyFailureReason,
} from "@/services/pipelineUsage.service";
import { sanitizeError } from "@/lib/ai/pricing";

/**
 * Generate interview questions via Gemini with pipeline usage tracking.
 *
 * @param userPrompt - The assembled interview prompt
 * @param interviewId - Optional: when provided, pipeline usage is tracked.
 *   Omit for calls that don't originate from a full interview pipeline (e.g. tests).
 */
export async function generateInterviewQuestions(
  userPrompt: string,
  interviewId?: string,
) {
  const startedAt = Date.now();

  if (interviewId) {
    await markQuestionGenerationStart(interviewId);
  }

  try {
    const result = await geminiCompleteWithUsage(
      GENERATE_QUESTIONS_SYSTEM_PROMPT,
      userPrompt,
      { json: true },
    );

    let questions: unknown[];
    try {
      const json = extractJSON<{ questions?: unknown[] }>(result.text);
      questions = json.questions || [];
    } catch (err) {
      console.error("Failed to parse Gemini output:", err);
      console.error("Raw Gemini output was:\n", result.text);
      throw new Error("Failed to generate questions. AI returned invalid format.");
    }

    if (interviewId) {
      await markQuestionGenerationSuccess(
        interviewId,
        {
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.totalTokens,
        },
        Date.now() - startedAt,
      );
    }

    return questions;
  } catch (err) {
    if (interviewId) {
      await markQuestionGenerationFailed(
        interviewId,
        Date.now() - startedAt,
        classifyFailureReason(err),
        sanitizeError(err),
      );
    }
    throw err;
  }
}

export async function parseJobDescription(rawText: string) {
  const resultText = await geminiComplete(
    JD_PARSER_SYSTEM_PROMPT,
    rawText,
    { json: true },
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractJSON<any>(resultText);
  } catch (err) {
    console.error("Failed to parse Gemini output for JD:", err);
    return null;
  }
}
