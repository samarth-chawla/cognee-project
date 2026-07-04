"use client";

import { useCallback, useEffect, useRef } from "react";

import { AgentConnection } from "@/lib/deepgram/voice-agent/connection";
import type { AgentServerMessage } from "@/lib/deepgram/voice-agent/connection";
import { MicRecorder } from "@/lib/deepgram/voice-agent/audio/mic-recorder";
import { PcmPlayer } from "@/lib/deepgram/voice-agent/audio/pcm-player";
import {
  AGENT_INPUT_SAMPLE_RATE,
  AGENT_KEEPALIVE_MS,
  AGENT_OUTPUT_SAMPLE_RATE,
  COMPLETE_ANSWER_FUNCTION,
  SILENCE_TIMEOUT_MS,
  buildInterviewAgentSettings,
} from "@/lib/deepgram/voice-agent/settings";
import { useVoiceAgentStore } from "@/store/useVoiceAgentStore";
import { API } from "@/lib/utils/constants";
import type { VoiceQuestion } from "@/services/voiceInterview.service";

interface VoiceInterviewInput {
  id: string;
  questions: { sequence: number; ttsTranscript?: string; prompt?: string }[];
}

interface StartResult {
  ok: boolean;
  error?: string;
}

export interface UseVoiceAgentReturn {
  start: (interview: VoiceInterviewInput) => Promise<StartResult>;
  stop: () => void;
}

/**
 * Orchestrates one persistent Deepgram Voice Agent session for an interview.
 *
 * Backend stays the source of truth: after the agent signals answer-completion
 * (function call, or silence-fallback), we POST the accumulated transcript, get
 * the next Gemini question, and inject it verbatim into the SAME live session.
 * The agent never generates questions — it only conducts the conversation.
 *
 * State/turns live in `useVoiceAgentStore`; this hook owns the imperative
 * connection, audio pipeline, and turn timing via refs.
 */
export function useVoiceAgent(): UseVoiceAgentReturn {
  const store = useVoiceAgentStore;

  const connRef = useRef<AgentConnection | null>(null);
  const micRef = useRef<MicRecorder | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interview + turn bookkeeping (refs so async handlers read live values).
  const interviewIdRef = useRef<string>("");
  const questionsRef = useRef<VoiceInterviewInput["questions"]>([]);
  const currentSequenceRef = useRef<number>(0);
  const answerBufferRef = useRef<string>("");
  const advancingRef = useRef<boolean>(false);
  const agentSpeakingRef = useRef<boolean>(false);
  const finishedRef = useRef<boolean>(false);
  const turnStartRef = useRef<number>(0);
  const pendingFnIdRef = useRef<string | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearSilenceTimer();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    micRef.current?.stop();
    micRef.current = null;
    playerRef.current?.dispose();
    playerRef.current = null;
    connRef.current?.close();
    connRef.current = null;
    advancingRef.current = false;
    agentSpeakingRef.current = false;
    pendingFnIdRef.current = null;
  }, [clearSilenceTimer]);

  const stop = useCallback(() => {
    finishedRef.current = true;
    cleanup();
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  /** Speak a question verbatim by injecting it as an agent message. */
  const injectQuestion = useCallback((question: VoiceQuestion | VoiceInterviewInput["questions"][number]) => {
    const text =
      ("ttsTranscript" in question && question.ttsTranscript) ||
      ("prompt" in question && (question as { prompt?: string }).prompt) ||
      "";
    if (!text) return;
    currentSequenceRef.current = question.sequence;
    answerBufferRef.current = "";
    turnStartRef.current = Date.now();
    connRef.current?.sendInjectAgentMessage({
      type: "InjectAgentMessage",
      message: text,
      behavior: "queue",
    });
  }, []);

  /** End the interview: run existing evaluation pipeline, then flag report ready. */
  const finishInterview = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearSilenceTimer();
    store.getState().setState("EVALUATING");

    try {
      const res = await fetch(API.interviewEnd, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: interviewIdRef.current }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Evaluation failed");
      store.getState().setState("REPORT_READY");
    } catch (err) {
      store
        .getState()
        .setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      // Voice session is done regardless of evaluation outcome.
      micRef.current?.stop();
      playerRef.current?.clear();
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    }
  }, [clearSilenceTimer, store]);

  /**
   * Single funnel for answer-completion (function call OR silence fallback).
   * Guarded so the two triggers never double-advance.
   */
  const advanceTurn = useCallback(async () => {
    if (advancingRef.current || finishedRef.current) return;
    const sequence = currentSequenceRef.current;
    const transcript = answerBufferRef.current.trim();
    // Nothing to save yet (agent hasn't asked / candidate hasn't spoken).
    if (sequence <= 0) return;

    advancingRef.current = true;
    clearSilenceTimer();
    store.getState().finalizeLiveUserTurn();
    store.getState().setState("WAITING_FOR_BACKEND");

    // Ack the function call if this advance came from one.
    if (pendingFnIdRef.current) {
      connRef.current?.sendFunctionCallResponse({
        type: "FunctionCallResponse",
        id: pendingFnIdRef.current,
        name: COMPLETE_ANSWER_FUNCTION,
        content: JSON.stringify({ status: "saved" }),
      });
      pendingFnIdRef.current = null;
    }

    try {
      const durationSec = Math.max(
        0,
        Math.round((Date.now() - turnStartRef.current) / 1000)
      );
      const res = await fetch(API.interviewVoiceAnswer, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewIdRef.current,
          sequence,
          // Fall back to a placeholder so the backend Zod min(1) passes even if
          // the candidate stayed silent (silence-fallback path).
          transcript: transcript || "(no answer provided)",
          durationSec,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save answer");

      const { done, nextQuestion, index, totalQuestions } = json.data as {
        done: boolean;
        index: number;
        totalQuestions: number;
        nextQuestion: VoiceQuestion | null;
      };

      if (done || !nextQuestion) {
        connRef.current?.sendInjectAgentMessage({
          type: "InjectAgentMessage",
          message: "Thank you. That concludes the interview.",
          behavior: "queue",
        });
        store.getState().setState("FINISHED");
        store.getState().setProgress(totalQuestions, totalQuestions);
        // Give the closing line a moment to play, then evaluate.
        setTimeout(() => void finishInterview(), 3500);
      } else {
        store.getState().setProgress(index + 1, totalQuestions);
        injectQuestion(nextQuestion);
        store.getState().setState("AI_SPEAKING");
      }
    } catch (err) {
      store
        .getState()
        .setError(err instanceof Error ? err.message : "Failed to advance");
    } finally {
      advancingRef.current = false;
    }
  }, [clearSilenceTimer, finishInterview, injectQuestion, store]);

  /** Arm the silence-fallback timer (reset on any new user speech). */
  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Only fire if the agent is idle and the candidate actually said something.
      if (
        !agentSpeakingRef.current &&
        !advancingRef.current &&
        !finishedRef.current &&
        answerBufferRef.current.trim().length > 0
      ) {
        void advanceTurn();
      }
    }, SILENCE_TIMEOUT_MS);
  }, [advanceTurn, clearSilenceTimer]);

  /** Handle one JSON control frame from the agent. */
  const handleMessage = useCallback(
    (msg: AgentServerMessage) => {
      switch (msg.type) {
        case "Welcome":
          store.getState().setState("READY");
          break;

        case "SettingsApplied": {
          // Greeting plays automatically; kick off Q1 right after so the agent
          // speaks it once the welcome finishes (queued).
          store.getState().setState("GREETING");
          const first = questionsRef.current[0];
          if (first) {
            store.getState().setProgress(1, questionsRef.current.length);
            injectQuestion(first);
          }
          break;
        }

        case "ConversationText": {
          const role = msg.role === "user" ? "user" : "ai";
          const content = typeof msg.content === "string" ? msg.content : "";
          if (!content) break;
          if (role === "user") {
            answerBufferRef.current = answerBufferRef.current
              ? `${answerBufferRef.current} ${content}`
              : content;
            store.getState().setLiveUserTurn(answerBufferRef.current);
            armSilenceTimer();
          } else {
            store.getState().appendTurn("ai", content);
          }
          break;
        }

        case "UserStartedSpeaking":
          // Barge-in: stop any agent audio immediately.
          playerRef.current?.clear();
          agentSpeakingRef.current = false;
          clearSilenceTimer();
          if (!advancingRef.current && !finishedRef.current) {
            store.getState().setState("USER_LISTENING");
          }
          break;

        case "AgentThinking":
          store.getState().setState("PROCESSING");
          break;

        case "AgentStartedSpeaking":
          agentSpeakingRef.current = true;
          clearSilenceTimer();
          store.getState().setState("AI_SPEAKING");
          break;

        case "AgentAudioDone":
          agentSpeakingRef.current = false;
          if (!advancingRef.current && !finishedRef.current) {
            store.getState().setState("USER_LISTENING");
            // Candidate's turn — start watching for silence.
            armSilenceTimer();
          }
          break;

        case "FunctionCallRequest": {
          const functions = Array.isArray(msg.functions)
            ? (msg.functions as { id: string; name: string }[])
            : [];
          const call = functions.find(
            (f) => f.name === COMPLETE_ANSWER_FUNCTION
          );
          if (call) {
            pendingFnIdRef.current = call.id;
            void advanceTurn();
          }
          break;
        }

        case "Error":
          store
            .getState()
            .setError(
              typeof msg.description === "string"
                ? msg.description
                : "Voice Agent error"
            );
          break;

        default:
          break;
      }
    },
    [advanceTurn, armSilenceTimer, clearSilenceTimer, injectQuestion, store]
  );

  const start = useCallback(
    async (interview: VoiceInterviewInput): Promise<StartResult> => {
      // Reset state for a fresh session.
      store.getState().reset();
      finishedRef.current = false;
      advancingRef.current = false;
      agentSpeakingRef.current = false;
      answerBufferRef.current = "";
      currentSequenceRef.current = 0;
      pendingFnIdRef.current = null;
      interviewIdRef.current = interview.id;
      questionsRef.current = (interview.questions ?? [])
        .slice()
        .sort((a, b) => a.sequence - b.sequence);

      if (questionsRef.current.length === 0) {
        return { ok: false, error: "No questions to conduct" };
      }

      store.getState().setState("CONNECTING");

      // 1. Mint a short-lived access token.
      let token: string;
      try {
        const res = await fetch(API.interviewVoiceToken);
        const json = await res.json();
        if (!res.ok || !json.success || !json.data?.token) {
          throw new Error(json.message || "Could not obtain a Deepgram token");
        }
        token = json.data.token;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Token request failed";
        store.getState().setError(message);
        return { ok: false, error: message };
      }

      // 2. Prepare playback + open the agent socket.
      const player = new PcmPlayer(AGENT_OUTPUT_SAMPLE_RATE);
      playerRef.current = player;

      const conn = new AgentConnection({
        onMessage: handleMessage,
        onAudio: (chunk) => player.enqueue(chunk),
        onClose: () => {
          // Unexpected close mid-interview surfaces as a lost connection; a
          // close after finish/stop is expected and ignored.
          if (!finishedRef.current && store.getState().state !== "REPORT_READY") {
            store.getState().setError("Voice connection closed");
          }
        },
        onError: () => {
          if (!finishedRef.current) {
            store.getState().setError("Voice connection lost");
          }
        },
      });
      connRef.current = conn;

      try {
        await conn.connect(token);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Connection failed";
        store.getState().setError(message);
        cleanup();
        return { ok: false, error: message };
      }

      // 3. Settings must be the first frame after open.
      conn.sendSettings(buildInterviewAgentSettings());

      // 4. Keepalive to preserve the long session.
      keepAliveRef.current = setInterval(() => {
        conn.sendKeepAlive();
      }, AGENT_KEEPALIVE_MS);

      // 5. Start streaming the mic.
      try {
        const mic = new MicRecorder({
          targetSampleRate: AGENT_INPUT_SAMPLE_RATE,
          onChunk: (chunk) => conn.sendMedia(chunk),
        });
        micRef.current = mic;
        await mic.start();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        const message =
          name === "NotAllowedError" || name === "SecurityError"
            ? "Microphone permission denied"
            : name === "NotFoundError"
              ? "No microphone found"
              : "Could not access the microphone";
        store.getState().setError(message);
        cleanup();
        return { ok: false, error: message };
      }

      return { ok: true };
    },
    [cleanup, handleMessage, store]
  );

  return { start, stop };
}
