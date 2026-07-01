import { z } from "zod";

export const jobDescriptionUploadSchema = z.object({
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Job title is required"),
  fileUrl: z.string().url("Invalid file URL").optional(),
});

export type JobDescriptionUploadInput = z.infer<typeof jobDescriptionUploadSchema>;
