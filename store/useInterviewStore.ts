import { create } from "zustand";
import type { Answer, Interview, InterviewQuestion } from "@/types";

interface InterviewState {
  current: Interview | null;
  currentIndex: number;
  isRecording: boolean;
  setInterview: (interview: Interview) => void;
  setCurrentIndex: (i: number) => void;
  next: () => void;
  addAnswer: (answer: Answer) => void;
  setRecording: (v: boolean) => void;
  reset: () => void;
  currentQuestion: () => InterviewQuestion | null;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  current: null,
  currentIndex: 0,
  isRecording: false,
  setInterview: (interview) => set({ current: interview, currentIndex: 0 }),
  setCurrentIndex: (i) => set({ currentIndex: i }),
  next: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  addAnswer: (answer) =>
    set((s) =>
      s.current
        ? { current: { ...s.current, answers: [...s.current.answers, answer] } }
        : {}
    ),
  setRecording: (v) => set({ isRecording: v }),
  reset: () => set({ current: null, currentIndex: 0, isRecording: false }),
  currentQuestion: () => {
    const s = get();
    return s.current?.questions?.[s.currentIndex] ?? null;

  },
}));
