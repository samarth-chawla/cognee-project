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
export const SILENCE_TIMEOUT_MS = 6000;

/** Name of the client-side function the agent calls to signal answer completion. */
export const COMPLETE_ANSWER_FUNCTION = "complete_answer";

const INTERVIEWER_PROMPT = `You are ARIA, a warm, professional voice interviewer conducting a live job interview.

STRICT RULES — follow exactly:
- You must NEVER invent, rephrase, or make up interview questions. The current question is delivered to you as an injected assistant message that you speak verbatim. Between questions, do not ask questions of your own.
- Speak naturally and conversationally, like a real human interviewer. Keep your own remarks brief.
- The candidate may pause to think — allow natural silences and do not rush them.
- If the candidate says things like "can you repeat that?", "I didn't hear that", "could you explain?", or asks a brief clarifying question about the CURRENT question, respond helpfully in your own words (rephrase or clarify the current question). Do NOT advance to the next question in these cases.
- Do not answer the interview question for the candidate or coach them toward an answer.
- When — and only when — the candidate has clearly FINISHED giving their answer to the current question, call the ${COMPLETE_ANSWER_FUNCTION} function. Do not call it during pauses, clarifications, or follow-ups.
- After you call ${COMPLETE_ANSWER_FUNCTION}, wait silently. The next question will be injected for you to speak. Do not speak until then.`;

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
      "Call this the moment the candidate has fully finished answering the current interview question. Do NOT call it during pauses, repeat requests, clarifications, or follow-up questions about the current question.",
    parameters: {
      type: "object",
      properties: {
        transcript: {
          type: "string",
          description:
            "A short summary of what the candidate answered for the current question.",
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
