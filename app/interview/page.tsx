"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInterview } from "@/hooks/useInterview";
import { useInterviewStore } from "@/store/useInterviewStore";
import { nowISO } from "@/lib/utils";
import { ROUTES } from "@/constants";

export default function InterviewPage() {
  const router = useRouter();
  const { current, loading, error, start, submitAnswer, finish } = useInterview();
  const { currentIndex, currentQuestion } = useInterviewStore();
  const [answer, setAnswer] = useState("");

  const q = currentQuestion();
  const done = current && currentIndex >= current.questions.length;

  async function onNext() {
    if (!q) return;
    submitAnswer({ questionId: q.id, text: answer, createdAt: nowISO() });
    setAnswer("");
  }

  async function onFinish() {
    await finish();
    router.push(ROUTES.reports);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Interview</h1>

      {!current && (
        <Button onClick={start} disabled={loading}>
          {loading ? "Generating questions…" : "Start Interview"}
        </Button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {current && q && !done && (
        <div className="space-y-3">
          <QuestionCard
            question={q}
            index={currentIndex}
            total={current.questions.length}
            onNext={onNext}
          />
          <Input
            placeholder="Type your answer…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
      )}

      {done && (
        <Button onClick={onFinish} disabled={loading}>
          {loading ? "Evaluating…" : "Finish & Evaluate"}
        </Button>
      )}
    </div>
  );
}
