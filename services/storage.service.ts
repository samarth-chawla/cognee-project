import "server-only";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { UPLOAD_DIR } from "@/lib/utils/constants";
import { logger } from "@/lib/utils/logger";

export interface UploadResult {
  fileUrl: string;
  filePath: string;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ResumeStorage {
  save(input: StoreResumeFileInput): Promise<UploadResult>;
  remove(filePath: string): Promise<void>;
}

export interface StoreResumeFileInput {
  buffer: Buffer;
  originalFileName: string;
  mimeType: string;
}

function getSafePdfFileName(originalFileName: string) {
  const baseName = path
    .basename(originalFileName, path.extname(originalFileName))
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "resume"}-${crypto.randomUUID()}.pdf`;
}

export class LocalResumeStorage implements ResumeStorage {
  async save(input: StoreResumeFileInput): Promise<UploadResult> {
    const storedFileName = getSafePdfFileName(input.originalFileName);
    const absoluteDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      UPLOAD_DIR
    );
    const absolutePath = path.join(absoluteDir, storedFileName);

    try {
      await mkdir(absoluteDir, { recursive: true });
      await writeFile(absolutePath, input.buffer);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unknown storage error";
      logger.error("Failed to store resume file", {
        path: absolutePath,
        error: message,
      });
      throw new StorageError("Failed to store uploaded file");
    }

    const fileUrl = `/uploads/${storedFileName}`;
    logger.info("Resume file stored", {
      fileUrl,
      fileSize: input.buffer.length,
      mimeType: input.mimeType,
    });

    return {
      fileUrl,
      filePath: absolutePath,
      originalFileName: input.originalFileName,
      storedFileName,
      fileSize: input.buffer.length,
      mimeType: input.mimeType,
    };
  }

  async remove(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      logger.info("Resume file removed", { filePath });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unknown storage rollback error";
      logger.error("Failed to remove resume file", { filePath, error: message });
    }
  }
}

const resumeStorage = new LocalResumeStorage();

export async function storeResumeFile(
  input: StoreResumeFileInput
): Promise<UploadResult> {
  return resumeStorage.save(input);
}

export async function removeResumeFile(filePath: string): Promise<void> {
  return resumeStorage.remove(filePath);
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}
