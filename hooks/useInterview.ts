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
      // Call the Step 2 API to actually generate questions via Gemini
      if (json.data?.status === "GENERATING") {
        const genRes = await fetch("/api/interview/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId: json.data.interviewId }),
        });
        
        const genJson = await genRes.json();
        if (!genJson.success) throw new Error(genJson.error || "Failed to generate questions");

        // Map the generated first question into the frontend store format
        const q = genJson.data.currentQuestion;
        setInterview({
          id: genJson.data.interviewId,
          role: targetRole,
          questions: [
            { 
              id: q.id, 
              sequence: q.sequence, 
              prompt: q.displayQuestion, 
              category: q.category, 
              difficulty: q.difficulty, 
              type: q.category 
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
