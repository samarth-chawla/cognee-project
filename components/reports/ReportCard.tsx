import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Report } from "@/types";

/** Summarized report entry. */
export function ReportCard({ report }: { report: Report }) {
  const { evaluation } = report;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Score: {evaluation.overallScore}/100
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-zinc-600">{evaluation.recommendations?.[0] ?? "No summary available."}</p>
        <div>
          <span className="font-medium">Strengths:</span>{" "}
          {evaluation.strengths.join(", ") || "—"}
        </div>
        <div>
          <span className="font-medium">Weaknesses:</span>{" "}
          {evaluation.weaknesses.join(", ") || "—"}
        </div>
      </CardContent>
    </Card>
  );
}
