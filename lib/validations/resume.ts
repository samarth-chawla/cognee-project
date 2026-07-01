import { z } from "zod";

export const resumeUploadSchema = z.object({
  fileUrl: z.string().url("Invalid file URL"),
});

export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
