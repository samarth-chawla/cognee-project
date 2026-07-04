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

  /** Cancel current interview: marks DB row ABORTED then clears local state. */
  const cancel = useCallback(async () => {
    const interviewId = useInterviewStore.getState().current?.id;
    reset(); // clear UI immediately — don't await
    if (interviewId) {
      try {
        await fetch(API.interviewCancel, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId }),
        });
      } catch {
        // best-effort — start will abort stale rows anyway
      }
    }
  }, [reset]);

  const mapGeneratedQuestion = (question: any, index: number) => ({
    id: question.id || `generated-${index + 1}`,
    sequence: question.sequence ?? index + 1,
    type: question.type || question.category?.toLowerCase?.() || "technical",
    prompt: question.prompt || question.displayQuestion || "",
    ttsTranscript: question.ttsTranscript || question.prompt || question.displayQuestion || "",
    expectedPoints: question.expectedDiscussion ? [question.expectedDiscussion] : [],
    difficulty: question.difficulty?.toLowerCase?.() || "medium",
  });


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

        const generatedQuestions = Array.isArray(genJson.data?.questions)
          ? genJson.data.questions
          : genJson.data?.currentQuestion
            ? [genJson.data.currentQuestion]
            : [];

        setInterview({
          id: genJson.data.interviewId,
          role: targetRole,
          status: "in_progress" as any,
          questions: generatedQuestions.map(mapGeneratedQuestion) as any,
          answers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
    async (answer: Answer) => {
      if (!current) return;

      const res = await fetch(API.interviewAnswer, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: current.id,
          sequence: answer.sequence,
          transcript: answer.text,
          durationSec: answer.durationSec ?? 0,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to save answer");
      }

      addAnswer(answer);
      next();
    },
    [addAnswer, current, next]
  );

  const finish = useCallback(async (): Promise<Evaluation | null> => {
    if (!current) return null;
    setLoading(true);
    try {
      const res = await fetch(API.interviewEnd, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: current.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Evaluation;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to evaluate");
      return null;
    } finally {
      setLoading(false);
    }
  }, [current]);

  return { current, loading, error, start, submitAnswer, finish, reset, cancel };

}
