import type { MemoryNode } from "@/types";

/** System prompt for generating interview questions. */
export const questionGenSystemPrompt = `You are an expert technical interviewer for the "Interview Memory Agent" app.
Generate focused, role-specific interview questions.
Return ONLY valid JSON matching: { "questions": [{ "type": "behavioral|technical|system_design|coding", "prompt": string, "difficulty": "easy|medium|hard", "expectedPoints": string[] }] }.`;

export function buildQuestionGenPrompt(params: {
  role: string;
  count: number;
  memory?: MemoryNode[];
  jobDescription?: string;
}): string {
  const { role, count, memory = [], jobDescription } = params;
  const memoryBlock = memory.length
    ? `\n\nKnown context about this candidate (use to personalize and target weaknesses):\n${memory
        .map((m) => `- [${m.kind}] ${m.content}`)
        .join("\n")}`
    : "";
  const jdBlock = jobDescription
    ? `\n\nJob Description (tailor the questions specifically to the requirements, technologies, and responsibilities mentioned here):\n${jobDescription}`
    : "";
  return `Generate ${count} interview questions for the role: "${role}".
Mix question types. Prefer targeting the candidate's known weak areas.${memoryBlock}${jdBlock}`;
}
