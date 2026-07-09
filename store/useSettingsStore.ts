import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProvider } from "@/types";

interface SettingsState {
  provider: AIProvider;
  targetRole: string;
  voiceEnabled: boolean;
  persistentContext: boolean;
  gapAnalysis: boolean;
  weeklyGoal: number;
  setProvider: (p: AIProvider) => void;
  setTargetRole: (r: string) => void;
  setVoiceEnabled: (v: boolean) => void;
  setPersistentContext: (v: boolean) => void;
  setGapAnalysis: (v: boolean) => void;
  setWeeklyGoal: (g: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: "gemini",
      targetRole: "Software Engineer",
      voiceEnabled: true,
      persistentContext: true,
      gapAnalysis: true,
      weeklyGoal: 3,
      setProvider: (provider) => set({ provider }),
      setTargetRole: (targetRole) => set({ targetRole }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setPersistentContext: (persistentContext) => set({ persistentContext }),
      setGapAnalysis: (gapAnalysis) => set({ gapAnalysis }),
      setWeeklyGoal: (weeklyGoal) => set({ weeklyGoal }),
    }),
    { name: "ima-settings" }
  )
);
