"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/common/Sidebar";
import { ROUTES } from "@/lib/utils/constants";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function DashboardPage() {
  const router = useRouter();
  const { weeklyGoal, setWeeklyGoal } = useSettingsStore();
  const { user, isLoaded: isUserLoaded } = useUser();
  const firstName = user?.firstName || user?.fullName || "User";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!isUserLoaded || !user) return;
      try {
        setLoading(true);
        setError(null);

        const profileRaw = await fetch("/api/user/profile");
        if (!profileRaw.ok) {
          const errText = await profileRaw.text();
          throw new Error(`Failed to load profile: ${profileRaw.status} ${errText}`);
        }
        const profileRes = await profileRaw.json();
        const fetchedProfile = profileRes.data;
        setProfileData(fetchedProfile);

        const dbUserId = fetchedProfile.user.id;

        const [analyticsRaw, historyRaw, memoryRaw] = await Promise.all([
          fetch(`/api/analytics?userId=${dbUserId}`),
          fetch(`/api/interview/history?userId=${dbUserId}`),
          fetch(`/api/memory/insights?userId=${dbUserId}&q=strengths weaknesses focus`),
        ]);

        const analyticsRes = analyticsRaw.ok ? await analyticsRaw.json() : null;
        const historyRes = historyRaw.ok ? await historyRaw.json() : null;
        const memoryRes = memoryRaw.ok ? await memoryRaw.json() : null;

        setAnalyticsData(analyticsRes?.ok ? analyticsRes.data : null);
        setHistoryData(historyRes?.ok ? historyRes.data : []);
        setMemoryData(memoryRes?.ok ? memoryRes.data : null);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  if (!isUserLoaded || loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface font-body-md">
        <Sidebar profileLoaded={false} />
        <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen flex items-center justify-center w-full lg:w-[calc(100%-16rem)]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            <p className="text-on-surface-variant font-medium">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface text-on-surface font-body-md">
        <Sidebar profileLoaded={false} />
        <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen flex items-center justify-center w-full lg:w-[calc(100%-16rem)]">
          <div className="p-xl bg-white border border-outline-variant/30 rounded-3xl shadow-sm text-center max-w-[28rem] w-full mx-4">
            <div className="w-16 h-16 bg-error-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error-red text-[32px]">error</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform cursor-pointer">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Derive metrics
  const totalInterviews = historyData.length;
  const averageScore = analyticsData?.averageScore || (totalInterviews > 0 ? Math.round(historyData.reduce((acc, h) => acc + (h.evaluation?.overallScore || 0), 0) / totalInterviews) : 0);

  const getScore = (key: string) => {
    if (!historyData || historyData.length === 0) return null;
    let total = 0;
    let count = 0;
    historyData.forEach((h: any) => {
      const score = h.evaluation?.[key];
      if (typeof score === 'number') {
        total += score;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : null;
  };

  const readinessScore = getScore("readinessScore") || averageScore;
  const technicalScore = getScore("technicalScore");
  const communicationScore = getScore("communicationScore");
  const confidenceScore = getScore("confidenceScore");

  let currentStreak = totalInterviews > 0 ? 1 : 0; // Backend doesn't return streak, mock 1 if history exists

  const profile = profileData?.profile || {};
  const currentRole = profile.targetRole || "Software Engineer";

  // Check locks
  const hasHistory = totalInterviews > 0;

  // Removed separate empty state block to render main dashboard for 0 interviews

  const memoryNodes = memoryData?.nodes || [];
  let strengths = memoryNodes.filter((n: any) => n.type === "strength" || n.label === "strength").slice(0, 3);
  let weaknesses = memoryNodes.filter((n: any) => n.type === "weakness" || n.label === "weakness").slice(0, 3);

  if (strengths.length === 0 && weaknesses.length === 0 && historyData.length > 0) {
    const recentReport = historyData[0]?.evaluation;
    if (recentReport) {
      strengths = (recentReport.strengths || []).slice(0, 3).map((s: string) => ({ text: s }));
      weaknesses = (recentReport.weaknesses || []).slice(0, 3).map((w: string) => ({ text: w }));
    }
  }

  const chartData = historyData.length > 0 ? historyData.slice(0, 7).reverse().map((h: any) => h.evaluation?.overallScore || 0) : [];
  const trend = chartData.length > 1 ? chartData[chartData.length - 1] - chartData[chartData.length - 2] : null;

  const hasMemory = strengths.length > 0 || weaknesses.length > 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-on-surface font-body-md">
      <Sidebar
        githubUrl={profile.githubUrl}
        linkedinUrl={profile.linkedinUrl}
        profileLoaded={true}
      />


      <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] lg:pt-3 pt-20 min-h-screen">
        <div className="p-4 md:p-xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-xl max-w-[1400px] mx-auto">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-9 space-y-xl">

            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md py-2">
              <div>
                <h2 className="text-3xl font-extrabold text-on-surface">Welcome back, {firstName}.</h2>
                <p className="text-on-surface-variant text-sm mt-1 font-medium">Ready to tackle your next session?</p>
              </div>
              <div className="flex items-center gap-8 bg-white p-3 rounded-2xl">

                <div className="text-center flex flex-col items-center">
                  <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">INTERVIEWS</p>
                  <p className="text-base font-extrabold text-on-surface">{totalInterviews}</p>
                </div>
                {/* <div className="h-8 w-[1px] bg-outline-variant/30"></div>
                <div className="text-center flex flex-col items-center">
                  <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">PRACTICE</p>
                  <p className="text-base font-extrabold text-on-surface">{Math.max(1, totalInterviews * 1.5)}h</p>
                </div> */}
              </div>
            </section>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <button
                onClick={() => router.push(ROUTES.interview)}
                className="flex items-center gap-4 p-5 rounded-[20px] bg-[#240A8A] text-white transition-all hover:opacity-90 active:scale-95 group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px] group-hover:scale-110 transition-transform">mic</span>
                </div>
                <div>
                  <p className="text-base font-bold">Start<br />Interview</p>
                  <p className="text-white/70 text-[10px] mt-1 font-semibold">Practice now with AI</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center gap-4 p-5 rounded-[20px] bg-[#F5F5FA] border border-transparent hover:border-outline-variant/30 transition-all active:scale-95 group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E8E8F8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#7373C3] text-[20px] group-hover:rotate-45 transition-transform">settings</span>
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Update<br />Profile</p>
                  <p className="text-on-surface-variant text-[10px] mt-1 font-semibold">Adjust role & goals</p>
                </div>
              </button>

              <button
                onClick={() => router.push(ROUTES.reports)}
                className="flex items-center gap-4 p-5 rounded-[20px] bg-[#F5F5FA] border border-transparent hover:border-outline-variant/30 transition-all active:scale-95 group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F0E6DD] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#A67C52] text-[20px] group-hover:scale-110 transition-transform">bar_chart</span>
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">View<br />Reports</p>
                  <p className="text-on-surface-variant text-[10px] mt-1 font-semibold">Check performance stats</p>
                </div>
              </button>
            </div>

            {/* Dashboard Content */}
            {hasHistory ? (
              <>
                {/* Top Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
              <div className="p-4 rounded-2xl bg-white shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">READINESS</p>
                <h3 className="text-xl font-extrabold text-on-surface">{readinessScore !== null ? `${readinessScore}%` : "—"}</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">TECHNICAL</p>
                <h3 className="text-xl font-extrabold text-on-surface">{technicalScore !== null ? `${technicalScore}%` : "—"}</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">COMMUNICATION</p>
                <h3 className="text-xl font-extrabold text-on-surface">{communicationScore !== null ? `${communicationScore}%` : "—"}</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">CONFIDENCE</p>
                <h3 className="text-xl font-extrabold text-on-surface">{confidenceScore !== null ? `${confidenceScore}%` : "—"}</h3>
              </div>
            </div>

            {/* Two Column Grid for Memory and Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              
              {/* AI Memory Card (Half Width) */}
              <div className="p-6 rounded-[24px] bg-[#F9F9FC] border border-outline-variant/20 flex flex-col h-full relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold">AI Memory</h3>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold">Personalized Profile</p>
                    </div>
                  </div>
                  <button onClick={() => router.push('/dashboard/memory')} className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer">
                    View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  {hasMemory ? (
                    <>
                      {strengths.length > 0 && (
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/20">
                          <p className="text-[10px] font-bold text-success-green mb-2 flex items-center gap-1 tracking-wider uppercase">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Strengths
                          </p>
                          <ul className="space-y-1.5 text-xs">
                            {strengths.slice(0, 2).map((s: any, i: number) => (
                              <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 mt-1.5 rounded-full bg-success-green shrink-0"></span> <span className="line-clamp-1">{s.text || s.id}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {weaknesses.length > 0 && (
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/20">
                          <p className="text-[10px] font-bold text-[#D95B5B] mb-2 flex items-center gap-1 tracking-wider uppercase">
                            <span className="material-symbols-outlined text-[14px]">warning</span> Focus Areas
                          </p>
                          <ul className="space-y-1.5 text-xs">
                            {weaknesses.slice(0, 2).map((w: any, i: number) => (
                              <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 mt-1.5 rounded-full bg-[#D95B5B] shrink-0"></span> <span className="line-clamp-1">{w.text || w.id}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <span className="material-symbols-outlined text-outline-variant text-[32px] mb-2">memory</span>
                      <p className="text-sm text-on-surface-variant max-w-[200px]">Complete an interview to generate insights.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Chart (Half Width) */}
              <div className="p-6 rounded-[24px] bg-white shadow-sm border border-outline-variant/20 flex flex-col justify-between h-full group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F5FA] rounded-full flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[#240A8A] text-[20px]">trending_up</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Progress</h3>
                      {trend !== null ? (
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${trend >= 0 ? 'text-[#240A8A]' : 'text-[#D95B5B]'}`}>
                          {trend >= 0 ? '+' : ''}{trend}% this week
                        </p>
                      ) : (
                        <p className="text-[#240A8A] text-[10px] uppercase tracking-wider font-semibold">Latest Score</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => router.push('/dashboard/reports')} className="text-xs font-bold text-[#240A8A] hover:bg-[#240A8A]/5 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer">
                    Full Report <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
                
                <div className="flex-1 flex items-end justify-between gap-1 sm:gap-3 pt-2 h-[120px]">
                  {chartData.length > 0 ? (
                    chartData.map((height: number, i: number) => (
                      <div key={i} className="relative flex-1 group/bar h-full flex flex-col justify-end">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#151515] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {height}%
                        </div>
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 hover:opacity-80 ${i === chartData.length - 1 ? 'bg-[#240A8A]' : 'bg-[#E8E8F8]'}`} 
                          style={{ height: `${height}%`, minHeight: '10%' }}
                        ></div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex items-center justify-center h-full">
                      <p className="text-sm text-on-surface-variant">No data yet</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Recent Interviews */}
            <div className="bg-white border border-outline-variant/20 rounded-[24px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-outline-variant/20">
                <h3 className="text-base font-bold">Recent Interviews</h3>
              </div>

              {historyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F9F9FC]">
                      <tr className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {historyData.slice(0, 5).map((report: any) => (
                        <tr key={report.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4 font-semibold text-on-surface">Interview</td>
                          <td className="px-6 py-4 text-on-surface-variant text-xs">{new Date(report.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-center">
                            {report.evaluation?.overallScore ? (
                              <span className="px-3 py-1 rounded-full bg-[#E8E8F8] text-[#240A8A] font-bold text-xs">{report.evaluation.overallScore}</span>
                            ) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-success-green"></span> Completed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <p className="text-sm text-on-surface-variant mb-4 font-medium">No interview history yet</p>
                  <button onClick={() => router.push(ROUTES.interview)} className="bg-[#240A8A] text-white font-bold text-xs px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">Start First Interview</button>
                </div>
              )}
            </div>
            
              </>
            ) : (
              <div className="p-xl rounded-[24px] bg-white shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 bg-[#F5F5FA] rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#240A8A] text-[32px]">rocket_launch</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">No Interview Data Yet</h3>
                <p className="text-sm text-on-surface-variant mb-8 w-full max-w-[400px] leading-relaxed mx-auto">
                  You haven't completed any interviews. Start your first practice session to generate your personalized AI profile and performance metrics!
                </p>
                <button onClick={() => router.push(ROUTES.interview)} className="bg-[#240A8A] text-white font-bold text-sm px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/20 cursor-pointer">
                  Start First Interview
                </button>
              </div>
            )}

          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="col-span-12 lg:col-span-3 space-y-md">

            {/* Weekly Goal */}
            <div className="p-6 rounded-[24px] bg-white border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between mb-6">
                <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">WEEKLY GOAL</p>
              </div>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-[#F5F5FA]" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-[#240A8A]" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * Math.min(totalInterviews, weeklyGoal)) / weeklyGoal} strokeWidth="8" strokeLinecap="round"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-extrabold">{totalInterviews}/{weeklyGoal}</span>
                  <span className="text-[10px] text-on-surface-variant font-medium mt-1">Interviews</span>
                </div>
              </div>
              <p className="mt-6 text-xs font-medium text-on-surface-variant leading-relaxed">Keep going! Just {Math.max(0, weeklyGoal - totalInterviews)} more<br />to reach your goal.</p>
            </div>

            {/* Target Profile Widget */}
            <div className="p-6 rounded-[24px] bg-white border border-outline-variant/20 shadow-sm">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">TARGET PROFILE</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase">TARGET ROLE</p>
                  <p className="text-sm font-semibold text-on-surface">{currentRole}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant mb-2 uppercase">LINKS</p>
                  <div className="flex flex-col gap-3 text-sm font-semibold text-[#240A8A]">
                    {profile?.githubUrl ? (
                      <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline hover:opacity-80 transition-opacity">
                        <FaGithub className="text-[18px]" />
                        <span className="truncate">GitHub</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaGithub className="text-[18px]" />
                        <span className="truncate text-xs">Not Provided</span>
                      </div>
                    )}
                    {profile?.linkedinUrl ? (
                      <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline hover:opacity-80 transition-opacity">
                        <FaLinkedin className="text-[18px] text-[#0A66C2]" />
                        <span className="truncate">LinkedIn</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaLinkedin className="text-[18px]" />
                        <span className="truncate text-xs">Not Provided</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>



          </div>
        </div>
      </main>

      {/* FAB for Quick Start */}
      <button
        onClick={() => router.push(ROUTES.interview)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-[#240A8A] text-white shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
}
