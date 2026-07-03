import { prisma } from "@/lib/db/prisma";
import { prepareInterviewPrompt } from "./promptBuilder.service";
import { generateInterviewQuestions } from "@/lib/ai/questionGenerator";

export async function processInterviewGeneration(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      user: {
        include: { profile: true },
      },
      resume: true,
      jobDescription: true,
    },
  });

  if (!interview) {
    throw new Error("Interview not found");
  }

  if (interview.status !== "GENERATING") {
    throw new Error("Interview is not in GENERATING status");
  }

  try {
    const prompt = await prepareInterviewPrompt(interview);
    const questionsData = await generateInterviewQuestions(prompt);

    if (!questionsData || questionsData.length === 0) {
      throw new Error("AI returned no questions");
    }

    const mappedQuestions = questionsData.map((q: any, index: number) => {
      // Map string difficulty to enum, default to MEDIUM
      let diff = "MEDIUM";
      if (q.difficulty) {
        const d = q.difficulty.toUpperCase();
        if (["EASY", "MEDIUM", "HARD"].includes(d)) {
          diff = d;
        }
      }

      return {
        sequence: index + 1,
        category: q.category || "General",
        difficulty: diff,
        displayQuestion: q.displayQuestion || "",
        ttsTranscript: q.ttsTranscript || "",
        expectedDiscussion: q.expectedDiscussion || null,
        interviewId,
      };
    });

    await prisma.$transaction([
      // Delete any existing questions just in case it's a retry
      prisma.question.deleteMany({ where: { interviewId } }),
      
      // Insert new questions
      prisma.question.createMany({ data: mappedQuestions }),
      
      // Update interview status
      prisma.interview.update({
        where: { id: interviewId },
        data: { status: "READY" },
      }),
    ]);

    // Fetch the first question to return with its ID
    const firstQuestion = await prisma.question.findFirst({
      where: { interviewId, sequence: 1 },
    });

    return {
      interviewId,
      totalQuestions: mappedQuestions.length,
      currentQuestion: firstQuestion,
    };
  } catch (error) {
    console.error("Error generating interview questions:", error);
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
