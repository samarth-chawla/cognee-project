import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/utils";
import { getOpenAI } from "@/lib/ai/openai";
import type { TranscriptChunk } from "@/types";

/**
 * POST /api/speech
 * multipart/form-data with field "audio" (Blob) -> transcription.
 * Uses OpenAI Whisper when OPENAI_API_KEY is set; otherwise returns a stub.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(fail("audio file required"), { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      const stub: TranscriptChunk = {
        text: "[stub transcript — set OPENAI_API_KEY to enable Whisper]",
        isFinal: true,
      };
      return NextResponse.json(ok(stub));
    }

    const res = await getOpenAI().audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
    });

    const chunk: TranscriptChunk = { text: res.text, isFinal: true };
    return NextResponse.json(ok(chunk));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "speech error"),
      { status: 500 }
    );
  }
}
