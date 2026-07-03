import type { Evaluation } from "@/types";
export function summarizeFeedback(evaluation: Evaluation) { return evaluation.recommendations?.[0] ?? ""; }
