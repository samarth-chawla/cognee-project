import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProvider } from "@/types";

interface SettingsState {
  provider: AIProvider;
  targetRole: string;
  voiceEnabled: boolean;
  setProvider: (p: AIProvider) => void;
  setTargetRole: (r: string) => void;
  setVoiceEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: "gemini",
      targetRole: "Software Engineer",
      voiceEnabled: true,
      setProvider: (provider) => set({ provider }),
      setTargetRole: (targetRole) => set({ targetRole }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
    }),
    { name: "ima-settings" }
  )
);
