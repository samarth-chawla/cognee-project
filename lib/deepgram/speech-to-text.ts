import { deepgramHeaders, deepgramUrl } from "./client";

export async function speechToText(audio: File) {
  const response = await fetch(deepgramUrl("/listen?model=nova-3&smart_format=true"), {
    method: "POST",
    headers: deepgramHeaders(audio.type || "application/octet-stream"),
    body: audio,
  });
  if (!response.ok) throw new Error(`Deepgram transcription failed: ${response.status}`);
  const payload = await response.json();
  const text = payload.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  return { text, isFinal: true };
}
