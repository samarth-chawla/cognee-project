"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import { API, ROUTES } from "@/lib/utils/constants";
import type { Report } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsPageInner />
    </Suspense>
  );
}

function ReportsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const generateId = searchParams.get("generate");
  const { targetRole } = useSettingsStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  // True while we're evaluating a just-finished interview into a report.
  const [generating, setGenerating] = useState(Boolean(generateId));
  // Set when report generation fails, so we can offer a Retry button.
  const [genError, setGenError] = useState(false);
  // The interview id to (re)generate a report for, kept after the URL param is
  // cleared so Retry still works.
  const [pendingId, setPendingId] = useState<string | null>(generateId);

  async function loadReports() {
    try {
      const r = await fetch(API.reports, { cache: "no-store" });
      const j = await r.json();
      setReports(j.data ?? []);
    } catch (e) {
      console.error("Failed to load reports", e);
    }
  }

  // Generate the report for `id`. Returns true on success. The eval route is
  // idempotent + de-duplicated with /api/interview/end, so a background
  // evaluation and this call resolve to the same report.
  async function generateReport(id: string): Promise<boolean> {
    setGenerating(true);
    setGenError(false);
    try {
      const res = await fetch(API.evaluation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || (j && j.ok === false)) {
        throw new Error("generation failed");
      }
      return true;
    } catch (e) {
      console.error("Failed to generate report", e);
      setGenError(true);
      return false;
    } finally {
      setGenerating(false);
    }
  }

  const handleRetry = async () => {
    if (!pendingId) return;
    const okDone = await generateReport(pendingId);
    if (okDone) await loadReports();
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (generateId) {
        await generateReport(generateId);
        // Drop the ?generate param so a refresh doesn't re-trigger, but keep
        // pendingId in state for the Retry button.
        if (!cancelled) router.replace(ROUTES.reports);
      }

      await loadReports();
      if (!cancelled) setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateId]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] p-4 sm:p-gutter pt-20 lg:pt-6 min-h-screen flex-1">
        <div className="max-w-[1000px] mx-auto space-y-6 lg:space-y-lg pb-xxl">
          
          {/* Header Section */}
          <header className="space-y-sm mb-8">
            <span className="inline-flex items-center gap-sm bg-primary-fixed text-primary font-bold text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">analytics</span>
              Feedback Reports
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface">Your performance reports.</h2>
            <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Review detailed evaluations, criterion breakdowns, and AI-compiled tips from your mock interview sessions.
            </p>
          </header>

          {generating ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-outline-variant/30 rounded-xxl shadow-xl text-center max-w-2xl mx-auto min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Generating your report…</h3>
              <p className="text-sm text-on-surface-variant">
                We&apos;re analyzing your interview and compiling detailed feedback. This usually takes a few moments.
              </p>
            </div>
          ) : genError ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-error-red/30 rounded-xxl shadow-xl text-center max-w-2xl mx-auto min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-error-red/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-error-red text-3xl">error</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Couldn&apos;t generate your report</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Something went wrong while analyzing your interview. Your answers are saved — you can try again.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetry}
                  className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-[#4338CA] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry
                </button>
                <button
                  onClick={() => setGenError(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center p-12 text-sm text-on-surface-variant gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Loading feedback reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-outline-variant/30 rounded-xxl shadow-xl text-center max-w-2xl mx-auto min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">rate_review</span>
              </div>
              <h3 className="text-xl font-bold mb-2">No Reports Yet</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Complete your first practice session to receive a structured evaluation on communication, technical accuracy, and domain expertise.
              </p>
              <button
                onClick={() => router.push(ROUTES.interview)}
                className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-[#4338CA] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">mic</span>
                Start First Mock Session
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {reports.map((report) => {
                const { evaluation, id, createdAt, interviewContext: interview } = report;
                const dateString = new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                const companyLabel = interview?.customCompanyName || interview?.company || null;
                const durationLabel = interview?.startedAt && interview?.endedAt
                  ? `${Math.max(1, Math.round((new Date(interview.endedAt).getTime() - new Date(interview.startedAt).getTime()) / 60000))} min`
                  : null;

                return (
                  <div
                    key={id}
                    className="bg-white border border-outline-variant/30 rounded-[24px] shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-outline-variant/10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded tracking-wider uppercase">
                            AI Assessment
                          </span>
                          {interview?.difficulty && (
                            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container/60 px-2.5 py-1 rounded tracking-wider uppercase">
                              {interview.difficulty}
                            </span>
                          )}
                          {interview?.interviewType && (
                            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container/60 px-2.5 py-1 rounded tracking-wider uppercase">
                              {interview.interviewType}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold text-on-surface">
                          {interview?.role ?? "Mock Interview"}
                          {companyLabel && <span className="font-semibold text-on-surface-variant"> · {companyLabel}</span>}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-1 font-medium">
                          {dateString}{durationLabel && ` · ${durationLabel}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Score Circle Gauge */}
                        <div className="relative h-20 w-20 flex items-center justify-center">
                          <svg className="h-full w-full transform -rotate-90">
                            <circle className="text-surface-container" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6"></circle>
                            <circle
                              className="text-primary"
                              cx="40"
                              cy="40"
                              fill="transparent"
                              r="34"
                              stroke="currentColor"
                              strokeDasharray="213.6"
                              strokeDashoffset={213.6 - (213.6 * evaluation.overallScore) / 100}
                              strokeWidth="6"
                            ></circle>
                          </svg>
                          <span className="absolute text-sm font-extrabold">{evaluation.overallScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">bar_chart</span> Score Breakdown
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: "Technical", value: evaluation.technicalScore },
                          { label: "Communication", value: evaluation.communicationScore },
                          { label: "Confidence", value: evaluation.confidenceScore },
                          { label: "Behavioral", value: evaluation.behavioralScore },
                          { label: "Problem Solving", value: evaluation.problemSolvingScore },
                        ].map((item) => (
                          <div key={item.label} className="bg-surface-container/30 p-3 rounded-xl space-y-1">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-on-surface-variant">{item.label}</span>
                              <span className="text-primary font-extrabold">{item.value}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${item.value}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Question Feedback */}
                    {evaluation.questionFeedback && evaluation.questionFeedback.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">rule</span> Per-Question Feedback
                        </h4>
                        <div className="flex flex-col gap-3">
                          {evaluation.questionFeedback.map((qf, idx) => (
                            <div key={idx} className="bg-surface-container/30 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-on-surface font-bold">Q{qf.sequence}: {qf.question}</span>
                                <span className="text-primary font-extrabold">{qf.score} / 10</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${qf.score * 10}%` }}></div>
                              </div>
                              {qf.feedback && <p className="text-[11px] text-on-surface-variant leading-relaxed">{qf.feedback}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Weaknesses Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-success-green/5 p-5 rounded-2xl border border-success-green/10">
                        <p className="text-[10px] font-bold text-success-green mb-3 flex items-center gap-1 tracking-wider uppercase">
                          <span className="material-symbols-outlined text-sm fill-current">check_circle</span> Key Strengths
                        </p>
                        <ul className="space-y-2 text-xs">
                          {evaluation.strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-success-green shrink-0 mt-1.5"></span>
                              <span>{str}</span>
                            </li>
                          ))}
                          {evaluation.strengths.length === 0 && (
                            <p className="text-on-surface-variant italic">No specific strengths annotated.</p>
                          )}
                        </ul>
                      </div>

                      <div className="bg-error/5 p-5 rounded-2xl border border-error/10">
                        <p className="text-[10px] font-bold text-error-red mb-3 flex items-center gap-1 tracking-wider uppercase">
                          <span className="material-symbols-outlined text-sm">warning</span> Action Items / Weaknesses
                        </p>
                        <ul className="space-y-2 text-xs">
                          {evaluation.weaknesses.map((weak, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-error-red shrink-0 mt-1.5"></span>
                              <span>{weak}</span>
                            </li>
                          ))}
                          {evaluation.weaknesses.length === 0 && (
                            <p className="text-on-surface-variant italic">No actions points needed.</p>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Missing Topics & Recommendations */}
                    {(evaluation.missingTopics.length > 0 || evaluation.recommendations.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {evaluation.missingTopics.length > 0 && (
                          <div className="bg-surface-container/30 p-5 rounded-2xl border border-outline-variant/20">
                            <p className="text-[10px] font-bold text-on-surface-variant mb-3 flex items-center gap-1 tracking-wider uppercase">
                              <span className="material-symbols-outlined text-sm">quiz</span> Topics to Review
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {evaluation.missingTopics.map((topic, idx) => (
                                <span key={idx} className="text-[11px] font-semibold bg-white border border-outline-variant/30 px-3 py-1 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {evaluation.recommendations.length > 0 && (
                          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-bold text-primary mb-3 flex items-center gap-1 tracking-wider uppercase">
                              <span className="material-symbols-outlined text-sm">lightbulb</span> Recommendations
                            </p>
                            <ul className="space-y-2 text-xs">
                              {evaluation.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Historical Progress (only present once prior interview history exists) */}
                    {evaluation.historicalProgress && (
                      <div className="bg-secondary-fixed/30 p-5 rounded-2xl border border-outline-variant/20 space-y-3">
                        <p className="text-[10px] font-bold text-on-surface-variant mb-1 flex items-center gap-1 tracking-wider uppercase">
                          <span className="material-symbols-outlined text-sm">trending_up</span> Progress vs. Past Sessions
                        </p>
                        <p className="text-xs leading-relaxed">{evaluation.historicalProgress.overallTrend}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          {evaluation.historicalProgress.improvedAreas.length > 0 && (
                            <div>
                              <span className="font-bold text-success-green">Improved: </span>
                              {evaluation.historicalProgress.improvedAreas.join(", ")}
                            </div>
                          )}
                          {evaluation.historicalProgress.regressedAreas.length > 0 && (
                            <div>
                              <span className="font-bold text-error-red">Regressed: </span>
                              {evaluation.historicalProgress.regressedAreas.join(", ")}
                            </div>
                          )}
                          {evaluation.historicalProgress.stableStrengths.length > 0 && (
                            <div>
                              <span className="font-bold text-on-surface">Stable strengths: </span>
                              {evaluation.historicalProgress.stableStrengths.join(", ")}
                            </div>
                          )}
                          {evaluation.historicalProgress.stillNeedsImprovement.length > 0 && (
                            <div>
                              <span className="font-bold text-on-surface">Still needs work: </span>
                              {evaluation.historicalProgress.stillNeedsImprovement.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
