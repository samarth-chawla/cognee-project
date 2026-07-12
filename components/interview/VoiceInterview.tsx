"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { useVoiceAgentStore } from "@/store/useVoiceAgentStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import type { ConversationState } from "@/types/voiceAgent";
import type { Interview } from "@/types";
import { ROUTES } from "@/lib/utils/constants";

interface VoiceInterviewProps {
  interview: Interview;
  /** Called when the user ends/leaves the session early. */
  onExit: () => void;
}

/** UI copy + accent per conversation state (drives header pill + mic orb). */
const STATE_META: Record<
  ConversationState,
  { label: string; tone: string; orb: string }
> = {
  IDLE: { label: "Idle", tone: "text-on-surface-variant", orb: "bg-outline" },
  CONNECTING: {
    label: "Connecting…",
    tone: "text-tertiary",
    orb: "bg-tertiary",
  },
  READY: {
    label: "Connected",
    tone: "text-success-green",
    orb: "bg-success-green",
  },
  GREETING: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  WAIT_FOR_BACKEND_QUESTION: {
    label: "Preparing",
    tone: "text-tertiary",
    orb: "bg-tertiary",
  },
  QUESTION_RECEIVED: {
    label: "Preparing",
    tone: "text-tertiary",
    orb: "bg-tertiary",
  },
  SPEAK_BACKEND_QUESTION: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  QUESTION_SPOKEN: {
    label: "Listening",
    tone: "text-success-green",
    orb: "bg-success-green",
  },
  ASKING_QUESTION: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  WAITING_FOR_FIRST_RESPONSE: {
    label: "Listening",
    tone: "text-success-green",
    orb: "bg-success-green",
  },
  USER_STARTED_SPEAKING: {
    label: "Listening",
    tone: "text-success-green",
    orb: "bg-success-green",
  },
  USER_ANSWERING: {
    label: "Listening",
    tone: "text-success-green",
    orb: "bg-success-green",
  },
  OPTIONAL_REPEAT: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  OPTIONAL_CLARIFICATION: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  ANSWER_COMPLETE: {
    label: "Thinking",
    tone: "text-tertiary",
    orb: "bg-tertiary",
  },
  CALL_COMPLETE_ANSWER: { label: "Saving", tone: "text-tertiary", orb: "bg-tertiary" },
  SAVE_TRANSCRIPT: { label: "Saving", tone: "text-tertiary", orb: "bg-tertiary" },
  TRANSCRIPT_SENT: { label: "Saving", tone: "text-tertiary", orb: "bg-tertiary" },
  NEXT_QUESTION_RECEIVED: {
    label: "Preparing",
    tone: "text-tertiary",
    orb: "bg-tertiary",
  },
  ACKNOWLEDGE_RESPONSE: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  ASK_NEXT_QUESTION: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  FINAL_QUESTION: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  THANK_CANDIDATE: { label: "Wrapping up", tone: "text-primary", orb: "bg-primary" },
  WAIT_FOR_BACKEND: { label: "Wrapping up", tone: "text-tertiary", orb: "bg-tertiary" },
  EVALUATING: {
    label: "Evaluating…",
    tone: "text-tertiary",
    orb: "bg-tertiary",
  },
  REPORT_READY: {
    label: "Complete",
    tone: "text-success-green",
    orb: "bg-success-green",
  },
  ERROR: { label: "Disconnected", tone: "text-error-red", orb: "bg-error-red" },
};

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function VoiceInterview({
  interview,
  onExit,
}: VoiceInterviewProps) {
  const router = useRouter();
  const { start, stop } = useVoiceAgent();
  const { state, turns, error, currentQuestion, totalQuestions } =
    useVoiceAgentStore();

  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // End-flow dialog: null → hidden, "confirm" → "End interview?", "report" → "Generate report?"
  const [endStep, setEndStep] = useState<null | "confirm" | "report">(null);
  // Guard so the natural-completion redirect fires only once.
  const navigatedRef = useRef(false);

  // Navigate to the reports page and let it generate the report (with a loading
  // state) in the background. Clears the in-progress interview first so /interview
  // shows the setup screen on return.
  const goToReport = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    stop();
    useInterviewStore.getState().reset();
    router.push(`${ROUTES.reports}?generate=${interview.id}`);
  }, [router, stop, interview.id]);

  const meta = STATE_META[state] ?? STATE_META.IDLE;
  const isSpeaking =
    state === "GREETING" ||
    state === "SPEAK_BACKEND_QUESTION" ||
    state === "ASKING_QUESTION" ||
    state === "ACKNOWLEDGE_RESPONSE" ||
    state === "ASK_NEXT_QUESTION" ||
    state === "FINAL_QUESTION" ||
    state === "OPTIONAL_REPEAT" ||
    state === "OPTIONAL_CLARIFICATION" ||
    state === "THANK_CANDIDATE";
  const isListening =
    state === "USER_STARTED_SPEAKING" ||
    state === "USER_ANSWERING" ||
    state === "WAITING_FOR_FIRST_RESPONSE";

  // Kick off the single voice session once on mount.
  useEffect(() => {
    // In React StrictMode, effects mount/unmount twice in dev.
    // Keep startedRef as the guard so we don't start multiple voice sockets.
    if (startedRef.current) return;
    startedRef.current = true;

    // Delay start so StrictMode cleanup from the “throwaway mount” runs first.
    queueMicrotask(() => {
      void start({
        id: interview.id,
        questions: (interview.questions ?? []).map((q) => ({
          sequence: q.sequence,
          ttsTranscript: q.ttsTranscript,
          prompt: q.prompt,
        })),
      });
    });

    return () => {
      // Stop the socket created by this mount.
      stop();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Elapsed timer.
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll conversation to the newest turn.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  // Natural completion: once the candidate answers the last question the agent
  // moves to THANK_CANDIDATE. Don't make the user wait on the voice screen for
  // evaluation — play the short closing line, then redirect to the reports page
  // which generates the report in the background with a loading state.
  useEffect(() => {
    if (
      state === "THANK_CANDIDATE" ||
      state === "WAIT_FOR_BACKEND" ||
      state === "EVALUATING" ||
      state === "REPORT_READY"
    ) {
      const t = setTimeout(() => goToReport(), 2500);
      return () => clearTimeout(t);
    }
  }, [state, goToReport]);

  const progressLabel = useMemo(() => {
    if (totalQuestions === 0) return "Preparing…";
    const current = Math.min(currentQuestion || 1, totalQuestions);
    return `Question ${current} of ${totalQuestions}`;
  }, [currentQuestion, totalQuestions]);

  // "End" button → confirm dialog first (mirrors the cancel flow).
  const handleEnd = () => setEndStep("confirm");

  // User confirmed ending early → ask whether to generate a report.
  const handleConfirmEnd = () => setEndStep("report");

  // Early end, generate a report from answers given so far.
  const handleEndWithReport = () => {
    setEndStep(null);
    goToReport();
  };

  // Early end, no report — just leave the session.
  const handleEndNoReport = () => {
    setEndStep(null);
    stop();
    onExit();
  };

  const endDialog =
    endStep && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setEndStep(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-2xl bg-error-red/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error-red">
                  {endStep === "confirm" ? "logout" : "assessment"}
                </span>
              </div>

              {endStep === "confirm" ? (
                <>
                  <h2 className="text-xl font-bold text-on-surface">End interview?</h2>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Are you sure you want to end this interview now? You can still get a report on what you&apos;ve answered so far.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={() => setEndStep(null)}
                      className="py-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleConfirmEnd}
                      className="py-3 rounded-xl bg-error-red text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 cursor-pointer"
                    >
                      End Interview
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-on-surface">Generate report?</h2>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Do you want a feedback report for this interview? We&apos;ll analyze your answers and take you to the report page.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={handleEndNoReport}
                      className="py-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
                    >
                      No, just exit
                    </button>
                    <button
                      onClick={handleEndWithReport}
                      className="py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 cursor-pointer"
                    >
                      Yes, generate
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="min-h-screen h-screen bg-surface text-on-surface flex flex-col overflow-hidden">
      {endDialog}
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-gutter h-16 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-md">
          <span className="text-base md:text-lg font-bold text-primary">InterviewAI</span>
          <span className="hidden sm:inline-flex items-center gap-sm bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-sm">
              work
            </span>
            <span className="text-sm font-bold">
              {interview.role}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-md">
          <span className="text-xs font-semibold text-on-surface-variant hidden md:inline">
            {progressLabel}
          </span>
          <div className="flex items-center gap-1 md:gap-sm bg-surface-container px-2 md:px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">
              timer
            </span>
            <span className="text-xs md:text-sm font-bold tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-sm px-2 md:px-3 py-1.5 rounded-full border border-outline-variant/20">
            <span
              className={`w-2 h-2 rounded-full ${meta.orb} ${state !== "ERROR" ? "animate-pulse" : ""}`}
            />
            <span className={`hidden sm:inline text-xs font-bold ${meta.tone}`}>
              {meta.label}
            </span>
          </div>
          <button
            onClick={handleEnd}
            className="px-3 md:px-4 py-1.5 border border-error-red text-error-red rounded-lg text-xs font-bold hover:bg-error-red hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            End
          </button>
        </div>
      </header>

      {/* Conversation window */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-0 py-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {turns.length === 0 && (
            <div className="text-center text-sm text-on-surface-variant py-12">
              {state === "CONNECTING"
                ? "Connecting to your interviewer…"
                : "Your interviewer will greet you shortly."}
            </div>
          )}

          {turns.map((turn) => {
            const isAi = turn.role === "ai";
            return (
              <div
                key={turn.id}
                className={`flex ${isAi ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${
                      isAi
                        ? "bg-primary text-white"
                        : "bg-surface-container text-on-surface"
                    }`}
                  >
                    {isAi ? (
                      <span className="material-symbols-outlined text-[18px]">
                        smart_toy
                      </span>
                    ) : (
                      "You"
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-xxl text-sm leading-relaxed shadow-sm ${
                      isAi
                        ? "bg-white border border-outline-variant/30 text-on-surface"
                        : "bg-primary text-white"
                    } ${turn.live ? "opacity-70 italic" : ""}`}
                  >
                    {turn.text || (turn.live ? "…" : "")}
                  </div>
                </div>
              </div>
            );
          })}

          {error && (
            <div className="mx-auto mt-2 px-4 py-2 rounded-lg bg-error-red/10 border border-error-red/30 text-error-red text-xs font-semibold">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: mic orb + state */}
      <div className="border-t border-outline-variant/30 bg-surface/80 backdrop-blur-md py-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings when active */}
            <span
              className={`absolute inline-flex rounded-full ${meta.orb} opacity-20 ${
                isSpeaking || isListening ? "animate-ping" : ""
              }`}
              style={{ width: 72, height: 72 }}
            />
            <div
              className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${meta.orb}`}
            >
              <span className="material-symbols-outlined text-[28px]">
                {state === "ERROR"
                  ? "mic_off"
                  : isSpeaking
                    ? "graphic_eq"
                  : state === "ANSWER_COMPLETE" ||
                        state === "CALL_COMPLETE_ANSWER" ||
                        state === "SAVE_TRANSCRIPT" ||
                        state === "TRANSCRIPT_SENT" ||
                        state === "EVALUATING"
                      ? "more_horiz"
                      : "mic"}
              </span>
            </div>
          </div>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${meta.tone}`}
          >
            {meta.label}
          </span>
          {state === "REPORT_READY" && (
            <button
              onClick={() => router.push(ROUTES.reports)}
              className="mt-1 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#4338CA] transition-all active:scale-95 cursor-pointer"
            >
              View Report
            </button>
          )}
          {state === "ERROR" && (
            <button
              onClick={goToReport}
              className="mt-1 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#4338CA] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Generate latest report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
