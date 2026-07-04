import { create } from "zustand";

import type { ConversationState, ConversationTurn, TurnRole } from "@/types/voiceAgent";

interface VoiceAgentState {
  state: ConversationState;
  turns: ConversationTurn[];
  error: string | null;
  /** Question progress for the header (1-based current / total). */
  currentQuestion: number;
  totalQuestions: number;

  setState: (state: ConversationState) => void;
  setError: (error: string | null) => void;
  setProgress: (current: number, total: number) => void;
  /** Append a finalized turn. */
  appendTurn: (role: TurnRole, text: string) => void;
  /**
   * Upsert the trailing live user transcript bubble. Replaces the current live
   * user turn if present, otherwise appends one.
   */
  setLiveUserTurn: (text: string) => void;
  /** Promote any trailing live user bubble to a finalized turn. */
  finalizeLiveUserTurn: () => void;
  reset: () => void;
}

let turnSeq = 0;
const nextId = () => `turn-${++turnSeq}`;

export const useVoiceAgentStore = create<VoiceAgentState>((set) => ({
  state: "IDLE",
  turns: [],
  error: null,
  currentQuestion: 0,
  totalQuestions: 0,

  setState: (state) => set({ state }),
  setError: (error) => set({ error, ...(error ? { state: "ERROR" as const } : {}) }),
  setProgress: (current, total) =>
    set({ currentQuestion: current, totalQuestions: total }),

  appendTurn: (role, text) =>
    set((s) => ({
      turns: [...s.turns, { id: nextId(), role, text }],
    })),

  setLiveUserTurn: (text) =>
    set((s) => {
      const last = s.turns[s.turns.length - 1];
      if (last && last.role === "user" && last.live) {
        const updated = [...s.turns];
        updated[updated.length - 1] = { ...last, text };
        return { turns: updated };
      }
      return {
        turns: [...s.turns, { id: nextId(), role: "user", text, live: true }],
      };
    }),

  finalizeLiveUserTurn: () =>
    set((s) => {
      const last = s.turns[s.turns.length - 1];
      if (!last || last.role !== "user" || !last.live) return {};
      const updated = [...s.turns];
      updated[updated.length - 1] = { ...last, live: false };
      return { turns: updated };
    }),

  reset: () =>
    set({
      state: "IDLE",
      turns: [],
      error: null,
      currentQuestion: 0,
      totalQuestions: 0,
    }),
}));
