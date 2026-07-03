import { buildInterviewGenerationPrompt } from "@/lib/ai/promptBuilder";
import { parseJobDescription } from "@/lib/ai/questionGenerator";
import { prisma } from "@/lib/db/prisma";

export async function prepareInterviewPrompt(interview: any) {
  let jdText = "";
  
  if (interview.jobDescription) {
    // Check if it's already parsed
    if (!interview.jobDescription.parsedSkills || interview.jobDescription.parsedSkills.length === 0) {
      if (interview.jobDescription.rawText) {
        const parsed = await parseJobDescription(interview.jobDescription.rawText);
        if (parsed) {
          const skills = [...(parsed.requiredSkills || []), ...(parsed.preferredSkills || [])];
          await prisma.jobDescription.update({
            where: { id: interview.jobDescription.id },
            data: { parsedSkills: skills },
          });
          jdText = `Skills: ${skills.join(", ")}\nResponsibilities: ${(parsed.responsibilities || []).join(", ")}`;
        }
      }
    } else {
      jdText = `Skills: ${interview.jobDescription.parsedSkills.join(", ")}\nText: ${interview.jobDescription.rawText?.substring(0, 500) || ""}`;
    }
  }

  const prompt = buildInterviewGenerationPrompt({
    role: interview.role,
    companyType: interview.companyType || undefined,
    interviewType: interview.interviewType || undefined,
    difficulty: interview.difficulty || undefined,
    resumeText: interview.resume?.rawText || undefined,
    jobDescriptionText: jdText || undefined,
  });

  return prompt;
}
