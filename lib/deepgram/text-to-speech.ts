import { deepgramHeaders, deepgramUrl } from "./client";

export async function textToSpeech(text: string) {
  const response = await fetch(deepgramUrl("/speak?model=aura-2-thalia-en"), {
    method: "POST",
    headers: deepgramHeaders("application/json"),
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error(`Deepgram speech failed: ${response.status}`);
  return response.arrayBuffer();
}
