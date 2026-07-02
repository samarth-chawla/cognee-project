import { z } from "zod";
import { MAX_FILE_SIZE } from "@/lib/utils/constants";

export const resumeUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Resume file is required" })
    .refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are accepted",
    })
    .refine((file) => file.name.toLowerCase().endsWith(".pdf"), {
      message: "Only PDF files are accepted",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File exceeds the maximum allowed size of 10 MB",
    }),
});

export const resumeFileSchema = resumeUploadSchema;

export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
