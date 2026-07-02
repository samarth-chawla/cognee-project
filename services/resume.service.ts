import "server-only";

import { prisma } from "@/lib/db";
import { MAX_FILE_SIZE } from "@/lib/utils/constants";
import { logger } from "@/lib/utils/logger";
import { parseResumePdf, ResumeParseError } from "@/services/resumeParser.service";
import {
  removeResumeFile,
  storeResumeFile,
  StorageError,
} from "@/services/storage.service";

export interface CreateResumeInput {
  userId: string;
  fileUrl: string;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
  pageCount: number;
  rawText: string;
}

export interface UploadResumeInput {
  userId: string;
  file: File;
}

export interface UploadResumeResult {
  resumeId: string;
  fileUrl: string;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
  pageCount: number;
  charactersExtracted: number;
}

export async function createResume(input: CreateResumeInput) {
  try {
    const resume = await prisma.resume.create({
      data: {
        userId: input.userId,
        fileUrl: input.fileUrl,
        originalFileName: input.originalFileName,
        storedFileName: input.storedFileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        pageCount: input.pageCount,
        rawText: input.rawText,
      },
    });
    logger.info("Resume record created", {
      id: resume.id,
      userId: input.userId,
      pageCount: input.pageCount,
      fileSize: input.fileSize,
    });
    return resume;
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Unknown database error";
    logger.error("Failed to create resume record", {
      userId: input.userId,
      error: message,
    });
    throw new ResumeDbError("Failed to save resume to database");
  }
}

export async function upsertResume(input: CreateResumeInput) {
  try {
    const existing = await prisma.resume.findFirst({
      where: { userId: input.userId },
      orderBy: { uploadedAt: "desc" },
      select: { id: true },
    });

    if (!existing) {
      return createResume(input);
    }

    const resume = await prisma.resume.update({
      where: { id: existing.id },
      data: {
        fileUrl: input.fileUrl,
        originalFileName: input.originalFileName,
        storedFileName: input.storedFileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        pageCount: input.pageCount,
        rawText: input.rawText,
        uploadedAt: new Date(),
      },
    });
    logger.info("Resume record updated", {
      id: resume.id,
      userId: input.userId,
      pageCount: input.pageCount,
      fileSize: input.fileSize,
    });
    return resume;
  } catch (cause) {
    if (cause instanceof ResumeDbError) {
      throw cause;
    }
    const message =
      cause instanceof Error ? cause.message : "Unknown database error";
    logger.error("Failed to upsert resume record", {
      userId: input.userId,
      error: message,
    });
    throw new ResumeDbError("Failed to save resume to database");
  }
}

export async function uploadResume(
  input: UploadResumeInput
): Promise<UploadResumeResult> {
  validateResumeFile(input.file);

  const buffer = Buffer.from(await input.file.arrayBuffer());

  if (buffer.length === 0) {
    throw new ResumeValidationError("The uploaded file is empty");
  }

  const parsed = await parseResumePdf(buffer);
  const storedFile = await storeResumeFile({
    buffer,
    originalFileName: input.file.name,
    mimeType: input.file.type,
  });

  try {
    const resume = await upsertResume({
      userId: input.userId,
      fileUrl: storedFile.fileUrl,
      originalFileName: storedFile.originalFileName,
      storedFileName: storedFile.storedFileName,
      fileSize: storedFile.fileSize,
      mimeType: storedFile.mimeType,
      pageCount: parsed.pageCount,
      rawText: parsed.rawText,
    });

    return {
      resumeId: resume.id,
      fileUrl: resume.fileUrl,
      originalFileName: resume.originalFileName,
      storedFileName: resume.storedFileName,
      fileSize: resume.fileSize,
      mimeType: resume.mimeType,
      pageCount: resume.pageCount,
      charactersExtracted: parsed.charactersExtracted,
    };
  } catch (error) {
    await removeResumeFile(storedFile.filePath);
    throw error;
  }
}

function validateResumeFile(file: File) {
  if (file.type !== "application/pdf") {
    throw new ResumeValidationError("Only PDF files are accepted");
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new ResumeValidationError("Only PDF files are accepted");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ResumeValidationError(
      "File exceeds the maximum allowed size of 10 MB"
    );
  }
}

export async function getLatestResume(userId: string) {
  return prisma.resume.findFirst({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });
}

export class ResumeDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeDbError";
  }
}

export class ResumeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeValidationError";
  }
}

export { ResumeParseError, StorageError };
