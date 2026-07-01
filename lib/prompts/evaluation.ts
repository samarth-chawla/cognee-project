import type { Answer, Question } from "@/types";

export const evaluationSystemPrompt = `You are a rigorous but fair interview evaluator.
Score answers and produce structured feedback.
Return ONLY valid JSON matching:
{ "overallScore": number(0-100), "summary": string, "strengths": string[], "weaknesses": string[],
  "criteria": [{ "name": string, "score": number(0-10), "feedback": string }] }.`;

export function buildEvaluationPrompt(params: {
  role: string;
  qa: { question: Question; answer?: Answer }[];
}): string {
  const { role, qa } = params;
  const body = qa
    .map(
      (pair, i) =>
        `Q${i + 1} (${pair.question.type}): ${pair.question.prompt}\nAnswer: ${
          pair.answer?.text ?? "(no answer)"
        }`
    )
    .join("\n\n");
  return `Evaluate this interview for the role "${role}".\n\n${body}`;
}
