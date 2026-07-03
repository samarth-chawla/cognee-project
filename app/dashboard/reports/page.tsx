"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import { API, ROUTES } from "@/lib/utils/constants";
import type { Report } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function ReportsPage() {
  const router = useRouter();
  const { targetRole } = useSettingsStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API.reports}?userId=demo-user`)
      .then((r) => r.json())
      .then((j) => setReports(j.data ?? []))
      .catch((e) => console.error("Failed to load reports", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-64 p-gutter w-full min-h-screen flex-1">
        <div className="max-w-[1000px] mx-auto space-y-lg pb-xxl pt-6">
          
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

          {loading ? (
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
                const { evaluation, id, createdAt } = report;
                const dateString = new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div
                    key={id}
                    className="bg-white border border-outline-variant/30 rounded-[24px] shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-outline-variant/10">
                      <div>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded tracking-wider uppercase">
                          AI Assessment
                        </span>
                        <p className="text-xs text-on-surface-variant mt-2 font-medium">{dateString}</p>
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
