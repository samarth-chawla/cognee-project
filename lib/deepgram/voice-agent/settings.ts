import type { Deepgram } from "@deepgram/sdk";

/**
 * Voice Agent configuration for the interview conductor.
 *
 * The agent NEVER generates questions — Gemini already produced them and the
 * backend injects each one verbatim via `InjectAgentMessage`. The agent only
 * conducts the conversation: it speaks the injected question, listens, handles
 * repeat/clarify requests naturally, and calls the `complete_answer` function
 * when the candidate has finished. A client-side silence timer is the fallback
 * (see SILENCE_TIMEOUT_MS) if the LLM stalls.
 *
 * Client-safe: no `server-only` import here — this builds the JSON settings the
 * browser sends over the agent WebSocket.
 */

/** Mic capture format (sent to the agent). */
export const AGENT_INPUT_SAMPLE_RATE = 16000;
/** Agent TTS output format (played back in the browser). */
export const AGENT_OUTPUT_SAMPLE_RATE = 24000;
/** KeepAlive cadence — the skill example pings every 5s to preserve the session. */
export const AGENT_KEEPALIVE_MS = 5000;
/**
 * Silence fallback: if no new user speech arrives for this long after the
 * candidate stops (and the agent is idle with a non-empty answer buffer), the
 * client force-advances. Rescues a stalled LLM that forgot to call
 * `complete_answer`. Kept in the 5–8s band the product spec asked for.
 */
export const SILENCE_TIMEOUT_MS = 3500;

/** Name of the client-side function the agent calls to signal answer completion. */
export const COMPLETE_ANSWER_FUNCTION = "complete_answer";

const INTERVIEWER_PROMPT = `You are ARIA, a professional voice interviewer. You are conducting a structured job interview. The backend system controls the interview — you do NOT control it.

YOUR ROLE:
You are a conversational interface ONLY. You speak the questions provided to you and listen to the candidate's answers. You do NOT decide what questions to ask. The backend decides.

ABSOLUTE RULES — violating ANY of these is a critical failure:

1. NEVER generate your own interview questions. Not ever. Not even one.
2. NEVER ask follow-up technical questions after the candidate answers.
3. NEVER probe deeper into a topic the candidate just discussed.
4. NEVER say things like "Can you elaborate?", "Tell me more about that", "How would you handle...", "What about...", or "Let's explore that further."
5. NEVER continue discussing the previous question after the candidate has answered it.
6. NEVER decide what question comes next. The backend decides.
7. NEVER skip questions or change the interview order.
8. NEVER end the interview yourself. NEVER say "That concludes the interview" or anything similar. The backend will inject the closing message when the interview is completely finished.
9. NEVER say conversational filler like "Please wait while I get the next question" or "Moving on to the next question".

HOW THE INTERVIEW WORKS:
- Interview questions are delivered to you as injected assistant messages. When you receive one, speak it to the candidate naturally.
- After the candidate finishes answering, call the ${COMPLETE_ANSWER_FUNCTION} function. That is your ONLY job after hearing the answer.
- After calling ${COMPLETE_ANSWER_FUNCTION}, you MUST go completely silent. Say NOTHING. Do not comment on the answer. Do not say "Great answer" or "Thank you." Do not ask any follow-up. Just stop talking entirely and wait.
- The backend will then inject the next question for you to speak. Wait for it.

HANDLING CLARIFICATION REQUESTS (do NOT call ${COMPLETE_ANSWER_FUNCTION} for these):
- If the candidate says "repeat the question", "can you repeat that?", "I didn't hear that", "what do you mean?", or "could you explain?" — rephrase or repeat the CURRENT question in your own words. This is NOT an answer. Do NOT call ${COMPLETE_ANSWER_FUNCTION}.
- After clarifying, wait for the candidate to actually answer the question.

WHEN TO CALL ${COMPLETE_ANSWER_FUNCTION}:
- Call it IMMEDIATELY when the candidate has clearly finished giving their substantive answer to the current interview question.
- Call it IMMEDIATELY if the candidate says "Next question" or explicitly asks to move on.
- Do NOT generate any speech before calling it. Do not say "Please wait". Just call the function.
- Do NOT call it during pauses, thinking silences, or clarification requests.

AFTER CALLING ${COMPLETE_ANSWER_FUNCTION}:
- Say absolutely nothing.
- Do not generate any text or speech.
- Wait in complete silence for the next injected question from the backend.`;

/**
 * The single client-side function the agent uses to signal completion. It has no
 * `endpoint`, so Deepgram returns a `FunctionCallRequest` to the browser rather
 * than calling a server. The authoritative transcript is the client's own
 * accumulated STT buffer; the `transcript` arg is best-effort context.
 */
function completeAnswerFunction(): NonNullable<
  Deepgram.ThinkSettingsV1["functions"]
>[number] {
  return {
    name: COMPLETE_ANSWER_FUNCTION,
    description:
      "CRITICAL: Call this function IMMEDIATELY when the candidate has finished answering the current interview question or says 'Next question'. Do NOT generate any speech like 'Please wait' or 'Moving on'. Call the function as your ONLY response. After calling this, you MUST go completely silent — say nothing, generate no text, ask no follow-ups.",
    parameters: {
      type: "object",
      properties: {
        transcript: {
          type: "string",
          description:
            "A brief summary of the candidate's answer.",
        },
      },
      required: [],
    },
  };
}

export interface BuildAgentSettingsOptions {
  /** Spoken welcome line before the first question is injected. */
  greeting?: string;
  /** Deepgram Aura TTS voice model. */
  speakModel?: string;
  /** Deepgram STT model. */
  listenModel?: string;
  /** Think LLM model (Deepgram-hosted open_ai). */
  thinkModel?: string;
}

/**
 * Build the `Settings` control message sent immediately after the socket opens.
 * Input/output audio formats must match the mic recorder and PCM player.
 */
export function buildInterviewAgentSettings(
  options: BuildAgentSettingsOptions = {}
): Deepgram.agent.AgentV1Settings {
  const {
    greeting = "Welcome to your interview. I'll ask you a series of questions. Take your time, and answer naturally. Let's begin.",
    speakModel = "aura-2-thalia-en",
    listenModel = "nova-3",
    thinkModel = "gpt-4o-mini",
  } = options;

  return {
    type: "Settings",
    audio: {
      input: {
        encoding: "linear16",
        sample_rate: AGENT_INPUT_SAMPLE_RATE,
      },
      output: {
        encoding: "linear16",
        sample_rate: AGENT_OUTPUT_SAMPLE_RATE,
        container: "none",
      },
    },
    agent: {
      language: "en",
      listen: {
        provider: { type: "deepgram", version: "v1", model: listenModel },
      },
      think: {
        provider: { type: "open_ai", model: thinkModel },
        prompt: INTERVIEWER_PROMPT,
        functions: [completeAnswerFunction()],
      },
      speak: {
        provider: { type: "deepgram", model: speakModel },
      },
      greeting,
    },
  };
}
