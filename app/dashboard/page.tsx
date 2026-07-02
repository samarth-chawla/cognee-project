"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/common/Sidebar";
import { ROUTES } from "@/lib/utils/constants";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const { targetRole } = useSettingsStore();
  const firstName = user?.firstName || user?.fullName || "there";

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md">
      {/* Sidebar */}
      <Sidebar currentRole={targetRole || "Software Engineer"} />

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 flex justify-between items-center px-xl h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search sessions, topics, or insights..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
          <button className="bg-primary text-white px-6 py-2 rounded-full text-xs font-bold transition-all hover:shadow-lg active:scale-95 cursor-pointer">
            Go Premium
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-xl grid grid-cols-12 gap-lg max-w-[1400px] mx-auto">
          {/* Left Column (Main) */}
          <div className="col-span-12 lg:col-span-9 space-y-lg">
            
            {/* Welcome Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-md py-md">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">Welcome back, {firstName}.</h2>
                <p className="text-on-surface-variant text-base mt-1">You&apos;re in the top 5% of candidates this week. Keep up the momentum!</p>
              </div>
              <div className="flex gap-xl">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-1">STREAK</p>
                  <div className="flex items-center gap-1 text-lg font-bold text-tertiary">
                    <span className="material-symbols-outlined text-tertiary fill-current text-[18px]">local_fire_department</span>
                    8 Days
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-1">INTERVIEWS</p>
                  <p className="text-lg font-bold text-on-surface">24</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-1">PRACTICE</p>
                  <p className="text-lg font-bold text-on-surface">12.5h</p>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <button
                onClick={() => router.push(ROUTES.interview)}
                className="flex items-center gap-4 p-lg rounded-2xl bg-primary text-white shadow-xl shadow-primary/10 transition-all hover:-translate-y-1 active:scale-95 group text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white group-hover:scale-110 transition-transform">mic</span>
                </div>
                <div>
                  <p className="text-base font-bold">Start Interview</p>
                  <p className="text-white/70 text-xs font-semibold">Practice now with AI</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push(ROUTES.interview)}
                className="flex items-center gap-4 p-lg rounded-2xl bg-surface-container border border-outline-variant/30 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 active:scale-95 group text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">play_arrow</span>
                </div>
                <div>
                  <p className="text-base font-bold">Continue Practice</p>
                  <p className="text-on-surface-variant text-xs font-semibold">Last: System Design</p>
                </div>
              </button>

              <button
                onClick={() => router.push(ROUTES.reports)}
                className="flex items-center gap-4 p-lg rounded-2xl bg-surface-container border border-outline-variant/30 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 active:scale-95 group text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary-container group-hover:scale-110 transition-transform">bar_chart</span>
                </div>
                <div>
                  <p className="text-base font-bold">View Reports</p>
                  <p className="text-on-surface-variant text-xs font-semibold">Check performance stats</p>
                </div>
              </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 shadow-sm">
                <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-2">READINESS</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-extrabold text-on-surface">82%</h3>
                  <div className="text-success-green flex items-center text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    4%
                  </div>
                </div>
                <div className="mt-3 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "82%" }}></div>
                </div>
              </div>

              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 shadow-sm">
                <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-2">CONFIDENCE</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-extrabold text-on-surface">78%</h3>
                  <div className="text-success-green flex items-center text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    2%
                  </div>
                </div>
                <div className="mt-3 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>

              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 shadow-sm">
                <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-2">TECHNICAL</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-extrabold text-on-surface">85%</h3>
                  <div className="text-error-red flex items-center text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">trending_down</span>
                    1%
                  </div>
                </div>
                <div className="mt-3 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 shadow-sm">
                <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mb-2">COMMUNICATION</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-extrabold text-on-surface">74%</h3>
                  <div className="text-success-green flex items-center text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    8%
                  </div>
                </div>
                <div className="mt-3 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-tertiary-container h-full rounded-full" style={{ width: "74%" }}></div>
                </div>
              </div>
            </div>

            {/* AI Memory Card */}
            <div className="p-lg rounded-3xl bg-surface-container border border-outline-variant/30 ai-glow overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row gap-lg">
                <div className="md:w-1/3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                    <h3 className="text-lg font-bold">What your AI remembers</h3>
                  </div>
                  <p className="text-on-surface-variant text-xs leading-relaxed">Based on your last 12 interviews, here&apos;s your personalized profile.</p>
                  <Link href={ROUTES.memory} className="inline-flex mt-6 text-primary font-bold text-xs items-center gap-1 hover:underline">
                    View Full Memory Timeline <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
                <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="bg-white/60 p-md rounded-2xl border border-white/50">
                    <p className="text-[10px] font-bold text-success-green mb-3 flex items-center gap-1 tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> STRENGTHS
                    </p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success-green shrink-0"></span> Deep React ecosystem knowledge</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success-green shrink-0"></span> Strong STAR method structure</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success-green shrink-0"></span> System scalability thinking</li>
                    </ul>
                  </div>
                  <div className="bg-white/60 p-md rounded-2xl border border-white/50">
                    <p className="text-[10px] font-bold text-tertiary-container mb-3 flex items-center gap-1 tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">warning</span> WEAKNESSES
                    </p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container shrink-0"></span> Dynamic Programming optimization</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container shrink-0"></span> Speaking speed when stressed</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container shrink-0"></span> Low-level design patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Interview Progress</h3>
                <div className="flex gap-md text-xs">
                  <div className="flex items-center gap-2 font-medium text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-primary"></span> Technical
                  </div>
                  <div className="flex items-center gap-2 font-medium text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-secondary"></span> Confidence
                  </div>
                </div>
              </div>
              <div className="h-48 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <path d="M0,150 Q100,140 200,160 T400,120 T600,80 T800,40" fill="none" stroke="#1e00a9" strokeLinecap="round" strokeWidth="3"></path>
                  <path d="M0,180 Q100,170 200,140 T400,130 T600,100 T800,60" fill="none" stroke="#58579b" strokeDasharray="8 4" strokeLinecap="round" strokeWidth="3"></path>
                  {/* Grid lines */}
                  <line stroke="#c7c4d8" strokeOpacity="0.2" x1="0" x2="800" y1="50" y2="50"></line>
                  <line stroke="#c7c4d8" strokeOpacity="0.2" x1="0" x2="800" y1="100" y2="100"></line>
                  <line stroke="#c7c4d8" strokeOpacity="0.2" x1="0" x2="800" y1="150" y2="150"></line>
                </svg>
                <div className="flex justify-between mt-4 text-xs text-on-surface-variant font-semibold">
                  <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span><span>Week 6</span>
                </div>
              </div>
            </div>

            {/* Recent Interviews */}
            <div className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-lg flex justify-between items-center border-b border-outline-variant/30">
                <h3 className="text-lg font-bold">Recent Interviews</h3>
                <Link href={ROUTES.reports} className="text-primary text-xs font-bold hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container/30">
                    <tr className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-lg py-4">Company</th>
                      <th className="px-lg py-4">Role</th>
                      <th className="px-lg py-4">Date</th>
                      <th className="px-lg py-4 text-center">Score</th>
                      <th className="px-lg py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-on-surface-variant">A</div>
                        JOB
                      </td>
                      <td className="px-lg py-4">SDE II (L5)</td>
                      <td className="px-lg py-4">Oct 24, 2026</td>
                      <td className="px-lg py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-success-green/10 text-success-green font-bold">88</span>
                      </td>
                      <td className="px-lg py-4">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success-green"></span> Completed</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-on-surface-variant">G</div>
                        Google
                      </td>
                      <td className="px-lg py-4">Senior Software Eng</td>
                      <td className="px-lg py-4">Oct 18, 2026</td>
                      <td className="px-lg py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">82</span>
                      </td>
                      <td className="px-lg py-4">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> Reviewed</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-on-surface-variant">U</div>
                        Uber
                      </td>
                      <td className="px-lg py-4">Fullstack Developer</td>
                      <td className="px-lg py-4">Oct 12, 2026</td>
                      <td className="px-lg py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary font-bold">71</span>
                      </td>
                      <td className="px-lg py-4">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-tertiary"></span> Needs Practice</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weak Topics Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-on-surface">DP Optimization</h4>
                  <span className="text-success-green text-xs font-bold">+12%</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Focus on bottom-up approaches for memoization efficiency.</p>
                <button
                  onClick={() => router.push(ROUTES.interview)}
                  className="mt-auto py-2 rounded-xl bg-surface-container text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Launch Module
                </button>
              </div>

              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-on-surface">System Design</h4>
                  <span className="text-success-green text-xs font-bold">+5%</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Strengthen understanding of distributed locking and consensus.</p>
                <button
                  onClick={() => router.push(ROUTES.interview)}
                  className="mt-auto py-2 rounded-xl bg-surface-container text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Launch Module
                </button>
              </div>

              <div className="p-lg rounded-2xl bg-white border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-on-surface">Confidence</h4>
                  <span className="text-tertiary text-xs font-bold">-2%</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">AI noted slight stuttering during technical roadblocks.</p>
                <button
                  onClick={() => router.push(ROUTES.reports)}
                  className="mt-auto py-2 rounded-xl bg-surface-container text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  View Feedback
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="col-span-12 lg:col-span-3 space-y-lg">
            
            {/* Circular Weekly Goal */}
            <div className="p-lg rounded-3xl bg-white border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
              <p className="text-[10px] font-bold text-on-surface-variant mb-4 self-start uppercase tracking-wider">WEEKLY GOAL</p>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-surface-container" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="10"></circle>
                  <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="72.8" strokeWidth="10"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold">4/5</span>
                  <span className="text-[10px] text-on-surface-variant font-medium">Interviews</span>
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold text-on-surface">One more to reach your goal!</p>
            </div>

            {/* Next Interview Widget */}
            <div className="p-lg rounded-3xl bg-white border border-outline-variant/30 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">UPCOMING SESSION</p>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">event</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">JOB SDE</h4>
                  <p className="text-xs text-on-surface-variant">Tomorrow, 10:00 AM</p>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-surface-indigo border border-primary/10">
                <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">AI FOCUS AREAS</p>
                <ul className="space-y-1 text-xs text-on-surface font-medium">
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">auto_awesome</span> Leadership Principles</li>
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">auto_awesome</span> Graph Traversal</li>
                </ul>
              </div>
              <button
                onClick={() => router.push(ROUTES.interview)}
                className="w-full mt-6 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#4338CA] transition-all active:scale-95 cursor-pointer"
              >
                Prepare Now
              </button>
            </div>

            {/* Recent Activities / Timeline */}
            <div className="p-lg rounded-3xl bg-white border border-outline-variant/30 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">PRACTICE TIMELINE</p>
              <div className="space-y-6 relative pl-4 border-l border-outline-variant/30">
                <div className="flex gap-4 relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-success-green border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px]">check</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Solved LC Hard #42</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px]">edit</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Mock Interview: Google</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">Yesterday</p>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-tertiary border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px]">lightbulb</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Reviewed LLD Patterns</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">Oct 26</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Suggestion Card */}
            <div className="p-lg rounded-3xl bg-tertiary text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h4 className="text-base font-bold relative z-10">Stuck on DP?</h4>
              <p className="text-xs opacity-80 mt-2 relative z-10 leading-relaxed">Our AI coach identified a pattern in your errors. Take our 15-minute &apos;Recursion to DP&apos; crash course.</p>
              <button
                onClick={() => router.push(ROUTES.interview)}
                className="mt-6 px-6 py-2 rounded-full bg-white text-tertiary font-bold text-xs transition-all group-hover:scale-105 active:scale-95 cursor-pointer"
              >
                Quick Start
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FAB for Quick Start */}
      <button
        onClick={() => router.push(ROUTES.interview)}
        className="fixed bottom-lg right-lg w-16 h-16 rounded-2xl bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </div>
  );
}
