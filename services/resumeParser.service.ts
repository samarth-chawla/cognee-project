import "server-only";

import pdf from "pdf-parse";
import { logger } from "@/lib/utils/logger";

export interface ResumeParseResult {
  rawText: string;
  pageCount: number;
  charactersExtracted: number;
}

export function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function parseResumePdf(
  buffer: Buffer,
): Promise<ResumeParseResult> {
  try {
    const result = await pdf(buffer);
    const rawText = cleanExtractedText(result.text);

    if (!rawText) {
      throw new ResumeParseError(
        "The uploaded PDF contains no extractable text"
      );
    }

    const parsed: ResumeParseResult = {
      rawText,
      pageCount: result.numpages,
      charactersExtracted: rawText.length,
    };

    return parsed;
  } catch (error) {
    if (error instanceof ResumeParseError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown PDF error";

    if (/password|encrypted/i.test(message)) {
      throw new ResumeParseError("Password-protected PDFs are not supported");
    }

    if (/invalid|corrupt|format/i.test(message)) {
      throw new ResumeParseError("The uploaded PDF is invalid or corrupted");
    }

    logger.error("Resume PDF parse failed", { error: message });
    throw new ResumeParseError("Unable to extract text from the uploaded PDF");
  }
}


export class ResumeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeParseError";
  }
}
