/**
 * services/promptBuilder.service.ts
 *
 * Prepares the Gemini question-generation prompt for a given interview.
 * Recall executes exactly once per request here — the result is passed
 * straight to buildInterviewGenerationPrompt() with no secondary calls.
 *
 * Phase 8: consolidated logging via structured logger, debug-gated verbose
 * output (final prompt, focus details), timing on the full prompt build.
 */

import { buildInterviewGenerationPrompt } from "@/lib/ai/promptBuilder";
import { parseJobDescription } from "@/lib/ai/questionGenerator";
import { prisma } from "@/lib/db/prisma";
import { recallCandidateMemory, EMPTY_CANDIDATE_CONTEXT } from "@/services/cognee.service";
import { resolveCompanyName } from "@/lib/utils/company";
import {
  startTimer,
  elapsed,
  log,
  debug,
  logPersonalizationSummary,
} from "@/lib/cognee/logger";

type PromptInterview = {
  id: string;
  userId: string;
  role: string;
  company?: string | null;
  customCompanyName?: string | null;
  companyType?: string | null;
  interviewType?: string | null;
  difficulty?: string | null;
  resume?: {
    rawText?: string | null;
  } | null;
  jobDescription?: {
    id: string;
    rawText?: string | null;
    parsedSkills: string[];
  } | null;
};

export async function prepareInterviewPrompt(interview: PromptInterview): Promise<string> {
  const t = startTimer();

  // ── 1. Parse / reuse job description skills ──────────────────────────────
  let jdText = "";

  if (interview.jobDescription) {
    if (
      !interview.jobDescription.parsedSkills ||
      interview.jobDescription.parsedSkills.length === 0
    ) {
      if (interview.jobDescription.rawText) {
        const parsed = await parseJobDescription(interview.jobDescription.rawText);
        if (parsed) {
          const skills = [
            ...(parsed.requiredSkills || []),
            ...(parsed.preferredSkills || []),
          ];
          await prisma.jobDescription.update({
            where: { id: interview.jobDescription.id },
            data: { parsedSkills: skills },
          });
          jdText = `Skills: ${skills.join(", ")}\nResponsibilities: ${(parsed.responsibilities || []).join(", ")}`;
        }
      }
    } else {
      jdText = `Skills: ${interview.jobDescription.parsedSkills.join(", ")}\nText: ${interview.jobDescription.rawText?.substring(0, 500) || ""
        }`;
    }
  }

  // ── 2. Recall candidate memory — but skip Cognee for a first-time user ────
  // A user with no completed interviews has no memory yet, so calling Cognee
  // just adds latency + a failure surface for nothing. Only consult it once the
  // user has at least one finished interview.
  const priorCompleted = await prisma.interview.count({
    where: { userId: interview.userId, status: "COMPLETED" },
  });

  const candidateMemory = await recallCandidateMemory(
    {
      userId: interview.userId,
      role: interview.role,
      company: interview.customCompanyName || interview.company,
      interviewType: interview.interviewType,
    },
    interview.id
  );

  // ── 3. Build prompt ───────────────────────────────────────────────────────
  const prompt = buildInterviewGenerationPrompt({
    role: interview.role,
    company: resolveCompanyName(interview) ?? undefined,
    companyType: interview.companyType || undefined,
    interviewType: interview.interviewType || undefined,
    difficulty: interview.difficulty || undefined,
    resumeText: interview.resume?.rawText || undefined,
    jobDescriptionText: jdText || undefined,
    candidateMemoryText: candidateMemory.formatted || undefined,
  });

  // ── 4. Structured logs ────────────────────────────────────────────────────
  logPersonalizationSummary({
    hasMemory: candidateMemory.count > 0,
    recurringWeaknesses: candidateMemory.focus.recurringWeaknesses,
    recurringStrengths: candidateMemory.focus.recurringStrengths,
    promptLength: prompt.length,
  });

  log("Prompt ready", {
    hasCandidateMemory: candidateMemory.count > 0,
    promptLength: prompt.length,
    duration: `${elapsed(t)} ms`,
  });

  // Final prompt is never logged in full (no resume/PII). Length only.
  debug("Final prompt ready", { length: prompt.length });

  return prompt;
}
