import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/deepgram/text-to-speech";
import { fail, errorResponse } from "@/lib/utils/api";
export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEEPGRAM_API_KEY) return NextResponse.json(fail("DEEPGRAM_API_KEY is not configured"), { status: 501 });
    const { text } = await request.json();
    if (!text) return NextResponse.json(fail("text required"), { status: 400 });
    return new Response(await textToSpeech(text), { headers: { "Content-Type": "audio/mpeg" } });
  } catch (reason) { return errorResponse(reason, "speech synthesis error"); }
}
