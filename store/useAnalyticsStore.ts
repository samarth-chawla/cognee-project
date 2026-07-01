import { create } from "zustand";
import type { AnalyticsSummary } from "@/types";

interface AnalyticsState { summary: AnalyticsSummary | null; setSummary: (summary: AnalyticsSummary) => void; }
export const useAnalyticsStore = create<AnalyticsState>((set) => ({ summary: null, setSummary: (summary) => set({ summary }) }));
