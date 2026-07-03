"use client";

import { useCallback, useState } from "react";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { API } from "@/lib/utils/constants";
import type { Answer, Evaluation, Interview } from "@/types";

/** Client-side orchestration for running an interview. */
export function useInterview() {
  const { current, setInterview, addAnswer, next, reset } = useInterviewStore();
  const { targetRole, provider } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (payload?: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.interview, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole, provider, ...payload }),
      });
      const json = await res.json();
      
      if (!json.success && !json.ok) throw new Error(json.message || json.error);
      
      // Phase 2 Step 1 returns { interviewId, status: "GENERATING" }.
      // To prevent the UI from breaking (which expects questions), we supply a dummy question for testing.
      if (json.data?.status === "GENERATING") {
        setInterview({
          id: json.data.interviewId,
          role: targetRole,
          questions: [
            { 
              id: "temp-1", 
              sequence: 1, 
              prompt: "API called successfully! (Phase 2 Step 1). Gemini Generation will be implemented in Step 2.", 
              category: "General", 
              difficulty: "MEDIUM", 
              type: "intro" 
            }
          ]
        } as any);
      } else {
        setInterview(json.data as Interview);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  }, [targetRole, provider, setInterview]);

  const submitAnswer = useCallback(
    (answer: Answer) => {
      addAnswer(answer);
      next();
    },
    [addAnswer, next]
  );

  const finish = useCallback(async (): Promise<Evaluation | null> => {
    if (!current) return null;
    setLoading(true);
    try {
      const res = await fetch(API.evaluation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview: current, provider }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      return json.data as Evaluation;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to evaluate");
      return null;
    } finally {
      setLoading(false);
    }
  }, [current, provider]);

  return { current, loading, error, start, submitAnswer, finish, reset };
}
