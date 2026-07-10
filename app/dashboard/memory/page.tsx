"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/common/Sidebar";
import { API, ROUTES } from "@/lib/utils/constants";
import type { MemoryNode, Report } from "@/types";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  companyReadiness,
  computeStreak,
  keyImprovements,
  latestAndDelta,
  recurringPatterns,
  scoreSeries,
  strongestAndWeakestCategory,
  weeklySessionCount,
} from "@/lib/utils/memoryInsights";
import { useSettingsStore } from "@/store/useSettingsStore";

interface ProfileData {
  profile?: { targetRole?: string | null; targetCompanies?: string[] } | null;
}

interface ChecklistItem {
  id: number;
  text: string;
  checked: boolean;
}

export default function MemoryPage() {
  const router = useRouter();
  const { user } = useUser();
  const { weeklyGoal } = useSettingsStore();
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [memoryOk, setMemoryOk] = useState<boolean | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(API.memory)
      .then((r) => r.json())
      .then((j) => {
        const data = j.data;
        setNodes(Array.isArray(data) ? data : data?.nodes ?? []);
        setMemoryOk(Boolean(j.success ?? j.ok));
      })
      .catch(() => setMemoryOk(false))
      .finally(() => setLoadingNodes(false));

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((j) => setProfile(j.data ?? null))
      .catch(() => setProfile(null));

    fetch(API.reports)
      .then((r) => r.json())
      .then((j) => setReports(Array.isArray(j.data) ? j.data : []))
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false));
  }, []);

  const sortedDesc = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestReport = sortedDesc[0] ?? null;

  const checklistTexts = latestReport
    ? (latestReport.evaluation.recommendations.length > 0
        ? latestReport.evaluation.recommendations
        : ["Complete another session to keep building your profile."]
      ).slice(0, 4)
    : [];
  const checklist: ChecklistItem[] = checklistTexts.map((text, id) => ({
    id,
    text,
    checked: checkedIds.has(id),
  }));

  const toggleChecklist = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const skillExtremes = strongestAndWeakestCategory(reports);
  const patterns = recurringPatterns(reports, 2);
  const companies = companyReadiness(reports);
  const streak = computeStreak(reports);
  const weeklyCount = weeklySessionCount(reports);
  const improvements = keyImprovements(reports, 2);
  const confidenceSeries = scoreSeries(reports, "confidenceScore").slice(-8);
  const maxConfidence = Math.max(1, ...confidenceSeries.map((p) => p.value));
  const targetRole = profile?.profile?.targetRole ?? null;
  const targetCompany = profile?.profile?.targetCompanies?.[0] || companies[0]?.company || null;
  const communicationLatest = latestAndDelta(reports, "communicationScore");

  const displayName = user?.fullName || user?.firstName || "Candidate";
  const avatarUrl = user?.imageUrl;

  // True once both fetches resolve and there is nothing to display
  const isEmpty = !loadingReports && reports.length === 0;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      <Sidebar />

      <main className="w-full lg:ml-64 xl:mr-80 lg:w-[calc(100%-16rem)] xl:w-[calc(100%-36rem)] p-4 sm:p-gutter pt-20 lg:pt-6 min-h-screen flex-1 overflow-x-hidden">
        <div className="max-w-[1200px] mx-auto space-y-16 lg:space-y-xxl pb-xxl">

          {/* Header — always visible */}
          <header className="space-y-sm">
            <span className="inline-flex items-center gap-sm bg-primary-fixed text-primary font-bold text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              AI Memory
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface">Your interview journey.</h2>
            <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Your AI remembers every interview, mistake, improvement, and achievement. We turn raw experiences into a structured roadmap for your success.
            </p>
          </header>

          {/* Loading state */}
          {loadingReports && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
              <p className="text-sm text-on-surface-variant font-medium">Loading your memory profile…</p>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="p-xl rounded-[24px] bg-white shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center min-h-[480px]">
              {/* Pulsing icon */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping scale-125" />
                <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[40px]">psychology</span>
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-on-surface mb-3">No Memory Yet</h3>
              <p className="text-sm text-on-surface-variant mb-2 max-w-[420px] leading-relaxed mx-auto">
                Your AI memory builds automatically after each interview session. Complete your first practice interview and your personalised performance profile will appear here.
              </p>

              {/* Feature teaser pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-4 mb-8">
                {[
                  { icon: "trending_up", label: "Track progress over time" },
                  { icon: "pattern", label: "Detect recurring patterns" },
                  { icon: "lightbulb", label: "Get personalised tips" },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 bg-primary-fixed text-primary text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[13px]">{icon}</span>
                    {label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => router.push(ROUTES.interview)}
                className="bg-[#240A8A] text-white font-bold text-sm px-10 py-3.5 rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/20 cursor-pointer"
              >
                Start First Interview
              </button>
            </div>
          )}

          {/* Populated content */}
          {!loadingReports && !isEmpty && (
            <>
              {/* AI Memory Summary Card */}
              <section className="grid grid-cols-1 md:grid-cols-12 gap-lg bg-surface-indigo rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
                <div className="md:col-span-4 relative bg-primary flex items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-[100px] text-white opacity-90 z-10">psychology</span>
                </div>
                <div className="md:col-span-8 p-lg flex flex-col justify-center">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm font-semibold">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Target Company</p>
                      <p className="text-base text-primary">{targetCompany ?? "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Strong Skill</p>
                      <p className="text-base text-success-green">{skillExtremes?.strongest.label ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Weak Skill</p>
                      <p className="text-base text-error-red">{skillExtremes?.weakest.label ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Confidence</p>
                      <p className="text-base text-primary">{latestReport ? `${latestReport.evaluation.confidenceScore}%` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Interviews Taken</p>
                      <p className="text-base text-primary">{reports.length}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Skills & Readiness Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-lg">
                {CATEGORY_KEYS.map((key) => {
                  const { value, delta } = latestAndDelta(reports, key);
                  const isWeak = skillExtremes?.weakest.label === CATEGORY_LABELS[key];
                  return (
                    <div
                      key={key}
                      className={`bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm ${
                        skillExtremes?.strongest.label === CATEGORY_LABELS[key] ? "ai-glow" : ""
                      }`}
                    >
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">{CATEGORY_LABELS[key]}</p>
                      <div className="flex items-end justify-between">
                        <h5 className={`text-xl font-extrabold ${isWeak ? "text-error-red" : "text-primary"}`}>
                          {`${value}%`}
                        </h5>
                        {delta !== null && (
                          <span className={`font-bold text-xs ${delta >= 0 ? "text-success-green" : "text-error-red"}`}>
                            {delta >= 0 ? "+" : ""}{delta}%
                          </span>
                        )}
                      </div>
                      <div className="mt-3 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${isWeak ? "bg-error-red/40" : "bg-primary"}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Timeline & Relationship Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
                <section className="lg:col-span-7 space-y-6">
                  <h3 className="text-lg font-bold text-on-surface">Recent Sessions</h3>
                  <div className="space-y-4">
                    {sortedDesc.slice(0, 3).map((report) => {
                      const dateLabel = new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "long", day: "numeric",
                      });
                      const topWeakness = report.evaluation.weaknesses[0] ?? report.evaluation.missingTopics[0] ?? null;
                      const companyLabel = report.interviewContext?.customCompanyName || report.interviewContext?.company;
                      return (
                        <div key={report.id} className="bg-white border border-outline-variant/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow hover:border-primary/30 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{dateLabel}</span>
                              <h4 className="text-sm font-bold text-on-surface mt-1">
                                {report.interviewContext?.role ?? "Interview"}
                                {companyLabel && <span className="font-semibold text-on-surface-variant"> · {companyLabel}</span>}
                              </h4>
                              {topWeakness && (
                                <p className="text-xs text-error-red leading-relaxed font-semibold mt-1">{topWeakness}</p>
                              )}
                            </div>
                          </div>
                          <div className="w-full md:w-32 flex flex-col items-end gap-1">
                            <div className="flex justify-between w-full text-xs font-semibold">
                              <span>Score</span>
                              <span className="font-bold">{report.evaluation.overallScore}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${report.evaluation.overallScore}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="lg:col-span-5 space-y-lg">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface">Relationship Map</h3>
                    {skillExtremes ? (
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl h-80 relative overflow-hidden p-6">
                        <div className="relative h-full flex items-center justify-center">
                          <div className="absolute top-1/4 left-1/4 bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex items-center gap-2 text-xs font-bold animate-pulse">
                            <span className="w-2 h-2 bg-success-green rounded-full" /> {skillExtremes.strongest.label}
                          </div>
                          <div className="absolute bottom-1/3 left-1/3 bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex items-center gap-2 text-xs font-bold">
                            <span className="w-2 h-2 bg-error rounded-full" /> {skillExtremes.weakest.label}
                          </div>
                          <div className="absolute top-1/2 right-1/4 bg-primary text-white p-2 rounded-lg shadow-md flex items-center gap-2 text-xs font-bold">
                            <span className="w-2 h-2 bg-white rounded-full" /> {targetCompany ?? "Target Role"}
                          </div>
                          <div className="absolute bottom-1/4 right-1/3 bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex items-center gap-2 text-xs font-bold">
                            <span className="w-2 h-2 bg-success-green rounded-full" /> Communication ({communicationLatest.value}%)
                          </div>
                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                            <line stroke="#1e00a9" strokeWidth="1.5" x1="30%" x2="40%" y1="30%" y2="60%" />
                            <line stroke="#1e00a9" strokeWidth="1.5" x1="40%" x2="70%" y1="60%" y2="50%" />
                            <line stroke="#1e00a9" strokeWidth="1.5" x1="70%" x2="60%" y1="50%" y2="70%" />
                          </svg>
                        </div>
                        <p className="absolute bottom-4 left-4 text-[10px] text-on-surface-variant font-bold italic">Connecting skills to success patterns...</p>
                      </div>
                    ) : (
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 text-xs text-on-surface-variant italic">
                        Complete an interview to unlock your relationship map.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-on-surface">Confidence Journey</h3>
                    {confidenceSeries.length > 0 ? (
                      <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-end gap-2 h-32 mb-4">
                          {confidenceSeries.map((point, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 rounded-t-lg transition-all ${idx === confidenceSeries.length - 1 ? "bg-primary" : "bg-surface-container-high hover:bg-primary/20"}`}
                              style={{ height: `${Math.max(4, (point.value / maxConfidence) * 100)}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant px-1">
                          <span>Start</span>
                          <span>Current ({confidenceSeries[confidenceSeries.length - 1].value}%)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm text-xs text-on-surface-variant italic">
                        Not enough sessions yet to chart a confidence trend.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Patterns & Insights */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-on-surface">Patterns Detected</h3>
                  <div className="space-y-4">
                    {patterns.length > 0 ? (
                      patterns.map((pattern, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white border border-outline-variant/30 p-4 rounded-xl">
                          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
                            <span className="material-symbols-outlined">warning</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">{pattern.text}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Detected in {pattern.count} session{pattern.count === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-outline-variant/30 p-4 rounded-xl text-xs text-on-surface-variant italic">
                        No recurring patterns detected yet.
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-on-surface">AI Insights</h3>
                  <div className="bg-primary-container/10 border border-primary/20 p-6 rounded-2xl flex gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
                    <div>
                      <h4 className="text-base font-bold text-primary mb-1">Performance Profile</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {skillExtremes ? (
                          <>
                            You perform strongest in{" "}
                            <span className="font-bold text-primary">{skillExtremes.strongest.label}</span>{" "}
                            ({skillExtremes.strongest.value}%), with the biggest gap in{" "}
                            <span className="font-bold text-primary">{skillExtremes.weakest.label}</span>{" "}
                            ({skillExtremes.weakest.value}%) — a{" "}
                            {skillExtremes.strongest.value - skillExtremes.weakest.value}% spread in your latest session.
                          </>
                        ) : (
                          "Complete a session to unlock your performance profile."
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Company Readiness */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-on-surface">Company Readiness</h3>
                {companies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-xs font-semibold">
                    {companies.slice(0, 3).map((c) => (
                      <div key={c.company} className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="tracking-wider uppercase text-on-surface-variant">{c.company}</span>
                          <span className="font-bold text-primary">{c.average}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${c.average}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm text-xs text-on-surface-variant italic">
                    Practice with a specific company target to see readiness scores here.
                  </div>
                )}
              </section>

              {/* Structured AI Memory */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-on-surface">Structured AI Memory</h3>
                {loadingNodes ? (
                  <div className="text-sm text-on-surface-variant flex items-center gap-2 p-4">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Loading memory...
                  </div>
                ) : nodes.length > 0 ? (
                  (() => {
                    const filtered = nodes.filter(
                      (n) => n.content && n.content.trim() !== "" && !n.content.includes("Candidate ID:**")
                    );
                    const grouped: Array<{ title: string; nodes: MemoryNode[] }> = [];
                    let currentGroup: { title: string; nodes: MemoryNode[] } = { title: "Memory Facts", nodes: [] };

                    filtered.forEach((node) => {
                      if (node.content.startsWith("###")) {
                        if (currentGroup.nodes.length > 0) grouped.push(currentGroup);
                        const title = node.content
                          .replace(/^###\s*/, "")
                          .split(/(\**.*?\**)/g)
                          .map((p) => (p.startsWith("**") ? p.slice(2, -2) : p))
                          .join("");
                        currentGroup = { title, nodes: [] };
                      } else {
                        currentGroup.nodes.push(node);
                      }
                    });
                    if (currentGroup.nodes.length > 0) grouped.push(currentGroup);

                    const allowedTitles = [
                      "Recommendations from Past Interviews",
                      "Evident Skills / Knowledge",
                      "Weaknesses",
                      "Strengths",
                    ];
                    const finalGroups = grouped.filter((g) =>
                      allowedTitles.some((t) => g.title.includes(t))
                    );

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {finalGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow h-full"
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <span className="material-symbols-outlined text-primary text-xl">neurology</span>
                              <h4 className="text-base font-bold text-primary">{group.title}</h4>
                            </div>
                            <ul className="space-y-3">
                              {group.nodes.map((node, i) => {
                                const parts = node.content.split(/(\**.*?\**)/g);
                                return (
                                  <li key={i} className="flex items-start gap-3 text-sm text-on-surface font-semibold leading-relaxed">
                                    <span className="material-symbols-outlined text-primary/60 text-[16px] mt-0.5 shrink-0">
                                      arrow_right
                                    </span>
                                    <span>
                                      {parts.map((p: string, j: number) =>
                                        p.startsWith("**") && p.endsWith("**") ? (
                                          <strong key={j} className="font-extrabold text-primary">
                                            {p.slice(2, -2)}
                                          </strong>
                                        ) : (
                                          p
                                        )
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-xs text-on-surface-variant p-4 bg-white rounded-xl border border-outline-variant/20 italic">
                    No AI memory facts recalled yet.
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-outline-variant/30 p-lg overflow-y-auto hidden xl:flex flex-col gap-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-container flex items-center justify-center shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="w-full h-full object-cover" alt={displayName} src={avatarUrl} />
            ) : (
              <span className="text-sm font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant font-semibold">{targetRole ?? "Set a target role in Settings"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Weekly Goal</h4>
          <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Sessions</span>
              <span>{weeklyCount}/{weeklyGoal}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (weeklyCount / weeklyGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Key Improvements</h4>
          {improvements.length > 0 ? (
            improvements.map((imp) => (
              <div key={imp.label} className="bg-success-green/5 p-4 rounded-xl border border-success-green/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-success-green text-sm shrink-0 mt-0.5">check_circle</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {imp.label} improved by {imp.deltaPct}% since your first session.
                </p>
              </div>
            ))
          ) : (
            <div className="bg-surface-container/30 p-4 rounded-xl border border-outline-variant/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-sm shrink-0 mt-0.5">info</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Complete a few more sessions to reveal improvement trends.
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-6">
          <div className="p-3 bg-surface-indigo rounded-xl flex items-center gap-3 border border-primary/5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                memoryOk === false ? "bg-error-red" : "bg-success-green animate-pulse"
              }`}
            />
            <p className="text-[10px] text-on-surface-variant font-bold">
              {memoryOk === false ? "AI Memory unavailable" : "AI Memory syncing live..."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
