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
 * Turn-taking is driven ENTIRELY by the client (this app), never by the agent
 * LLM. When the candidate stops talking we wait through a TWO-STAGE grace period
 * so a mid-answer thinking pause can never cut them off:
 *
 *   Stage 1 (SILENCE_STAGE1_MS): they just paused — most likely still thinking.
 *                                Hold and keep listening.
 *   Stage 2 (SILENCE_STAGE2_MS): still nothing — give one final beat, then move
 *                                on to the next question.
 *
 * ANY new speech during either stage resets the whole window from the start, so
 * an in-progress answer is never interrupted. Total ≈ 7.5s of real silence
 * before advancing — matching how a human interviewer waits for you to finish.
 */
export const SILENCE_STAGE1_MS = 4000;
export const SILENCE_STAGE2_MS = 3500;

/**
 * Fast path: when the candidate explicitly signals they are finished ("next
 * question", "that's my answer", "I'm done"), we only wait this short beat — just
 * long enough to be sure they are not mid-sentence — then advance.
 */
export const EXPLICIT_DONE_MS = 1500;

/**
 * How long we wait, after asking a question, for the candidate to START
 * answering before gently re-asking. Generous on purpose — a real interviewer
 * gives you time to gather your thoughts before repeating themselves.
 */
export const AWAIT_ANSWER_MS = 12000;

/**
 * After the single re-ask, how long we wait for any answer before moving on to
 * the next question. Keeps a stalled interview flowing.
 */
export const REASK_GRACE_MS = 10000;

/** How many times we re-ask an unanswered question before moving on. */
export const MAX_AUTO_REASKS = 1;

/** Name of the client-side function the agent calls to signal answer completion. */
export const COMPLETE_ANSWER_FUNCTION = "complete_answer";

const INTERVIEWER_PROMPT = `You are the SILENT voice engine behind a scripted job interview named Aria. A backend system runs the entire interview — you do NOT run it. Everything the candidate hears (the greeting, every question, every repeat, the closing) is delivered to them directly by the backend. You are invisible to the candidate.

YOUR ONLY JOB:
Listen to the candidate. When they have clearly finished answering the current question and have stopped speaking, call the ${COMPLETE_ANSWER_FUNCTION} function. That is the ONLY thing you ever do.

ABSOLUTE RULES — breaking ANY of these is a critical failure:
1. NEVER speak. Produce no words of your own — ever. No questions, no greetings, no comments, no acknowledgements ("great", "thank you", "okay"), no apologies, no fillers, no clarifications, no follow-ups, no summaries.
2. NEVER create, ask, rephrase, or repeat a question. You do not decide what is asked — the backend does. If a question needs repeating, the backend repeats it, not you.
3. NEVER probe deeper, ask "can you elaborate", or continue a topic after the candidate answers.
4. NEVER decide what comes next, skip ahead, or end the interview.
5. If the candidate asks you to repeat, slow down, or clarify — do NOTHING. Do not speak and do not call the function. The backend detects this and repeats the question itself.

WHEN TO CALL ${COMPLETE_ANSWER_FUNCTION}:
- Only when the candidate has clearly finished a substantive answer AND has stopped talking.
- NEVER during a pause or while they are still thinking or speaking. A brief silence is NOT the end of an answer.
- Calling it is only a hint to the backend; the backend decides the actual timing. When unsure, do nothing and keep listening.
- Do not produce any speech before or after calling it. Just call it, then stay silent.

If you are ever unsure what to do: do NOTHING and stay silent. The candidate must only ever hear the backend's messages — never you.`;

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
      "Call this ONLY when the candidate has clearly finished a substantive answer to the current question and has stopped speaking. It is a silent signal to the backend — never produce any speech before or after calling it. Do NOT call it during pauses, thinking silences, or repeat/clarification requests.",
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
    greeting = "Hi there, I'm Aria, and I'll be your interviewer today. It's really nice to meet you. I'll ask you a few questions, one at a time. There's no rush at all, so take your time and just answer naturally, the way you would in a real conversation. If you ever want a question repeated, simply ask. Let's get started.",
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
