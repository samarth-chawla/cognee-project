import { z } from "zod";

export const profileUpdateSchema = z.object({
  experience: z.string().min(1).optional(),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  targetRole: z.string().min(1).optional(),
  preferredInterviewMode: z.enum(["VOICE", "TEXT", "HYBRID"]).optional(),
  preferredDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  targetCompanies: z.array(z.string()).optional(),
  interviewTypes: z.array(z.string()).optional(),
});

export const profileQuerySchema = z.object({
  includeAnalytics: z.coerce.boolean().optional().default(true),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
