"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types";

interface Props {
  question: Question;
  index: number;
  total: number;
  onNext?: () => void;
}

/** Displays a single interview question. */
export function QuestionCard({ question, index, total, onNext }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide text-zinc-500">
          {question.type} · Question {index + 1} / {total}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg">{question.prompt}</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onNext}>Next</Button>
      </CardFooter>
    </Card>
  );
}
