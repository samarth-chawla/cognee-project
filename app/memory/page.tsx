"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import { API } from "@/lib/utils/constants";
import type { MemoryNode } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function MemoryPage() {
  const { targetRole } = useSettingsStore();
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Next steps checklist toggles
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Practice System Design: Focus on Load Balancers", checked: false },
    { id: 2, text: "Take Amazon full-length mock session", checked: false },
    { id: 3, text: "Review 'Complexity Analysis' for recent solutions", checked: false },
    { id: 4, text: "Refine behavioral answers using the STAR method", checked: false }
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const fetchMemory = (q?: string) => {
    setLoading(true);
    const url = q
      ? `${API.memory}?userId=demo-user&q=${encodeURIComponent(q)}`
      : `${API.memory}?userId=demo-user`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const data = j.data;
        setNodes(Array.isArray(data) ? data : data?.nodes ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <Sidebar currentRole={targetRole || "Software Engineer"} />

      {/* Main Content Area */}
      <main className="ml-64 mr-80 p-gutter w-full min-h-screen flex-1">
        <div className="max-w-[1200px] mx-auto space-y-xxl pb-xxl pt-6">
          {/* Header Section */}
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

          {/* Search bar */}
          <div className="flex gap-4 max-w-xl">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input
                type="text"
                placeholder="Search AI memory facts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMemory(searchQuery)}
                className="w-full bg-white border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <button
              onClick={() => fetchMemory(searchQuery)}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#4338CA] transition-all cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* AI Memory Summary Card */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-lg bg-surface-indigo rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
            <div className="md:col-span-4 relative bg-primary flex items-center justify-center min-h-[220px]">
              <span className="material-symbols-outlined text-[100px] text-white opacity-90 z-10">psychology</span>
            </div>
            <div className="md:col-span-8 p-lg flex flex-col justify-center">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm font-semibold">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Target Company</p>
                  <p className="text-base text-primary">Amazon</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Strong Skill</p>
                  <p className="text-base text-success-green">React</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Weak Skill</p>
                  <p className="text-base text-error-red">System Design</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Confidence</p>
                  <p className="text-base text-primary">81%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Interviews Taken</p>
                  <p className="text-base text-primary">12</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Streak</p>
                  <p className="text-base text-primary">8 days</p>
                </div>
              </div>
            </div>
          </section>

          {/* Layout Split: Timeline & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            {/* Main Timeline */}
            <section className="lg:col-span-7 space-y-6">
              <h3 className="text-lg font-bold text-on-surface">Experience Log & Memory Nodes</h3>
              
              <div className="relative pl-8 space-y-6 border-l border-outline-variant/30">
                {/* Dynamically Loaded Memory Nodes */}
                {loading ? (
                  <div className="text-sm text-on-surface-variant flex items-center gap-2 p-4">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Loading timeline...
                  </div>
                ) : nodes.length > 0 ? (
                  nodes.map((node, idx) => (
                    <div key={node.id || idx} className="relative group">
                      <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-primary-container text-white border-4 border-background flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px]">neurology</span>
                      </div>
                      <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{node.kind || "FACT"}</span>
                        <p className="mt-2 text-sm text-on-surface font-semibold">{node.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-on-surface-variant p-4 bg-white rounded-xl border border-outline-variant/20 italic">
                    No active runtime database nodes found. Below are your localized milestone logs.
                  </div>
                )}

                {/* Static Milestone Items */}
                <div className="relative group">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-surface-container-highest border-4 border-background flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-primary">history</span>
                  </div>
                  <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">June 10</span>
                    <h4 className="text-sm font-bold text-on-surface mt-1">First Interview</h4>
                    <div className="mt-3 flex gap-4 text-xs font-semibold">
                      <span className="bg-surface-container-high px-2 py-1 rounded">Score: 62%</span>
                      <span className="bg-error-container text-on-error-container px-2 py-1 rounded">Weak in hooks</span>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-primary-container border-4 border-background flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-on-primary-container">trending_up</span>
                  </div>
                  <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">June 15</span>
                    <h4 className="text-sm font-bold text-on-surface mt-1">Second Interview</h4>
                    <p className="mt-2 text-xs text-success-green font-bold">+8% Confidence Boost</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-surface-container-highest border-4 border-background flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-primary">apartment</span>
                  </div>
                  <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">June 22</span>
                    <h4 className="text-sm font-bold text-on-surface mt-1">Amazon Mock Session</h4>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Overall Score</span>
                        <span className="font-bold">78%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "78%" }}></div>
                      </div>
                      <p className="text-xs text-error-red leading-relaxed font-semibold">Critical weakness identified in System Design scalability.</p>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px]">star</span>
                  </div>
                  <div className="bg-primary text-white p-6 rounded-2xl shadow-lg transform group-hover:scale-[1.01] transition-transform">
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">July 1</span>
                    <h4 className="text-sm font-bold mt-1">Confidence Milestone: 81%</h4>
                    <p className="mt-2 text-xs opacity-90 leading-relaxed">
                      Communication significantly improved. AI detected consistent professional phrasing and clear structure in technical explanations.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Memory Graph & Patterns */}
            <section className="lg:col-span-5 space-y-lg">
              {/* Memory Graph Visualizer */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-on-surface">Relationship Map</h3>
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl h-80 relative overflow-hidden p-6">
                  <div className="relative h-full flex items-center justify-center">
                    <div className="absolute top-1/4 left-1/4 bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex items-center gap-2 text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 bg-primary rounded-full"></span> React
                    </div>
                    <div className="absolute bottom-1/3 left-1/3 bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex items-center gap-2 text-xs font-bold">
                      <span className="w-2 h-2 bg-error rounded-full"></span> System Design
                    </div>
                    <div className="absolute top-1/2 right-1/4 bg-primary text-white p-2 rounded-lg shadow-md flex items-center gap-2 text-xs font-bold">
                      <span className="w-2 h-2 bg-white rounded-full"></span> Amazon
                    </div>
                    <div className="absolute bottom-1/4 right-1/3 bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex items-center gap-2 text-xs font-bold">
                      <span className="w-2 h-2 bg-success-green rounded-full"></span> Communication
                    </div>
                    
                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                      <line stroke="#1e00a9" strokeWidth="1.5" x1="30%" x2="40%" y1="30%" y2="60%"></line>
                      <line stroke="#1e00a9" strokeWidth="1.5" x1="40%" x2="70%" y1="60%" y2="50%"></line>
                      <line stroke="#1e00a9" strokeWidth="1.5" x1="70%" x2="60%" y1="50%" y2="70%"></line>
                    </svg>
                  </div>
                  <p className="absolute bottom-4 left-4 text-[10px] text-on-surface-variant font-bold italic">Connecting skills to success patterns...</p>
                </div>
              </div>

              {/* Growth Charts */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-on-surface">Confidence Journey</h3>
                <div className="bg-white border border-outline-variant/30 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-end gap-2 h-32 mb-4">
                    <div className="flex-1 bg-surface-container-high rounded-t-lg transition-all hover:bg-primary/20" style={{ height: "60%" }}></div>
                    <div className="flex-1 bg-surface-container-high rounded-t-lg transition-all hover:bg-primary/20" style={{ height: "65%" }}></div>
                    <div className="flex-1 bg-surface-container-high rounded-t-lg transition-all hover:bg-primary/20" style={{ height: "62%" }}></div>
                    <div className="flex-1 bg-surface-container-high rounded-t-lg transition-all hover:bg-primary/20" style={{ height: "70%" }}></div>
                    <div className="flex-1 bg-surface-container-high rounded-t-lg transition-all hover:bg-primary/20" style={{ height: "78%" }}></div>
                    <div className="flex-1 bg-primary rounded-t-lg transition-all" style={{ height: "81%" }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-on-surface-variant px-1">
                    <span>Start</span>
                    <span>Current (81%)</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Skills & Readiness Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm ai-glow">
              <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">React Evolution</p>
              <div className="flex items-end justify-between">
                <h5 className="text-xl font-extrabold text-primary">90%</h5>
                <span className="text-success-green font-bold text-xs">+12%</span>
              </div>
              <div className="mt-3 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "90%" }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">JavaScript Core</p>
              <div className="flex items-end justify-between">
                <h5 className="text-xl font-extrabold text-primary">85%</h5>
                <span className="text-success-green font-bold text-xs">+5%</span>
              </div>
              <div className="mt-3 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "85%" }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">System Design</p>
              <div className="flex items-end justify-between">
                <h5 className="text-xl font-extrabold text-error-red">55%</h5>
                <span className="text-error-red font-bold text-xs">-2%</span>
              </div>
              <div className="mt-3 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-error-red/40" style={{ width: "55%" }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Communication</p>
              <div className="flex items-end justify-between">
                <h5 className="text-xl font-extrabold text-primary">78%</h5>
                <span className="text-success-green font-bold text-xs">+18%</span>
              </div>
              <div className="mt-3 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "78%" }}></div>
              </div>
            </div>
          </section>

          {/* Patterns & Insights */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-on-surface">Patterns Detected</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white border border-outline-variant/30 p-4 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Misses edge cases</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Detected in 4 recent sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white border border-outline-variant/30 p-4 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Doesn&apos;t discuss complexity</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Repeated 4 times</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-on-surface">AI Insights</h3>
              <div className="bg-primary-container/10 border border-primary/20 p-6 rounded-2xl flex gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
                <div>
                  <h4 className="text-base font-bold text-primary mb-1">Performance Profile</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    You perform significantly better in <span className="font-bold text-primary">frontend interviews</span>. Your confidence scores are 24% higher when discussing DOM optimization compared to backend architectural patterns.
                  </p>
                  <button className="mt-4 text-primary font-bold text-xs hover:underline cursor-pointer">View full analysis →</button>
                </div>
              </div>
            </div>
          </section>

          {/* Company Readiness */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface">Company Readiness</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-xs font-semibold">
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tracking-wider uppercase text-on-surface-variant">Amazon</span>
                  <span className="font-bold text-primary">82%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "82%" }}></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tracking-wider uppercase text-on-surface-variant">Google</span>
                  <span className="font-bold text-on-surface-variant">68%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-outline" style={{ width: "68%" }}></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tracking-wider uppercase text-on-surface-variant">Microsoft</span>
                  <span className="font-bold text-on-surface-variant">74%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-outline" style={{ width: "74%" }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Next Steps Checklist */}
          <section className="bg-inverse-surface text-inverse-on-surface p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">task_alt</span>
              <h3 className="text-xl font-bold">ARIA-Generated Next Steps</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    item.checked
                      ? "bg-white/10 border-white/20 opacity-50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className={`material-symbols-outlined ${item.checked ? "text-primary-fixed-dim" : "opacity-40"}`}>
                    {item.checked ? "check_box" : "check_box_outline_blank"}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Right Sidebar: Profile & Streak */}
      <aside className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-outline-variant/30 p-lg overflow-y-auto hidden xl:flex flex-col gap-6">
        {/* User Profile */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-container flex items-center justify-center shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Alex Chen"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvaLOmMAefNgG3cj6s-UlifTb98lzvdDkfh53FgyvxujnQTpTi620VjDXAWDUoa2NLJ4DXRHcFrXYTi5SJBn3ovp3EEmY_TfwxEiK0b0TI0gXpVmBoPYXI8FYOPhSs44KN4mfzn7-yeVmpwqiuxvaioCQ5owHM20235cbyZK1ZhiQh3zErD9NdDLBlxdPCPgkunfrfv90HatQkbJH3T4iH5ZKkq_pV3_qzdpEyLrQ_QTnDSo850UeKxKlBniqVCCJG8DiOjlTc4Sxn"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Alex Chen</p>
            <p className="text-[10px] text-on-surface-variant font-semibold">Senior Frontend Lead Prep</p>
          </div>
        </div>

        {/* Streak Widget */}
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Active Streak</h4>
            <span className="material-symbols-outlined text-primary text-sm">local_fire_department</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-extrabold text-primary">8</p>
            <p className="text-xs text-on-surface-variant font-semibold">Days of growth</p>
          </div>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex-1 h-1 bg-primary rounded-full"></div>
            ))}
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Weekly Goal</h4>
          <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Mock Sessions</span>
              <span>3/5</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "60%" }}></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>New Topics</span>
              <span>1/2</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "50%" }}></div>
            </div>
          </div>
        </div>

        {/* Key Improvements */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Key Improvements</h4>
          <div className="bg-success-green/5 p-4 rounded-xl border border-success-green/10 flex items-start gap-3">
            <span className="material-symbols-outlined text-success-green text-sm shrink-0 mt-0.5">check_circle</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">Structured behavioral storytelling improved by 40%.</p>
          </div>
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">bolt</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">Average response time for coding challenges reduced by 4 mins.</p>
          </div>
        </div>

        {/* AI Status */}
        <div className="mt-auto pt-6">
          <div className="p-3 bg-surface-indigo rounded-xl flex items-center gap-3 border border-primary/5">
            <div className="w-2.5 h-2.5 bg-success-green rounded-full animate-pulse"></div>
            <p className="text-[10px] text-on-surface-variant font-bold">AI Memory syncing live...</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
