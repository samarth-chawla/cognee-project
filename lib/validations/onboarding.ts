import { z } from "zod";

export const onboardingSchema = z.object({
  currentRole: z.string().min(1, "Current role is required"),
  experience: z.string().min(1, "Experience level is required"),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  targetRole: z.string().min(1, "Target role is required"),
  preferredInterviewMode: z.enum(["VOICE", "TEXT", "HYBRID"]).default("VOICE"),
  preferredDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  targetCompanies: z.array(z.string()).default([]),
  interviewTypes: z.array(z.string()).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
