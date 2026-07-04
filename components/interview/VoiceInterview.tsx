"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { useVoiceAgentStore } from "@/store/useVoiceAgentStore";
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
  CONNECTING: { label: "Connecting…", tone: "text-tertiary", orb: "bg-tertiary" },
  READY: { label: "Connected", tone: "text-success-green", orb: "bg-success-green" },
  GREETING: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  AI_SPEAKING: { label: "Speaking", tone: "text-primary", orb: "bg-primary" },
  USER_LISTENING: { label: "Listening", tone: "text-success-green", orb: "bg-success-green" },
  PROCESSING: { label: "Thinking", tone: "text-tertiary", orb: "bg-tertiary" },
  WAITING_FOR_BACKEND: { label: "Thinking", tone: "text-tertiary", orb: "bg-tertiary" },
  FINISHED: { label: "Wrapping up", tone: "text-primary", orb: "bg-primary" },
  EVALUATING: { label: "Evaluating…", tone: "text-tertiary", orb: "bg-tertiary" },
  REPORT_READY: { label: "Complete", tone: "text-success-green", orb: "bg-success-green" },
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

export default function VoiceInterview({ interview, onExit }: VoiceInterviewProps) {
  const router = useRouter();
  const { start, stop } = useVoiceAgent();
  const { state, turns, error, currentQuestion, totalQuestions } =
    useVoiceAgentStore();

  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const meta = STATE_META[state] ?? STATE_META.IDLE;
  const isSpeaking = state === "AI_SPEAKING" || state === "GREETING";
  const isListening = state === "USER_LISTENING";

  // Kick off the single voice session once on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start({
      id: interview.id,
      questions: (interview.questions ?? []).map((q) => ({
        sequence: q.sequence,
        ttsTranscript: q.ttsTranscript,
        prompt: q.prompt,
      })),
    });
    return () => stop();
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

  // When evaluation completes, move to the report.
  useEffect(() => {
    if (state === "REPORT_READY") {
      const t = setTimeout(() => router.push(ROUTES.reports), 1200);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const progressLabel = useMemo(() => {
    if (totalQuestions === 0) return "Preparing…";
    const current = Math.min(currentQuestion || 1, totalQuestions);
    return `Question ${current} of ${totalQuestions}`;
  }, [currentQuestion, totalQuestions]);

  const handleEnd = () => {
    stop();
    onExit();
  };

  return (
    <div className="min-h-screen h-screen bg-surface text-on-surface flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-gutter h-16 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-md">
          <span className="text-lg font-bold text-primary">InterviewAI</span>
          <span className="hidden sm:inline-flex items-center gap-sm bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-sm">work</span>
            <span className="text-sm font-bold">{interview.role} Interview</span>
          </span>
        </div>

        <div className="flex items-center gap-md">
          <span className="text-xs font-semibold text-on-surface-variant hidden md:inline">
            {progressLabel}
          </span>
          <div className="flex items-center gap-sm bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">timer</span>
            <span className="text-sm font-bold tabular-nums">{formatElapsed(elapsed)}</span>
          </div>
          <div className="flex items-center gap-sm px-3 py-1.5 rounded-full border border-outline-variant/20">
            <span className={`w-2 h-2 rounded-full ${meta.orb} ${state !== "ERROR" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-bold ${meta.tone}`}>{meta.label}</span>
          </div>
          <button
            onClick={handleEnd}
            className="px-4 py-1.5 border border-error-red text-error-red rounded-lg text-xs font-bold hover:bg-error-red hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            End
          </button>
        </div>
      </header>

      {/* Conversation window */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-0 py-8"
      >
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
                      isAi ? "bg-primary text-white" : "bg-surface-container text-on-surface"
                    }`}
                  >
                    {isAi ? (
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
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
                    : state === "PROCESSING" || state === "WAITING_FOR_BACKEND" || state === "EVALUATING"
                      ? "more_horiz"
                      : "mic"}
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${meta.tone}`}>
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
        </div>
      </div>
    </div>
  );
}
