export const evaluationSystemPrompt = `You are a rigorous but fair technical interview evaluator.
Evaluate the candidate's answers and return ONLY valid JSON with exactly this structure (no extra keys, no markdown):
{
  "overallScore": <0-100>,
  "technicalScore": <0-100>,
  "communicationScore": <0-100>,
  "confidenceScore": <0-100>,
  "behavioralScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missingTopics": ["..."],
  "recommendations": ["..."],
  "questionFeedback": [
    { "sequence": 1, "question": "...", "feedback": "...", "score": <0-10> }
  ]
}`;

export function buildEvaluationPrompt(params: {
  role: string;
  qa: {
    question: {
      sequence: number;
      category: string;
      displayQuestion: string;
      ttsTranscript?: string;
      expectedDiscussion?: string | null;
      difficulty?: string;
    };
    answer?: {
      sequence: number;
      transcript: string;
      duration: number;
      confidence?: number | null;
    };
  }[];
}): string {
  const { role, qa } = params;
  const body = qa
    .map(
      (pair) =>
        `Q${pair.question.sequence} [${pair.question.category}] (${pair.question.difficulty ?? "medium"}): ${pair.question.displayQuestion}\n` +
        `Candidate Answer: ${pair.answer?.transcript ?? "(no answer given)"}`
    )
    .join("\n\n");
  return `Evaluate this interview for the role "${role}".\n\nQuestions and Answers:\n\n${body}`;
}
