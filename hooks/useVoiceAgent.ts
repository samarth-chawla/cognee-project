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
  SILENCE_FALLBACK_MS,
  WAITING_FIRST_RESPONSE_MS,
  buildInterviewAgentSettings,
} from "@/lib/deepgram/voice-agent/settings";
import { useVoiceAgentStore } from "@/store/useVoiceAgentStore";
import { API } from "@/lib/utils/constants";
import type { VoiceQuestion } from "@/services/voiceInterview.service";
import {
  buildVoiceAgentTransitionLog,
  type ConversationState,
} from "@/types/voiceAgent";

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
  return /(repeat|rephrase|say that again|say again|come again|didnt (hear|catch|get)|can you explain|could you explain|what do you mean|not sure what you mean|dont understand|dont get it|pardon|clarify)/.test(
    t
  );
}

/**
 * Sub-intent of a clarification: does the candidate want the question EXPLAINED
 * (rephrased) rather than simply REPEATED? Drives the spoken lead-in. Either way
 * we re-speak the same Gemini question — we have no separate paraphrase source —
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

/**
 * Short, human acknowledgements spoken before moving to the next question. The
 * agent speaks these verbatim (they are injected, not generated). Rotated so the
 * interview doesn't repeat the same word every time.
 */
const ACK_PHRASES = ["Thank you.", "Understood.", "Great.", "Got it.", "Perfect."];
let ackIndex = 0;
function pickAck(): string {
  const phrase = ACK_PHRASES[ackIndex % ACK_PHRASES.length];
  ackIndex += 1;
  return phrase;
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

  /**
   * Central state-machine transition. EVERY conversation-state change goes
   * through here so we get one structured log line per transition:
   *   [VoiceAgent] STATE <from> → <to> { from, to, seq, reason }
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
   * Agent NEVER generates the question — the backend supplies it and we inject
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
      log(
        "injectQuestion: seq =",
        question.sequence,
        leadIn ? `leadIn = "${leadIn}"` : "(no leadIn)",
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
        message,
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
    }
  }, [clearSilenceTimer, failVoiceAgent, transition]);

  /**
   * Single funnel for answer-completion (function call OR silence fallback).
   * Guarded so the two triggers never double-advance.
   */
  const advanceTurn = useCallback(
    async (trigger: "function_call" | "silence_fallback" | "no_response") => {
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
      transition("ANSWER_COMPLETE", `trigger=${trigger}`);
      transition("SAVE_TRANSCRIPT", "persisting transcript + fetching next question");

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
          log("advanceTurn: INTERVIEW COMPLETE — thanking candidate");
          transition("THANK_CANDIDATE", "final question answered");
          connRef.current?.sendInjectAgentMessage({
            type: "InjectAgentMessage",
            message:
              "Thank you for your time. That concludes today's interview. We will review your answers and prepare your evaluation report.",
            behavior: "queue",
          });
          store.getState().setProgress(totalQuestions, totalQuestions);
          // Give the closing line a moment to play, then evaluate.
          setTimeout(() => void finishInterview(), 5000);
        } else {
          log("advanceTurn: injecting next question seq =", nextQuestion.sequence);
          store.getState().setProgress(index + 1, totalQuestions);
          const isFinal = index >= totalQuestions - 1;
          // Lead-in depends on why we advanced:
          //  • no_response → the single, explicit timeout message.
          //  • otherwise  → a brief acknowledgement of their answer.
          // Either way it's ONE injected agent message that flows straight into
          // the backend-supplied question — no frontend interaction.
          const leadIn =
            trigger === "no_response"
              ? "I haven't received a response for this question, so I'll move on to the next one."
              : `${pickAck()} Moving to the next question.`;
          transition("ACKNOWLEDGE_RESPONSE", `leadIn="${leadIn}"`);
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
   * timer only rescues a stalled LLM: it fires `delayMs` (5–8s) AFTER the
   * candidate last spoke and advances then. ANY new user speech clears and
   * re-schedules it from the start (see the ConversationText handler), so
   * natural mid-answer thinking pauses never cut the candidate off — the clock
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
        log(`scheduleSilenceFallback: ${delayMs}ms of silence — advancing (fallback)`);
        void advanceTurn("silence_fallback");
      }, delayMs);
    },
    [advanceTurn, canAdvanceNow, clearSilenceTimer]
  );

  /**
   * WAITING_FOR_FIRST_RESPONSE: after a question finishes playing and the
   * candidate has NOT started speaking, wait quietly for a generous window
   * (WAITING_FIRST_RESPONSE_MS, ~20–30s) so they have time to gather their
   * thoughts. During this window we do NOT repeat the question, do NOT
   * interrupt, and do NOT advance — we simply listen. The timer exists ONLY to
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
      // Candidate never started. Never repeat the question — say the single
      // no-response message and move straight on to the next question.
      log("scheduleFirstResponseWait: no response in window — moving on with no-response message");
      void advanceTurn("no_response");
    }, WAITING_FIRST_RESPONSE_MS);
  }, [advanceTurn, clearAwaitTimer, transition]);

  /** Handle one JSON control frame from the agent. */
  const handleMessage = useCallback(
    (msg: AgentServerMessage) => {
      switch (msg.type) {
        case "Welcome":
          log("event: Welcome");
          transition("READY", "agent websocket ready");
          break;

        case "SettingsApplied": {
          log("event: SettingsApplied");
          // Greeting plays automatically; kick off Q1 right after so the agent
          // speaks it once the welcome finishes (queued).
          transition("GREETING", "greeting candidate");
          const first = questionsRef.current[0];
          if (first) {
            log("SettingsApplied: injecting first question, total =", questionsRef.current.length);
            store.getState().setProgress(1, questionsRef.current.length);
            const onlyQuestion = questionsRef.current.length === 1;
            transition(
              onlyQuestion ? "FINAL_QUESTION" : "ASKING_QUESTION",
              `first question seq=${first.sequence}`
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

            // Clarification / repeat request — NOT an answer. Do NOT save it,
            // do NOT advance, do NOT call complete_answer. We re-speak the
            // current question (or acknowledge an explain request), then fall
            // straight back into WAITING_FOR_FIRST_RESPONSE via AgentAudioDone.
            if (isClarificationRequest(trimmed)) {
              const explain = isExplainRequest(trimmed);
              log(
                `ConversationText: clarification (${explain ? "explain" : "repeat"}) — re-asking current question, no advance`
              );
              // Finalize as its own separate turn so it never merges into (or is
              // mistaken for) the candidate's actual answer bubble/buffer.
              store.getState().finalizeLiveUserTurn();
              store.getState().appendTurn("user", content);
              // Cancel all pending timers and clear any pending function-call ack
              // so a queued complete_answer can never fire off this request.
              clearTurnTimers();
              pendingFnIdRef.current = null;
              transition("ASKING_QUESTION", explain ? "clarify (rephrase)" : "repeat question");
              // reinjectCurrentQuestion resets the answer buffer + userHasSpoken,
              // guaranteeing no transcript is saved and no advance is triggered.
              reinjectCurrentQuestion(
                explain
                  ? "Sure, let me put the question another way."
                  : "Of course, let me repeat the question."
              );
              break;
            }

            // Real answer speech — the candidate is ANSWERING. Cancel the
            // "waiting for you to start" timer, accumulate into the buffer, and
            // enter USER_ANSWERING. We never interrupt here.
            clearAwaitTimer();
            answerBufferRef.current = answerBufferRef.current
              ? `${answerBufferRef.current} ${content}`
              : content;
            userHasSpokenRef.current = true;
            if (!advancingRef.current && !finishedRef.current) {
              transition("USER_ANSWERING", "transcript segment received");
            }
            // Append JUST the new text to the UI bubble.
            store.getState().appendLiveUserTurn(content);

            // Completion is decided primarily by the LLM's complete_answer call.
            // The silence timer below is only a FALLBACK — any new speech resets
            // it, so a mid-answer thinking pause can never cut the candidate off.
            if (isExplicitDone(trimmed)) {
              // They said they're finished — short confirm, then move on.
              scheduleSilenceFallback(EXPLICIT_DONE_MS);
            } else {
              // Measure the 5–8s fallback window from this last utterance.
              scheduleSilenceFallback(SILENCE_FALLBACK_MS);
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
          // The candidate has started — cancel EVERY waiting/fallback timer and
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
          break;

        case "AgentAudioDone":
          log("event: AgentAudioDone, userHasSpoken =", userHasSpokenRef.current);
          agentSpeakingRef.current = false;
          if (!advancingRef.current && !finishedRef.current) {
            if (userHasSpokenRef.current && answerBufferRef.current.trim().length > 0) {
              // Candidate answered while the agent was still finishing — resume
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
            // finished their answer, so advance now — but only if they actually
            // spoke (guards against a spurious call during a thinking pause,
            // which must NEVER complete the answer). advanceTurn sends the
            // FunctionCallResponse ack itself via pendingFnIdRef.
            if (
              userHasSpokenRef.current &&
              answerBufferRef.current.trim().length > 0
            ) {
              log("FunctionCallRequest: complete_answer — advancing (authoritative)");
              pendingFnIdRef.current = call.id;
              void advanceTurn("function_call");
            } else {
              // No answer captured yet → this is not a real completion. Ack to
              // keep the agent silent and keep waiting; do NOT advance.
              log("FunctionCallRequest: complete_answer ignored (no answer captured yet)");
              connRef.current?.sendFunctionCallResponse({
                type: "FunctionCallResponse",
                id: call.id,
                name: COMPLETE_ANSWER_FUNCTION,
                content: JSON.stringify({
                  status: "ignored",
                  instruction:
                    "The candidate has not answered yet. STOP TALKING NOW. Do not say anything. Wait in silence for them to answer.",
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
          failVoiceAgent(
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
        failVoiceAgent(message);
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
            failVoiceAgent("Voice connection closed");
          }
        },
        onError: () => {
          warn("WebSocket: onError");
          if (!finishedRef.current) {
            failVoiceAgent("Voice connection lost");
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
        failVoiceAgent(message);
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
