import { NextRequest, NextResponse } from "next/server";
import { speakText, TTSValidationError } from "@/services/tts.service";

export async function POST(request: NextRequest) {
  if (!process.env.DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { success: false, error: "DEEPGRAM_API_KEY is not configured" },
      { status: 501 }
    );
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const upstream = await speakText({ text: body.text as string });

    // Stream the Deepgram audio directly to the client.
    // Content-Length from Deepgram is forwarded so browsers can show progress.
    const headers = new Headers({
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    if (err instanceof TTSValidationError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }
    console.error("[/api/speech/speak]", err);
    return NextResponse.json(
      { success: false, error: "Speech synthesis failed" },
      { status: 502 }
    );
  }
}
