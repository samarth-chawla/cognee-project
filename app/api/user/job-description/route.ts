import { NextRequest } from "next/server";

import { requireUserId, AuthError } from "@/services/auth.service";
import { saveJobDescription } from "@/services/jobDescription.service";
import { jobDescriptionUploadSchema } from "@/lib/validations/job-description";
import { success, failure, unauthorized, handleZodError } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const clerkId = await requireUserId();

    const body = await request.json();
    const parsed = jobDescriptionUploadSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const jobDescription = await saveJobDescription(clerkId, parsed.data);

    // TODO: JD parsing with Gemini

    return success({ jobDescription });
  } catch (reason) {
    if (reason instanceof AuthError) {
      return unauthorized();
    }
    const message = reason instanceof Error ? reason.message : "Job description upload failed";
    return failure(message, 500);
  }
}
