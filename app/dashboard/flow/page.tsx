"use client";

import Link from "next/link";
import Sidebar from "@/components/common/Sidebar";
import { ROUTES } from "@/lib/utils/constants";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function FlowPage() {
  const { targetRole } = useSettingsStore();

  const steps = [
    {
      step: 1,
      title: "Candidate Profile & Setup",
      icon: "person_pin",
      color: "bg-primary/10 text-primary border-primary/20",
      desc: "User inputs target role, experience, and uploads resume. Data stores into settings.",
      items: ["Target Role", "Experience Level", "Resume parsing"]
    },
    {
      step: 2,
      title: "Memory Graph Retrieval",
      icon: "neurology",
      color: "bg-secondary/10 text-secondary border-secondary/20",
      desc: "Cognee retrieves candidate's past interview records, weak topics, and active strengths.",
      items: ["Retrieve past weaknesses", "Confidence vectors", "Focus alignment"]
    },
    {
      step: 3,
      title: "Context-Aware Generation",
      icon: "auto_awesome",
      color: "bg-tertiary/10 text-tertiary border-tertiary/20",
      desc: "AI Interviewer (ARIA) dynamically constructs custom questions targeted to the role.",
      items: ["Syllabus curation", "Topic coverage selection", "Question complexity check"]
    },
    {
      step: 4,
      title: "Active Live Simulation",
      icon: "mic",
      color: "bg-success-green/10 text-success-green border-success-green/20",
      desc: "Interactive session runs. Waveform animates response length, pacing, and transcribes live.",
      items: ["WebGL Waveform monitoring", "Filler word tracking", "Prompt progression"]
    },
    {
      step: 5,
      title: "Assessment & Scoring",
      icon: "analytics",
      color: "bg-primary/10 text-primary border-primary/20",
      desc: "Agent grades response technicality, communication clarity, and logic structures (0-10).",
      items: ["Overall session score", "Strengths mapping", "Criteria assessment"]
    },
    {
      step: 6,
      title: "Memory Write-back & Sync",
      icon: "cloud_sync",
      color: "bg-secondary/10 text-secondary border-secondary/20",
      desc: "New weaknesses and improvements are committed back to the persistent graph database.",
      items: ["Memory node updates", "Next steps checklist", "Readiness score adjustment"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <Sidebar currentRole={targetRole || "Software Engineer"} />

      {/* Main Content Area */}
      <main className="ml-64 p-gutter w-full min-h-screen flex-1">
        <div className="max-w-[1000px] mx-auto space-y-lg pb-xxl pt-6">
          {/* Header Section */}
          <header className="space-y-sm mb-8">
            <span className="inline-flex items-center gap-sm bg-primary-fixed text-primary font-bold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">route</span>
              System Architecture
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface">AI Agentic feedback loops.</h2>
            <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Explore how the Interview Memory Agent orchestrates session configs, retrieves database memory, evaluates answers, and writes back persistent growth patterns.
            </p>
          </header>

          {/* Interactive Flow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {steps.map((item, idx) => (
              <div
                key={item.step}
                className="bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between"
              >
                {/* Connector Line Mockup */}
                {idx < steps.length - 1 && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-dashed bg-outline-variant/40 hidden md:block z-0"></div>
                )}
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary bg-primary-fixed px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Step {item.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.color}`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-on-surface">{item.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/15">
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((lbl, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-semibold rounded-md border border-outline-variant/10"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flow Insights Card */}
          <section className="bg-surface-indigo border border-primary/20 p-6 md:p-8 rounded-xxl shadow-sm flex flex-col md:flex-row items-center gap-6 mt-12">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg text-white">
              <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-primary">Persistence & Vector Alignment</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                By integrating Cognee&apos;s semantic graph layouts, the AI Interviewer continuously maps your tech stacks against target corporate rubrics. This ensures that every next session targets the exact areas you struggled with previously.
              </p>
              <Link href={ROUTES.interview} className="inline-flex text-primary font-bold text-xs items-center gap-1 hover:underline mt-2 cursor-pointer">
                Launch Practice Session Now <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
