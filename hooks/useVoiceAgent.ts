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
  EXPLICIT_DONE_MS,
  INJECT_DELAY_MS,
  MIN_ANSWER_CHARS,
  MIN_SILENCE_BEFORE_FUNCTION_MS,
  MIN_TURN_MS,
  SILENCE_FALLBACK_MS,
  WAITING_FIRST_RESPONSE_MS,
  buildInterviewAgentSettings,
} from "@/lib/deepgram/voice-agent/settings";
import { useVoiceAgentStore } from "@/store/useVoiceAgentStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import { API } from "@/lib/utils/constants";
import { FRIENDLY } from "@/lib/utils/messages";
import type { VoiceQuestion } from "@/services/voiceInterview.service";
import {
  buildVoiceAgentTransitionLog,
  type ConversationState,
} from "@/types/voiceAgent";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Logging helper â€” all voice agent logs go through this for easy filtering.
// Open DevTools console and filter on [VoiceAgent] to trace the flow.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LOG_PREFIX = "[VoiceAgent]";
function log(...args: unknown[]) {
  console.log(LOG_PREFIX, ...args);
}
function warn(...args: unknown[]) {
  console.warn(LOG_PREFIX, ...args);
}

type VoiceLogEvent =
  | "GREETING"
  | "WAIT_FOR_BACKEND_QUESTION"
  | "QUESTION_RECEIVED"
  | "QUESTION_SPOKEN"
  | "WAITING_FOR_FIRST_RESPONSE"
  | "USER_STARTED_SPEAKING"
  | "USER_ANSWERING"
  | "REPEAT_REQUEST"
  | "CLARIFICATION_REQUEST"
  | "ANSWER_COMPLETE"
  | "TRANSCRIPT_SENT"
  | "NEXT_QUESTION_RECEIVED"
  | "FINAL_QUESTION"
  | "INTERVIEW_FINISHED";

function logVoiceEvent(
  event: VoiceLogEvent,
  source: "backend" | "voice_agent" | "candidate" | "client",
  metadata: Record<string, unknown> = {}
) {
  console.info(LOG_PREFIX, {
    event,
    source,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
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
 * answer or trigger an advance â€” the agent rephrases and we keep waiting. Kept
 * strict (short utterance + explicit ask) so a long answer that merely contains
 * a word like "explain" is never misclassified as a clarification.
 */
function isClarificationRequest(text: string): boolean {
  const t = normalize(text);
  if (!t || t.split(" ").length > 9) return false;
  return /(repeat|rephrase|say that again|say again|come again|didnt (hear|catch|get)|can you explain|could you explain|what do you mean|not sure what you mean|dont understand|dont get it|pardon|clarify)/.test(
    t
  );
}

/**
 * Sub-intent of a clarification: does the candidate want the question EXPLAINED
 * (rephrased) rather than simply REPEATED? Drives the spoken lead-in. Either way
 * we re-speak the same Gemini question â€” we have no separate paraphrase source â€”
 * but the lead-in acknowledges what they actually asked for.
 */
function isExplainRequest(text: string): boolean {
  const t = normalize(text);
  return /(explain|what do you mean|not sure what you mean|dont understand|dont get it|clarify|rephrase)/.test(
    t
  );
}

/**
 * True for short, explicit "I'm finished / move on" signals. Only used to
 * SHORTEN the grace window â€” we still wait a brief confirming beat before
 * advancing, so a false positive can never cut someone off instantly.
 */
function isExplicitDone(text: string): boolean {
  const t = normalize(text);
  if (!t || t.split(" ").length > 6) return false;
  return /(next question|next one|move on|thats my answer|thats the answer|that is my answer|thats all|that is all|im done|i am done|im finished|i am finished|all done)/.test(
    t
  );
}

function isSkipRequest(text: string): boolean {
  const t = normalize(text);
  if (!t) return false;
  return /(i dont know|i do not know|skip this question|skip question|skip it|next question|next one|move on)/.test(
    t
  );
}

/**
 * Short, human acknowledgements spoken before moving to the next question. The
 * agent speaks these verbatim (they are injected, not generated). Rotated so the
 * interview doesn't repeat the same word every time.
 */
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
 * The agent never generates questions â€” it only conducts the conversation.
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
  const lastUserSpeechAtRef = useRef<number>(0);
  const pendingFnIdRef = useRef<string | null>(null);
  /** True once the user has spoken at least one word for the current question. */
  const userHasSpokenRef = useRef<boolean>(false);
  const expectedAgentSpeechRef = useRef<number>(0);
  const currentAgentSpeechAllowedRef = useRef<boolean>(false);
  const expectedAgentSpeechTextsRef = useRef<string[]>([]);
  const expectedAgentSpeechKindsRef = useRef<("question" | "other")[]>([]);
  const currentAgentSpeechKindRef = useRef<"question" | "other" | null>(null);
  /** Handler attached to window unload events so we always tear the socket down. */
  const unloadHandlerRef = useRef<(() => void) | null>(null);

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
    expectedAgentSpeechRef.current = 0;
    currentAgentSpeechAllowedRef.current = false;
    expectedAgentSpeechTextsRef.current = [];
    expectedAgentSpeechKindsRef.current = [];
    currentAgentSpeechKindRef.current = null;
    lastUserSpeechAtRef.current = 0;
    // Detach any window unload handlers we registered in start().
    if (unloadHandlerRef.current && typeof window !== "undefined") {
      window.removeEventListener("beforeunload", unloadHandlerRef.current);
      window.removeEventListener("pagehide", unloadHandlerRef.current);
      unloadHandlerRef.current = null;
    }
  }, [clearTurnTimers]);

  const stop = useCallback(() => {
    log("stop() called");
    finishedRef.current = true;
    cleanup();
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  /**
   * Central state-machine transition. EVERY conversation-state change goes
   * through here so we get one structured log line per transition:
   *   [VoiceAgent] STATE <from> â†’ <to> { from, to, seq, reason }
   * Filter the console on "STATE" to trace the whole interview flow.
   */
  const transition = useCallback(
    (
      next: ConversationState,
      reason?: string,
      metadata?: Record<string, unknown>
    ) => {
      const prev = store.getState().state;
      const stateLog = buildVoiceAgentTransitionLog({
        from: prev,
        to: next,
        interviewId: interviewIdRef.current,
        sequence: currentSequenceRef.current,
        reason,
        metadata,
      });
      console.info(LOG_PREFIX, stateLog);
      if (prev !== next) {
        store.getState().setState(next);
      }
    },
    [store]
  );

  const failVoiceAgent = useCallback(
    (message: string) => {
      transition("ERROR", message);
      store.getState().setError(message);
    },
    [store, transition]
  );

  /**
   * Speak a question verbatim by injecting it as an agent message. The Voice
   * Agent NEVER generates the question â€” the backend supplies it and we inject
   * the exact text. An optional `leadIn` (a brief acknowledgement +
   * "moving to the next question") is prepended for transitions between
   * questions so the agent flows straight into the next one with no frontend
   * interaction and no "Next Question" button.
   */
  const injectQuestion = useCallback(
    (
      question: VoiceQuestion | VoiceInterviewInput["questions"][number],
      leadIn?: string
    ) => {
      const text =
        ("ttsTranscript" in question && question.ttsTranscript) ||
        ("prompt" in question && (question as { prompt?: string }).prompt) ||
        "";
      if (!text) {
        warn("injectQuestion: no text for sequence", question.sequence);
        return;
      }
      const message = leadIn ? `${leadIn} ${text}` : text;
      logVoiceEvent("QUESTION_RECEIVED", "backend", {
        interviewId: interviewIdRef.current,
        sequence: question.sequence,
        hasLeadIn: Boolean(leadIn),
      });
      log(
        "injectQuestion: seq =",
        question.sequence,
        leadIn ? `leadIn = "${leadIn}"` : "(no leadIn)",
        "text =",
        text.slice(0, 80) + "â€¦"
      );
      currentSequenceRef.current = question.sequence;
      answerBufferRef.current = "";
      userHasSpokenRef.current = false;
      reaskCountRef.current = 0; // fresh question â€” reset the re-ask budget.
      turnStartRef.current = Date.now();
      clearTurnTimers();
      transition("QUESTION_RECEIVED", `seq=${question.sequence}`, {
        source: "backend",
      });
      transition("SPEAK_BACKEND_QUESTION", `seq=${question.sequence}`, {
        source: "voice_agent",
      });
      expectedAgentSpeechRef.current += 1;
      expectedAgentSpeechTextsRef.current.push(message);
      expectedAgentSpeechKindsRef.current.push("question");
      store.getState().appendTurn("ai", message);
      connRef.current?.sendInjectAgentMessage({
        type: "InjectAgentMessage",
        message,
        behavior: "queue",
      });
    },
    [clearTurnTimers, store, transition]
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
      log("reinjectCurrentQuestion:", leadIn ? `(${leadIn}) ` : "", text.slice(0, 60) + "â€¦");
      answerBufferRef.current = "";
      userHasSpokenRef.current = false;
      turnStartRef.current = Date.now();
      clearTurnTimers();
      const message = leadIn ? `${leadIn} ${text}` : text;
      expectedAgentSpeechRef.current += 1;
      expectedAgentSpeechTextsRef.current.push(message);
      expectedAgentSpeechKindsRef.current.push("question");
      // Issue #1: REPLAY the existing question only. Do NOT append a new chat
      // bubble, do NOT advance the question index, do NOT change progress. The
      // question already exists in conversation history as a single bubble.
      connRef.current?.sendInjectAgentMessage({
        type: "InjectAgentMessage",
        message,
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
    transition("EVALUATING", "running existing evaluation pipeline");

    try {
      const res = await fetch(API.interviewEnd, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: interviewIdRef.current }),
      });
      const json = await res.json();
      log("finishInterview: response =", json);
      if (!json.success) throw new Error(json.error || "Evaluation failed");
      transition("REPORT_READY", "evaluation complete");
    } catch (err) {
      warn("finishInterview: error =", err);
      failVoiceAgent(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      // Voice session is done regardless of evaluation outcome.
      micRef.current?.stop();
      playerRef.current?.clear();
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      // Issue #4: gracefully close the Deepgram socket now that the interview
      // is complete. finishedRef is already true, so onClose stays silent.
      connRef.current?.close();
      connRef.current = null;
    }
  }, [clearSilenceTimer, failVoiceAgent, transition]);

  /**
   * Single funnel for answer-completion (function call OR silence fallback).
   * Guarded so the two triggers never double-advance.
   */
  const advanceTurn = useCallback(
    async (
      trigger: "function_call" | "silence_fallback" | "no_response" | "skip",
      transcriptOverride?: string
    ) => {
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
      logVoiceEvent("ANSWER_COMPLETE", "voice_agent", {
        interviewId: interviewIdRef.current,
        sequence,
        trigger,
      });
      transition("ANSWER_COMPLETE", `trigger=${trigger}`);
      transition("CALL_COMPLETE_ANSWER", `trigger=${trigger}`);
      transition("SAVE_TRANSCRIPT", "persisting transcript + fetching next question");

      // Ack the function call if this advance came from one.
      // The `content` feeds back into the LLM context â€” it MUST instruct the
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
        // Wait a short beat so the LLM's "stay silent" instruction has time to
        // propagate before the InjectAgentMessage arrives. Without this gap the
        // LLM can fill the ~0ms window between ACK and inject with its own
        // generated speech (e.g. asking its own follow-up question).
        await new Promise<void>((resolve) => setTimeout(resolve, INJECT_DELAY_MS));
        log(`advanceTurn: ${INJECT_DELAY_MS}ms ACK propagation delay elapsed`);
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
          transcript:
            transcriptOverride ||
            (trigger === "skip"
              ? "(candidate skipped question)"
              : transcript || "(no answer provided)"),
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
        logVoiceEvent("TRANSCRIPT_SENT", "client", {
          interviewId: interviewIdRef.current,
          sequence,
          trigger,
        });
        transition("TRANSCRIPT_SENT", `seq=${sequence}`);

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
          logVoiceEvent("INTERVIEW_FINISHED", "backend", {
            interviewId: interviewIdRef.current,
            sequence,
          });
          log("advanceTurn: INTERVIEW COMPLETE â€” thanking candidate");
          transition("THANK_CANDIDATE", "final question answered");
          expectedAgentSpeechRef.current += 1;
          expectedAgentSpeechTextsRef.current.push(
            "Thank you for completing today's interview."
          );
          expectedAgentSpeechKindsRef.current.push("other");
          store.getState().appendTurn(
            "ai",
            "Thank you for completing today's interview."
          );
          connRef.current?.sendInjectAgentMessage({
            type: "InjectAgentMessage",
            message: "Thank you for completing today's interview.",
            behavior: "queue",
          });
          transition("WAIT_FOR_BACKEND", "evaluation continues outside voice agent");
          store.getState().setProgress(totalQuestions, totalQuestions);
          // Give the closing line a moment to play, then evaluate.
          setTimeout(() => void finishInterview(), 5000);
        } else {
          logVoiceEvent("NEXT_QUESTION_RECEIVED", "backend", {
            interviewId: interviewIdRef.current,
            sequence: nextQuestion.sequence,
            isLastQuestion: index >= totalQuestions - 1,
          });
          log("advanceTurn: injecting next question seq =", nextQuestion.sequence);
          store.getState().setProgress(index + 1, totalQuestions);
          const isFinal = index >= totalQuestions - 1;
          transition("NEXT_QUESTION_RECEIVED", `seq=${nextQuestion.sequence}`, {
            source: "backend",
            isLastQuestion: isFinal,
          });
          if (isFinal) {
            logVoiceEvent("FINAL_QUESTION", "backend", {
              interviewId: interviewIdRef.current,
              sequence: nextQuestion.sequence,
            });
          }
          // Lead-in depends on why we advanced:
          //  â€¢ no_response â†’ the single, explicit timeout message.
          //  â€¢ otherwise  â†’ a brief acknowledgement of their answer.
          // Either way it's ONE injected agent message that flows straight into
          // the backend-supplied question â€” no frontend interaction.
          const leadIn =
            trigger === "no_response"
              ? "I haven't received a response for this question, so we'll move on."
              : trigger === "skip"
                ? "Understood. We'll move to the next question."
                : undefined;
          if (leadIn) {
            transition("ACKNOWLEDGE_RESPONSE", `leadIn="${leadIn}"`);
          }
          transition(
            isFinal ? "FINAL_QUESTION" : "ASK_NEXT_QUESTION",
            `seq=${nextQuestion.sequence}${isFinal ? " (last question)" : ""}`
          );
          injectQuestion(nextQuestion, leadIn);
        }
      } catch (err) {
        warn("advanceTurn: ERROR =", err);
        failVoiceAgent(err instanceof Error ? err.message : "Failed to advance");
      } finally {
        advancingRef.current = false;
      }
    },
    [clearTurnTimers, failVoiceAgent, finishInterview, injectQuestion, store, transition]
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
   * FALLBACK completion path (USER_ANSWERING). Primary completion is the Voice
   * Agent LLM calling complete_answer (see FunctionCallRequest). This silence
   * timer only rescues a stalled LLM: it fires `delayMs` (5â€“8s) AFTER the
   * candidate last spoke and advances then. ANY new user speech clears and
   * re-schedules it from the start (see the ConversationText handler), so
   * natural mid-answer thinking pauses never cut the candidate off â€” the clock
   * only runs once they have truly stopped talking.
   */
  const scheduleSilenceFallback = useCallback(
    (delayMs: number) => {
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        if (!canAdvanceNow()) {
          log("scheduleSilenceFallback: fired but cannot advance yet");
          return;
        }
        log(`scheduleSilenceFallback: ${delayMs}ms of silence â€” advancing (fallback)`);
        void advanceTurn("silence_fallback");
      }, delayMs);
    },
    [advanceTurn, canAdvanceNow, clearSilenceTimer]
  );

  /**
   * WAITING_FOR_FIRST_RESPONSE: after a question finishes playing and the
   * candidate has NOT started speaking, wait quietly for a generous window
   * (WAITING_FIRST_RESPONSE_MS, 45s) so they have time to gather their
   * thoughts. During this window we do NOT repeat the question, do NOT
   * interrupt, and do NOT advance â€” we simply listen. The timer exists ONLY to
   * detect that the candidate never started; any speech cancels it immediately
   * (see the ConversationText / UserStartedSpeaking handlers) and we move to the
   * answering state. If the whole window elapses with total silence we move on
   * to the next question WITHOUT ever repeating this one.
   */
  const scheduleFirstResponseWait = useCallback(() => {
    clearAwaitTimer();
    log(
      `scheduleFirstResponseWait: WAITING_FOR_FIRST_RESPONSE, quietly waiting ${WAITING_FIRST_RESPONSE_MS}ms for the candidate to start`
    );
    if (!advancingRef.current && !finishedRef.current) {
      logVoiceEvent("WAITING_FOR_FIRST_RESPONSE", "client", {
        interviewId: interviewIdRef.current,
        sequence: currentSequenceRef.current,
        timeoutMs: WAITING_FIRST_RESPONSE_MS,
      });
      transition("WAITING_FOR_FIRST_RESPONSE", "question asked, awaiting first words");
    }
    awaitTimerRef.current = setTimeout(() => {
      // Bail if things moved on while we waited, or the candidate started.
      if (
        agentSpeakingRef.current ||
        advancingRef.current ||
        finishedRef.current ||
        userHasSpokenRef.current
      ) {
        log("scheduleFirstResponseWait: fired but no longer applicable, ignoring");
        return;
      }
      // Candidate never started. Never repeat the question â€” say the single
      // no-response message and move straight on to the next question.
      log("scheduleFirstResponseWait: no response in window â€” moving on with no-response message");
      void advanceTurn("no_response");
    }, WAITING_FIRST_RESPONSE_MS);
  }, [advanceTurn, clearAwaitTimer, transition]);

  /** Handle one JSON control frame from the agent. */
  const handleMessage = useCallback(
    (msg: AgentServerMessage) => {
      switch (msg.type) {
        case "Welcome": {
          log("event: Welcome", msg);
          const requestId = (msg.request_id ?? msg.requestId) as string | undefined;
          if (requestId && interviewIdRef.current) {
            fetch("/api/interview/voice/session-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                interviewId: interviewIdRef.current,
                requestId,
                source: "client_welcome",
              }),
            }).catch((err) => {
              console.warn("[VoiceAgent] Failed to capture requestId:", err);
            });
          }
          transition("READY", "agent websocket ready");
          break;
        }

        case "SettingsApplied": {
          log("event: SettingsApplied");
          // Greeting plays automatically; kick off Q1 right after so the agent
          // speaks it once the welcome finishes (queued).
          logVoiceEvent("GREETING", "voice_agent", {
            interviewId: interviewIdRef.current,
          });
          transition("GREETING", "greeting candidate");
          transition("WAIT_FOR_BACKEND_QUESTION", "waiting for first backend question");
          logVoiceEvent("WAIT_FOR_BACKEND_QUESTION", "client", {
            interviewId: interviewIdRef.current,
          });
          const startIndex = useInterviewStore.getState().currentIndex || 0;
          const first = questionsRef.current[startIndex];
          if (first) {
            log(`SettingsApplied: injecting question at index ${startIndex}, total = ${questionsRef.current.length}`);
            store.getState().setProgress(startIndex + 1, questionsRef.current.length);
            const isFinalQuestion = startIndex >= questionsRef.current.length - 1;
            transition(
              isFinalQuestion ? "FINAL_QUESTION" : "ASKING_QUESTION",
              `starting at seq=${first.sequence}`
            );
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

            if (isSkipRequest(trimmed)) {
              logVoiceEvent("ANSWER_COMPLETE", "candidate", {
                interviewId: interviewIdRef.current,
                sequence: currentSequenceRef.current,
                trigger: "skip",
              });
              store.getState().finalizeLiveUserTurn();
              store.getState().appendTurn("user", content);
              clearTurnTimers();
              pendingFnIdRef.current = null;
              void advanceTurn("skip", "(candidate skipped question)");
              break;
            }

            // Clarification / repeat request â€” NOT an answer. Do NOT save it,
            // do NOT advance, do NOT call complete_answer. We re-speak the
            // current question (or acknowledge an explain request), then fall
            // straight back into WAITING_FOR_FIRST_RESPONSE via AgentAudioDone.
            if (isClarificationRequest(trimmed)) {
              const explain = isExplainRequest(trimmed);
              log(
                `ConversationText: clarification (${explain ? "explain" : "repeat"}) â€” re-asking current question, no advance`
              );
              // Finalize as its own separate turn so it never merges into (or is
              // mistaken for) the candidate's actual answer bubble/buffer.
              store.getState().finalizeLiveUserTurn();
              store.getState().appendTurn("user", content);
              // Cancel all pending timers and clear any pending function-call ack
              // so a queued complete_answer can never fire off this request.
              clearTurnTimers();
              pendingFnIdRef.current = null;
              logVoiceEvent(
                explain ? "CLARIFICATION_REQUEST" : "REPEAT_REQUEST",
                "candidate",
                {
                  interviewId: interviewIdRef.current,
                  sequence: currentSequenceRef.current,
                }
              );
              transition(
                explain ? "OPTIONAL_CLARIFICATION" : "OPTIONAL_REPEAT",
                explain ? "clarify current question" : "repeat current question"
              );
              // reinjectCurrentQuestion resets the answer buffer + userHasSpoken,
              // guaranteeing no transcript is saved and no advance is triggered.
              reinjectCurrentQuestion(
                explain
                  ? "Sure. In other words, answer what this question is asking in your own words."
                  : "Certainly."
              );
              break;
            }

            // Real answer speech â€” the candidate is ANSWERING. Cancel the
            // "waiting for you to start" timer, accumulate into the buffer, and
            // enter USER_ANSWERING. We never interrupt here.
            clearAwaitTimer();
            answerBufferRef.current = answerBufferRef.current
              ? `${answerBufferRef.current} ${content}`
              : content;
            userHasSpokenRef.current = true;
            lastUserSpeechAtRef.current = Date.now();
            logVoiceEvent("USER_ANSWERING", "candidate", {
              interviewId: interviewIdRef.current,
              sequence: currentSequenceRef.current,
            });
            if (!advancingRef.current && !finishedRef.current) {
              transition("USER_ANSWERING", "transcript segment received");
            }
            // Append JUST the new text to the UI bubble.
            store.getState().appendLiveUserTurn(content);

            // Completion is decided primarily by the LLM's complete_answer call.
            // The silence timer below is only a FALLBACK â€” any new speech resets
            // it, so a mid-answer thinking pause can never cut the candidate off.
            if (isExplicitDone(trimmed)) {
              // They said they're finished â€” short confirm, then move on.
              scheduleSilenceFallback(EXPLICIT_DONE_MS);
            } else {
              // Measure the 5â€“8s fallback window from this last utterance.
              scheduleSilenceFallback(SILENCE_FALLBACK_MS);
            }
          } else {
            const aiText = normalize(content);
            const expectedIndex = expectedAgentSpeechTextsRef.current.findIndex(
              (expected) => {
                const expectedText = normalize(expected);
                return (
                  expectedText === aiText ||
                  expectedText.startsWith(aiText) ||
                  aiText.startsWith(expectedText)
                );
              }
            );
            if (expectedIndex >= 0) {
              currentAgentSpeechAllowedRef.current = true;
              currentAgentSpeechKindRef.current =
                expectedAgentSpeechKindsRef.current[expectedIndex] ?? "question";
              expectedAgentSpeechTextsRef.current.splice(expectedIndex, 1);
              expectedAgentSpeechKindsRef.current.splice(expectedIndex, 1);
              expectedAgentSpeechRef.current = Math.max(
                0,
                expectedAgentSpeechRef.current - 1
              );
              log("ConversationText: allowed injected AI text", content.slice(0, 80));
            } else {
              currentAgentSpeechAllowedRef.current = false;
              currentAgentSpeechKindRef.current = null;
              playerRef.current?.clear();
              log("ConversationText: blocked generated AI text", content.slice(0, 80));
            }
          }
          break;
        }

        case "UserStartedSpeaking":
          log("event: UserStartedSpeaking");
          logVoiceEvent("USER_STARTED_SPEAKING", "candidate", {
            interviewId: interviewIdRef.current,
            sequence: currentSequenceRef.current,
          });
          // Barge-in: stop any agent audio immediately.
          playerRef.current?.clear();
          agentSpeakingRef.current = false;
          // The candidate has started â€” cancel EVERY waiting/fallback timer and
          // enter USER_ANSWERING. The ConversationText handler re-arms the
          // silence fallback once we have transcript text.
          clearTurnTimers();
          if (!advancingRef.current && !finishedRef.current) {
            transition("USER_STARTED_SPEAKING", "speech activity detected");
          }
          break;

        case "AgentThinking":
          log("event: AgentThinking");
          break;

        case "AgentStartedSpeaking":
          log("event: AgentStartedSpeaking");
          agentSpeakingRef.current = true;
          clearSilenceTimer();
          if (!currentAgentSpeechAllowedRef.current) {
            currentAgentSpeechAllowedRef.current = false;
            currentAgentSpeechKindRef.current = null;
            playerRef.current?.clear();
            warn("AgentStartedSpeaking: blocked non-injected agent speech");
          }
          break;

        case "AgentAudioDone":
          log("event: AgentAudioDone, userHasSpoken =", userHasSpokenRef.current);
          const wasAllowedAgentSpeech = currentAgentSpeechAllowedRef.current;
          const speechKind = currentAgentSpeechKindRef.current;
          currentAgentSpeechAllowedRef.current = false;
          currentAgentSpeechKindRef.current = null;
          agentSpeakingRef.current = false;
          if (!wasAllowedAgentSpeech) {
            log("AgentAudioDone: ignored blocked agent speech");
            break;
          }
          if (speechKind !== "question") {
            log("AgentAudioDone: non-question speech done");
            break;
          }
          logVoiceEvent("QUESTION_SPOKEN", "voice_agent", {
            interviewId: interviewIdRef.current,
            sequence: currentSequenceRef.current,
          });
          transition("QUESTION_SPOKEN", `seq=${currentSequenceRef.current}`);
          if (!advancingRef.current && !finishedRef.current) {
            if (userHasSpokenRef.current && answerBufferRef.current.trim().length > 0) {
              // Candidate answered while the agent was still finishing â€” resume
              // USER_ANSWERING and re-arm the silence fallback.
              transition("USER_ANSWERING", "agent audio done, answer already started");
              log("AgentAudioDone: re-arming silence fallback (user has spoken)");
              scheduleSilenceFallback(SILENCE_FALLBACK_MS);
            } else {
              // Question just finished playing and the candidate hasn't started.
              // Enter WAITING_FOR_FIRST_RESPONSE: wait quietly, never repeat.
              log("AgentAudioDone: waiting for first response (no repeat)");
              scheduleFirstResponseWait();
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
            // PRIMARY completion signal. The LLM has determined the candidate
            // finished their answer, so advance â€” but only if they actually
            // spoke AND have provided a substantive answer (MIN_ANSWER_CHARS)
            // AND enough time has passed (MIN_TURN_MS). This triple-guard
            // prevents gpt-4o from firing on tiny fragments like "data," or
            // "highly" before the candidate has had a chance to answer fully.
            const bufferLen = answerBufferRef.current.trim().length;
            const turnElapsedMs = Date.now() - turnStartRef.current;
            const quietElapsedMs = lastUserSpeechAtRef.current
              ? Date.now() - lastUserSpeechAtRef.current
              : 0;
            const hasSubstantiveAnswer =
              bufferLen >= MIN_ANSWER_CHARS &&
              turnElapsedMs >= MIN_TURN_MS &&
              quietElapsedMs >= MIN_SILENCE_BEFORE_FUNCTION_MS;

            log(
              `FunctionCallRequest: complete_answer - bufferLen=${bufferLen} (min=${MIN_ANSWER_CHARS}), turnElapsed=${turnElapsedMs}ms (min=${MIN_TURN_MS}ms), quietElapsed=${quietElapsedMs}ms (min=${MIN_SILENCE_BEFORE_FUNCTION_MS}ms), userHasSpoken=${userHasSpokenRef.current}`
            );

            if (userHasSpokenRef.current && hasSubstantiveAnswer) {
              log("FunctionCallRequest: complete_answer â€” advancing (authoritative)");
              pendingFnIdRef.current = call.id;
              void advanceTurn("function_call");
            } else {
              // Answer too short / turn too new â†’ this is not a real completion.
              // Ack to keep the agent silent and keep waiting; do NOT advance.
              const reason = !userHasSpokenRef.current
                ? "candidate has not spoken yet"
                : bufferLen < MIN_ANSWER_CHARS
                  ? `answer too short (${bufferLen} < ${MIN_ANSWER_CHARS} chars)`
                  : turnElapsedMs < MIN_TURN_MS
                    ? `turn too short (${turnElapsedMs}ms < ${MIN_TURN_MS}ms)`
                    : `candidate quiet time too short (${quietElapsedMs}ms < ${MIN_SILENCE_BEFORE_FUNCTION_MS}ms)`;
              log(`FunctionCallRequest: complete_answer ignored â€” ${reason}`);
              connRef.current?.sendFunctionCallResponse({
                type: "FunctionCallResponse",
                id: call.id,
                name: COMPLETE_ANSWER_FUNCTION,
                content: JSON.stringify({
                  status: "ignored",
                  instruction:
                    "The candidate has not finished answering yet. STOP TALKING NOW. Do not say anything. Keep listening patiently until they are clearly done.",
                }),
              });
              pendingFnIdRef.current = null;
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
          // Issue #4/#7: never surface raw Deepgram protocol/timeout errors
          // (e.g. CLIENT_MESSAGE_TIMEOUT, "We waited too long…"). After the
          // interview has finished they are ignored entirely. Mid-interview
          // they map to a single friendly, non-technical message.
          if (finishedRef.current) break;
          failVoiceAgent(FRIENDLY.connectionLost);
          break;

        default:
          // Log unknown event types for debugging.
          if (msg.type) {
            log("event: (unhandled)", msg.type);
          }
          break;
      }
    },
    [
      advanceTurn,
      clearSilenceTimer,
      clearAwaitTimer,
      clearTurnTimers,
      injectQuestion,
      reinjectCurrentQuestion,
      scheduleSilenceFallback,
      scheduleFirstResponseWait,
      failVoiceAgent,
      store,
      transition,
    ]
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
      expectedAgentSpeechRef.current = 0;
      currentAgentSpeechAllowedRef.current = false;
      expectedAgentSpeechTextsRef.current = [];
      expectedAgentSpeechKindsRef.current = [];
      currentAgentSpeechKindRef.current = null;
      lastUserSpeechAtRef.current = 0;
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

      transition("CONNECTING", "starting voice session");

      // 1. Mint a short-lived access token.
      let token: string;
      try {
        log("start: fetching voice token...");
        const clientId = useInterviewStore.getState().clientId;
        const url = `${API.interviewVoiceToken}?interviewId=${interview.id}&clientId=${clientId}`;
        const res = await fetch(url);
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
        failVoiceAgent(FRIENDLY.voiceStartFailed);
        return { ok: false, error: FRIENDLY.voiceStartFailed };
      }

      // 2. Prepare playback + open the agent socket.
      const player = new PcmPlayer(AGENT_OUTPUT_SAMPLE_RATE);
      playerRef.current = player;

      const conn = new AgentConnection({
        onMessage: handleMessage,
        onAudio: (chunk) => {
          if (currentAgentSpeechAllowedRef.current) {
            player.enqueue(chunk);
          }
        },
        onClose: () => {
          log("WebSocket: onClose, finished =", finishedRef.current);
          // Issue #4: a close after finish/stop is expected and ignored. A close
          // mid-interview surfaces a friendly, non-technical message.
          if (!finishedRef.current && store.getState().state !== "REPORT_READY") {
            failVoiceAgent(FRIENDLY.connectionLost);
          }
        },
        onError: () => {
          warn("WebSocket: onError");
          if (!finishedRef.current) {
            failVoiceAgent(FRIENDLY.connectionLost);
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
        failVoiceAgent(FRIENDLY.connectionLost);
        cleanup();
        return { ok: false, error: FRIENDLY.connectionLost };
      }

      // Issue #4: tear the socket down on tab close / refresh / unload so no
      // orphaned Deepgram WebSocket is left running.
      if (typeof window !== "undefined") {
        unloadHandlerRef.current = () => cleanup();
        window.addEventListener("beforeunload", unloadHandlerRef.current);
        window.addEventListener("pagehide", unloadHandlerRef.current);
      }

      // 3. Settings must be the first frame after open.
      log("start: sending Settings");
      currentAgentSpeechAllowedRef.current = true;
      currentAgentSpeechKindRef.current = "other";
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
        failVoiceAgent(message);
        cleanup();
        return { ok: false, error: message };
      }

      return { ok: true };
    },
    [cleanup, failVoiceAgent, handleMessage, store, transition]
  );

  return { start, stop };
}
