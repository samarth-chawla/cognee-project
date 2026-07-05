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
  AWAIT_ANSWER_MS,
  COMPLETE_ANSWER_FUNCTION,
  EXPLICIT_DONE_MS,
  MAX_AUTO_REASKS,
  REASK_GRACE_MS,
  SILENCE_STAGE1_MS,
  SILENCE_STAGE2_MS,
  buildInterviewAgentSettings,
} from "@/lib/deepgram/voice-agent/settings";
import { useVoiceAgentStore } from "@/store/useVoiceAgentStore";
import { API } from "@/lib/utils/constants";
import type { VoiceQuestion } from "@/services/voiceInterview.service";

// ──────────────────────────────────────────────────────────────────────────────
// Logging helper — all voice agent logs go through this for easy filtering.
// Open DevTools console and filter on [VoiceAgent] to trace the flow.
// ──────────────────────────────────────────────────────────────────────────────
const LOG_PREFIX = "[VoiceAgent]";
function log(...args: unknown[]) {
  console.log(LOG_PREFIX, ...args);
}
function warn(...args: unknown[]) {
  console.warn(LOG_PREFIX, ...args);
}

/** Normalize an utterance for phrase matching (strip punctuation, collapse ws). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True for short, near-standalone requests to repeat or clarify the question
 * ("can you repeat that?", "what do you mean?"). These must NOT be treated as an
 * answer or trigger an advance — the agent rephrases and we keep waiting. Kept
 * strict (short utterance + explicit ask) so a long answer that merely contains
 * a word like "explain" is never misclassified as a clarification.
 */
function isClarificationRequest(text: string): boolean {
  const t = normalize(text);
  if (!t || t.split(" ").length > 9) return false;
  return /(repeat|rephrase|say that again|say again|come again|didnt (hear|catch|get)|can you explain|could you explain|what do you mean|not sure what you mean|pardon|clarify)/.test(
    t
  );
}

/**
 * True for short, explicit "I'm finished / move on" signals. Only used to
 * SHORTEN the grace window — we still wait a brief confirming beat before
 * advancing, so a false positive can never cut someone off instantly.
 */
function isExplicitDone(text: string): boolean {
  const t = normalize(text);
  if (!t || t.split(" ").length > 6) return false;
  return /(next question|next one|move on|thats my answer|thats the answer|that is my answer|thats all|that is all|im done|i am done|im finished|i am finished|all done)/.test(
    t
  );
}

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
  /** Fires when the candidate hasn't STARTED answering (re-ask / move-on). */
  const awaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** How many times we've auto-re-asked the CURRENT question. */
  const reaskCountRef = useRef<number>(0);

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
  /** True once the user has spoken at least one word for the current question. */
  const userHasSpokenRef = useRef<boolean>(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearAwaitTimer = useCallback(() => {
    if (awaitTimerRef.current) {
      clearTimeout(awaitTimerRef.current);
      awaitTimerRef.current = null;
    }
  }, []);

  /** Clear every pending turn timer at once. */
  const clearTurnTimers = useCallback(() => {
    clearSilenceTimer();
    clearAwaitTimer();
  }, [clearSilenceTimer, clearAwaitTimer]);

  const cleanup = useCallback(() => {
    log("cleanup()");
    clearTurnTimers();
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
  }, [clearTurnTimers]);

  const stop = useCallback(() => {
    log("stop() called");
    finishedRef.current = true;
    cleanup();
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  /** Speak a question verbatim by injecting it as an agent message. */
  const injectQuestion = useCallback(
    (question: VoiceQuestion | VoiceInterviewInput["questions"][number]) => {
      const text =
        ("ttsTranscript" in question && question.ttsTranscript) ||
        ("prompt" in question && (question as { prompt?: string }).prompt) ||
        "";
      if (!text) {
        warn("injectQuestion: no text for sequence", question.sequence);
        return;
      }
      log(
        "injectQuestion: seq =",
        question.sequence,
        "text =",
        text.slice(0, 80) + "…"
      );
      currentSequenceRef.current = question.sequence;
      answerBufferRef.current = "";
      userHasSpokenRef.current = false;
      reaskCountRef.current = 0; // fresh question — reset the re-ask budget.
      turnStartRef.current = Date.now();
      clearTurnTimers();
      connRef.current?.sendInjectAgentMessage({
        type: "InjectAgentMessage",
        message: text,
        behavior: "queue",
      });
    },
    [clearTurnTimers]
  );

  /** Resolve the spoken text of the question currently being asked. */
  const getCurrentQuestionText = useCallback((): string => {
    const q = questionsRef.current.find(
      (x) => x.sequence === currentSequenceRef.current
    );
    if (!q) return "";
    return q.ttsTranscript || q.prompt || "";
  }, []);

  /**
   * Re-speak the CURRENT question (agent never does this on its own anymore).
   * Used both when the candidate asks for a repeat and when they stay silent
   * and we auto-re-ask. Resets the answer capture so their reply starts fresh,
   * but does NOT touch the re-ask counter (the caller owns that).
   */
  const reinjectCurrentQuestion = useCallback(
    (leadIn?: string) => {
      const text = getCurrentQuestionText();
      if (!text) {
        warn("reinjectCurrentQuestion: no text for current question");
        return;
      }
      log("reinjectCurrentQuestion:", leadIn ? `(${leadIn}) ` : "", text.slice(0, 60) + "…");
      answerBufferRef.current = "";
      userHasSpokenRef.current = false;
      turnStartRef.current = Date.now();
      clearTurnTimers();
      connRef.current?.sendInjectAgentMessage({
        type: "InjectAgentMessage",
        message: leadIn ? `${leadIn} ${text}` : text,
        behavior: "queue",
      });
    },
    [clearTurnTimers, getCurrentQuestionText]
  );

  /** End the interview: run existing evaluation pipeline, then flag report ready. */
  const finishInterview = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearSilenceTimer();
    log("finishInterview: calling POST", API.interviewEnd);
    store.getState().setState("EVALUATING");

    try {
      const res = await fetch(API.interviewEnd, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: interviewIdRef.current }),
      });
      const json = await res.json();
      log("finishInterview: response =", json);
      if (!json.success) throw new Error(json.error || "Evaluation failed");
      store.getState().setState("REPORT_READY");
    } catch (err) {
      warn("finishInterview: error =", err);
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
  const advanceTurn = useCallback(
    async (trigger: "function_call" | "silence_fallback") => {
      log(
        `advanceTurn(${trigger}): advancing=${advancingRef.current}, finished=${finishedRef.current}, seq=${currentSequenceRef.current}, bufferLen=${answerBufferRef.current.trim().length}`
      );

      if (advancingRef.current || finishedRef.current) {
        log("advanceTurn: BLOCKED (already advancing or finished)");
        return;
      }
      const sequence = currentSequenceRef.current;
      const transcript = answerBufferRef.current.trim();
      // Nothing to save yet (agent hasn't asked / candidate hasn't spoken).
      if (sequence <= 0) {
        log("advanceTurn: BLOCKED (sequence <= 0)");
        return;
      }

      advancingRef.current = true;
      clearTurnTimers();
      store.getState().finalizeLiveUserTurn();
      store.getState().setState("WAITING_FOR_BACKEND");

      // Ack the function call if this advance came from one.
      // The `content` feeds back into the LLM context — it MUST instruct the
      // agent to stop generating speech and wait for the next injected question.
      if (pendingFnIdRef.current) {
        log("advanceTurn: sending FunctionCallResponse for id =", pendingFnIdRef.current);
        connRef.current?.sendFunctionCallResponse({
          type: "FunctionCallResponse",
          id: pendingFnIdRef.current,
          name: COMPLETE_ANSWER_FUNCTION,
          content: JSON.stringify({
            status: "received",
            instruction:
              "Answer saved. STOP TALKING NOW. Do not comment on the answer. Do not ask follow-up questions. Do not say anything at all. Wait in complete silence. The next interview question will be injected for you to speak shortly.",
          }),
        });
        pendingFnIdRef.current = null;
      }

      try {
        const durationSec = Math.max(
          0,
          Math.round((Date.now() - turnStartRef.current) / 1000)
        );
        const body = {
          interviewId: interviewIdRef.current,
          sequence,
          // Fall back to a placeholder so the backend Zod min(1) passes even if
          // the candidate stayed silent (silence-fallback path).
          transcript: transcript || "(no answer provided)",
          durationSec,
        };
        log("advanceTurn: POST", API.interviewVoiceAnswer, body);

        const res = await fetch(API.interviewVoiceAnswer, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        log("advanceTurn: response =", json);

        if (!json.success) throw new Error(json.error || "Failed to save answer");

        const { done, nextQuestion, index, totalQuestions } = json.data as {
          done: boolean;
          index: number;
          totalQuestions: number;
          nextQuestion: VoiceQuestion | null;
        };

        log(
          "advanceTurn: done =",
          done,
          "nextQuestion =",
          nextQuestion ? `seq ${nextQuestion.sequence}` : "null",
          "index =",
          index,
          "total =",
          totalQuestions
        );

        if (done || !nextQuestion) {
          log("advanceTurn: INTERVIEW COMPLETE — injecting closing message");
          connRef.current?.sendInjectAgentMessage({
            type: "InjectAgentMessage",
            message:
              "Thank you for your time. That concludes today's interview. We will review your answers and prepare your evaluation report.",
            behavior: "queue",
          });
          store.getState().setState("FINISHED");
          store.getState().setProgress(totalQuestions, totalQuestions);
          // Give the closing line a moment to play, then evaluate.
          setTimeout(() => void finishInterview(), 5000);
        } else {
          log("advanceTurn: injecting next question seq =", nextQuestion.sequence);
          store.getState().setProgress(index + 1, totalQuestions);
          injectQuestion(nextQuestion);
          store.getState().setState("AI_SPEAKING");
        }
      } catch (err) {
        warn("advanceTurn: ERROR =", err);
        store
          .getState()
          .setError(err instanceof Error ? err.message : "Failed to advance");
      } finally {
        advancingRef.current = false;
      }
    },
    [clearTurnTimers, finishInterview, injectQuestion, store]
  );

  /** Whether it is safe to advance to the next question right now. */
  const canAdvanceNow = useCallback((): boolean => {
    return (
      !agentSpeakingRef.current &&
      !advancingRef.current &&
      !finishedRef.current &&
      userHasSpokenRef.current &&
      answerBufferRef.current.trim().length > 0
    );
  }, []);

  /**
   * Schedule an advance to the next question after the candidate goes silent.
   *
   * Two-stage by default: a first grace period (they may just be thinking),
   * then a final beat before moving on — like a human interviewer waiting for
   * you to finish. ANY new user speech clears this and re-schedules from the
   * start (see the ConversationText handler), so an in-progress answer is never
   * cut off. `twoStage=false` is the short confirm used when the candidate
   * explicitly says they are done.
   */
  const scheduleAdvance = useCallback(
    (firstDelayMs: number, twoStage: boolean) => {
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        if (!canAdvanceNow()) {
          log("scheduleAdvance: stage-1 fired but cannot advance yet");
          return;
        }
        if (!twoStage) {
          log("scheduleAdvance: advancing (explicit done / hint)");
          void advanceTurn("silence_fallback");
          return;
        }
        // Final grace — hold one more beat in case they resume speaking.
        log("scheduleAdvance: entering final grace window");
        silenceTimerRef.current = setTimeout(() => {
          if (!canAdvanceNow()) {
            log("scheduleAdvance: stage-2 fired but cannot advance yet");
            return;
          }
          log("scheduleAdvance: advancing after full silence window");
          void advanceTurn("silence_fallback");
        }, SILENCE_STAGE2_MS);
      }, firstDelayMs);
    },
    [advanceTurn, canAdvanceNow, clearSilenceTimer]
  );

  /**
   * Schedule what happens when the candidate has NOT started answering the
   * current question. This is the "real interviewer" waiting behavior: give
   * them a generous beat, then re-ask the question ONCE, then (after another
   * beat) move on. Any speech from the candidate cancels this (see the
   * ConversationText / UserStartedSpeaking handlers).
   */
  const scheduleAwaitAnswer = useCallback(() => {
    clearAwaitTimer();
    const delay = reaskCountRef.current === 0 ? AWAIT_ANSWER_MS : REASK_GRACE_MS;
    log(`scheduleAwaitAnswer: waiting ${delay}ms (reasks so far = ${reaskCountRef.current})`);
    awaitTimerRef.current = setTimeout(() => {
      // Bail if things moved on while we waited, or the candidate started.
      if (
        agentSpeakingRef.current ||
        advancingRef.current ||
        finishedRef.current ||
        userHasSpokenRef.current
      ) {
        log("scheduleAwaitAnswer: fired but no longer applicable, ignoring");
        return;
      }
      if (reaskCountRef.current < MAX_AUTO_REASKS) {
        reaskCountRef.current += 1;
        log(`scheduleAwaitAnswer: no answer yet — re-asking (attempt ${reaskCountRef.current})`);
        store.getState().setState("AI_SPEAKING");
        reinjectCurrentQuestion("Take your time. Let me repeat the question.");
      } else {
        log("scheduleAwaitAnswer: still no answer after re-ask — moving on");
        void advanceTurn("silence_fallback");
      }
    }, delay);
  }, [advanceTurn, clearAwaitTimer, reinjectCurrentQuestion, store]);

  /** Handle one JSON control frame from the agent. */
  const handleMessage = useCallback(
    (msg: AgentServerMessage) => {
      switch (msg.type) {
        case "Welcome":
          log("event: Welcome");
          store.getState().setState("READY");
          break;

        case "SettingsApplied": {
          log("event: SettingsApplied");
          // Greeting plays automatically; kick off Q1 right after so the agent
          // speaks it once the welcome finishes (queued).
          store.getState().setState("GREETING");
          const first = questionsRef.current[0];
          if (first) {
            log("SettingsApplied: injecting first question, total =", questionsRef.current.length);
            store.getState().setProgress(1, questionsRef.current.length);
            injectQuestion(first);
          } else {
            warn("SettingsApplied: NO questions available!");
          }
          break;
        }

        case "ConversationText": {
          const role = msg.role === "user" ? "user" : "ai";
          const content = typeof msg.content === "string" ? msg.content : "";
          if (!content) break;

          log(`event: ConversationText role=${role} content="${content.slice(0, 100)}"`);

          if (role === "user") {
            const trimmed = content.trim();

            // Clarification / repeat request — NOT an answer. The agent stays
            // silent now, so WE re-speak the current question ourselves and keep
            // waiting. Don't count it toward the answer and don't advance.
            if (isClarificationRequest(trimmed)) {
              log("ConversationText: clarification request — re-asking current question");
              store.getState().appendLiveUserTurn(content);
              clearTurnTimers();
              store.getState().setState("AI_SPEAKING");
              reinjectCurrentQuestion("Of course.");
              break;
            }

            // Real answer speech — the candidate has started, so cancel the
            // "waiting for you to start" timer and accumulate into the buffer.
            clearAwaitTimer();
            answerBufferRef.current = answerBufferRef.current
              ? `${answerBufferRef.current} ${content}`
              : content;
            userHasSpokenRef.current = true;
            // Append JUST the new text to the UI bubble.
            store.getState().appendLiveUserTurn(content);

            // (Re)schedule the advance. Any new speech restarts the window, so a
            // pause mid-answer can never cut the candidate off.
            if (isExplicitDone(trimmed)) {
              // They said they're finished — short confirm, then move on.
              scheduleAdvance(EXPLICIT_DONE_MS, false);
            } else {
              // Normal pause — wait through the full two-stage grace window.
              scheduleAdvance(SILENCE_STAGE1_MS, true);
            }
          } else {
            // AI text — display it but DON'T let the agent's own speech
            // affect the silence timer or answer buffer.
            store.getState().appendTurn("ai", content);
          }
          break;
        }

        case "UserStartedSpeaking":
          log("event: UserStartedSpeaking");
          // Barge-in: stop any agent audio immediately.
          playerRef.current?.clear();
          agentSpeakingRef.current = false;
          // They're talking — cancel both the "waiting to start" and the
          // end-of-answer timers; the ConversationText handler re-arms as needed.
          clearTurnTimers();
          if (!advancingRef.current && !finishedRef.current) {
            store.getState().setState("USER_LISTENING");
          }
          break;

        case "AgentThinking":
          log("event: AgentThinking");
          if (!advancingRef.current && !finishedRef.current) {
            store.getState().setState("PROCESSING");
          }
          break;

        case "AgentStartedSpeaking":
          log("event: AgentStartedSpeaking");
          agentSpeakingRef.current = true;
          clearSilenceTimer();
          if (!advancingRef.current && !finishedRef.current) {
            store.getState().setState("AI_SPEAKING");
          }
          break;

        case "AgentAudioDone":
          log("event: AgentAudioDone, userHasSpoken =", userHasSpokenRef.current);
          agentSpeakingRef.current = false;
          if (!advancingRef.current && !finishedRef.current) {
            store.getState().setState("USER_LISTENING");
            if (userHasSpokenRef.current && answerBufferRef.current.trim().length > 0) {
              // Candidate answered while the agent was still finishing — resume
              // the end-of-answer grace window.
              log("AgentAudioDone: scheduling advance (user has spoken)");
              scheduleAdvance(SILENCE_STAGE1_MS, true);
            } else {
              // Question just finished playing and the candidate hasn't spoken.
              // Wait patiently, then re-ask, then move on.
              log("AgentAudioDone: awaiting first answer");
              scheduleAwaitAnswer();
            }
          }
          break;

        case "FunctionCallRequest": {
          log("event: FunctionCallRequest", msg.functions);
          const functions = Array.isArray(msg.functions)
            ? (msg.functions as { id: string; name: string }[])
            : [];
          const call = functions.find(
            (f) => f.name === COMPLETE_ANSWER_FUNCTION
          );
          if (call) {
            log("FunctionCallRequest: complete_answer (treated as a HINT, not a command)");
            // Non-authoritative: the agent thinks the candidate is done, but the
            // CLIENT decides when to advance. Ack immediately so the agent stays
            // silent, then let the silence window confirm — this stops an
            // over-eager LLM from cutting the candidate off mid-answer.
            connRef.current?.sendFunctionCallResponse({
              type: "FunctionCallResponse",
              id: call.id,
              name: COMPLETE_ANSWER_FUNCTION,
              content: JSON.stringify({
                status: "received",
                instruction:
                  "Noted. STOP TALKING NOW. Do not comment on the answer, do not ask anything. Wait in silence for the next injected question.",
              }),
            });
            pendingFnIdRef.current = null;
            // Only start the grace window if the candidate has actually spoken.
            if (
              userHasSpokenRef.current &&
              answerBufferRef.current.trim().length > 0
            ) {
              scheduleAdvance(SILENCE_STAGE1_MS, true);
            }
          } else {
            warn("FunctionCallRequest: unknown function(s)", functions.map((f) => f.name));
          }
          break;
        }

        case "Warning":
          warn("event: Warning", msg);
          break;

        case "Error":
          warn("event: Error", msg);
          store
            .getState()
            .setError(
              typeof msg.description === "string"
                ? msg.description
                : "Voice Agent error"
            );
          break;

        default:
          // Log unknown event types for debugging.
          if (msg.type) {
            log("event: (unhandled)", msg.type);
          }
          break;
      }
    },
    [clearSilenceTimer, injectQuestion, scheduleAdvance, store]
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
      userHasSpokenRef.current = false;
      interviewIdRef.current = interview.id;
      questionsRef.current = (interview.questions ?? [])
        .slice()
        .sort((a, b) => a.sequence - b.sequence);

      log(
        "start: interviewId =",
        interview.id,
        "questions =",
        questionsRef.current.map((q) => ({ seq: q.sequence, has_tts: !!q.ttsTranscript }))
      );

      if (questionsRef.current.length === 0) {
        return { ok: false, error: "No questions to conduct" };
      }

      store.getState().setState("CONNECTING");

      // 1. Mint a short-lived access token.
      let token: string;
      try {
        log("start: fetching voice token...");
        const res = await fetch(API.interviewVoiceToken);
        const json = await res.json();
        
        // React Strict Mode race condition: stop() might have been called while we were fetching the token.
        // If so, abort setup immediately so we don't create a zombie connection.
        if (finishedRef.current) {
          log("start: aborted because stop() was called during token fetch");
          return { ok: false, error: "Aborted" };
        }

        if (!res.ok || !json.success || !json.data?.token) {
          throw new Error(json.message || "Could not obtain a Deepgram token");
        }
        token = json.data.token;
        log("start: token obtained");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Token request failed";
        warn("start: token error =", message);
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
          log("WebSocket: onClose, finished =", finishedRef.current);
          // Unexpected close mid-interview surfaces as a lost connection; a
          // close after finish/stop is expected and ignored.
          if (!finishedRef.current && store.getState().state !== "REPORT_READY") {
            store.getState().setError("Voice connection closed");
          }
        },
        onError: () => {
          warn("WebSocket: onError");
          if (!finishedRef.current) {
            store.getState().setError("Voice connection lost");
          }
        },
      });
      connRef.current = conn;

      try {
        log("start: connecting WebSocket...");
        await conn.connect(token);
        log("start: WebSocket connected");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Connection failed";
        warn("start: WebSocket error =", message);
        store.getState().setError(message);
        cleanup();
        return { ok: false, error: message };
      }

      // 3. Settings must be the first frame after open.
      log("start: sending Settings");
      conn.sendSettings(buildInterviewAgentSettings());

      // 4. Keepalive to preserve the long session.
      keepAliveRef.current = setInterval(() => {
        conn.sendKeepAlive();
      }, AGENT_KEEPALIVE_MS);

      // 5. Start streaming the mic.
      try {
        log("start: requesting microphone...");
        const mic = new MicRecorder({
          targetSampleRate: AGENT_INPUT_SAMPLE_RATE,
          onChunk: (chunk) => conn.sendMedia(chunk),
        });
        micRef.current = mic;
        await mic.start();
        log("start: microphone active");
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        const message =
          name === "NotAllowedError" || name === "SecurityError"
            ? "Microphone permission denied"
            : name === "NotFoundError"
              ? "No microphone found"
              : "Could not access the microphone";
        warn("start: mic error =", message);
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
