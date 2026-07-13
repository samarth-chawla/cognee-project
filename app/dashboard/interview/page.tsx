"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { createPortal } from "react-dom";

const setupSchema = z.object({
  company: z.string().min(1),
  companyType: z.string().optional(),
  customCompanyName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.company === "Other") {
    if (!data.companyType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company type is required",
        path: ["companyType"]
      });
    }
    if (!data.customCompanyName || data.customCompanyName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required",
        path: ["customCompanyName"]
      });
    }
  }
});
import { useInterview } from "@/hooks/useInterview";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ROUTES } from "@/lib/utils/constants";
import Sidebar from "@/components/common/Sidebar";
import VoiceInterview from "@/components/interview/VoiceInterview";
import { toast } from "react-hot-toast";

export default function InterviewPage() {
  const router = useRouter();
  const { current, loading, error, start, cancel } = useInterview();
  const { targetRole, setTargetRole } = useSettingsStore();

  // Setup form states
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [companyType, setCompanyType] = useState("");
  const [customCompanyName, setCustomCompanyName] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [difficulty, setDifficulty] = useState("Mid-Level");
  const [interviewType, setInterviewType] = useState("Technical");
  const [jobDescription, setJobDescription] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Data Fetching states
  const [profileData, setProfileData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [usageInfo, setUsageInfo] = useState<{ totalUsed: number; maxUses: number; remaining: number; isLimitReached: boolean; window?: string; windowLabel?: string } | null>(null);

  const refreshUsage = useCallback(async () => {
    try {
      const usageRes = await fetch("/api/user/usage", { cache: "no-store" });
      const usageJson = await usageRes.json();
      if (usageJson.success) {
        setUsageInfo(usageJson.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);
  const [setupLoading, setSetupLoading] = useState(true);

  useEffect(() => {
    async function fetchSetupData() {
      try {
        setSetupLoading(true);
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.success) {
          setProfileData(json.data);
          const p = json.data.profile;
          if (p) {
            if (p.targetRole) setTargetRole(p.targetRole);
            
            if (p.preferredDifficulty === "EASY") setDifficulty("Junior");
            else if (p.preferredDifficulty === "HARD") setDifficulty("Senior+");
            else if (p.preferredDifficulty === "MEDIUM") setDifficulty("Mid-Level");

            if (p.interviewTypes && p.interviewTypes.length > 0) {
              const t = p.interviewTypes[0];
              if (t === "behavioral") setInterviewType("Behavioral");
              else if (t === "system_design") setInterviewType("System Design");
              else if (t === "technical") setInterviewType("Technical");
            }

            if (p.targetCompanies && p.targetCompanies.length > 0) {
              setSelectedCompany(p.targetCompanies[0]);
            }
          }
          const userId = json.data.user.id;
          const totalInterviews = json.data.analytics?.totalInterviews || 0;
          if (totalInterviews > 0) {
            const memRes = await fetch(`/api/memory/insights?userId=${userId}&q=insights`);
            const memJson = await memRes.json();
            if (memJson.success) {
              setInsightsData(Array.isArray(memJson.data) ? memJson.data : memJson.data?.nodes || []);
            }
          }
          
          await refreshUsage();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSetupLoading(false);
      }
    }
    fetchSetupData();
  }, [setTargetRole]);

  useEffect(() => {
    if (error) {
      if (error === "INTERVIEW_LIMIT_REACHED") {
        toast.error(`You have reached the interview limit for this ${usageInfo?.windowLabel ?? "month"}.`);
      } else {
        toast.error(error);
      }
      // A new interview was consumed (or blocked) — sync the usage card.
      refreshUsage();
    }
  }, [error, refreshUsage]);

  // When an interview ends and we return to the setup screen, refresh the usage
  // card so it reflects the just-consumed session instantly (no reload needed).
  const hadInterviewRef = useRef(false);
  useEffect(() => {
    if (current) {
      hadInterviewRef.current = true;
    } else if (hadInterviewRef.current) {
      hadInterviewRef.current = false;
      refreshUsage();
    }
  }, [current, refreshUsage]);

  const handleStart = async () => {
    const result = setupSchema.safeParse({
      company: selectedCompany,
      companyType,
      customCompanyName
    });

    if (!result.success) {
      setValidationErrors(result.error.flatten().fieldErrors);
      return;
    }
    setValidationErrors({});

    const mapDifficulty = (diff: string) => {
      if (diff === "Junior") return "EASY";
      if (diff === "Senior+") return "HARD";
      return "MEDIUM";
    };

    const payload = selectedCompany === "Other" 
      ? { company: "Other", companyType, customCompanyName, jobDescription, difficulty: mapDifficulty(difficulty), interviewType } 
      : { company: selectedCompany, jobDescription, difficulty: mapDifficulty(difficulty), interviewType };

    await start(payload);
  };

  const cancelModal =
    isCancelModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setIsCancelModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-6 "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-2xl bg-error-red/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error-red">warning</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Cancel Interview?</h2>
              <p className="text-sm text-on-surface-variant mt-2">
                Are you sure you want to cancel? This will count as 1 used interview out of your limit for this {usageInfo?.windowLabel ?? "month"}.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-error-red/50 hover:text-error-red transition-all cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  onClick={async () => {
                    setIsCancelModalOpen(false);
                    await cancel();
                    await refreshUsage();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-error-red text-white text-sm font-semibold hover:bg-error-red/90 transition-colors active:scale-95 shadow-md shadow-error-red/20 cursor-pointer"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  // State 1: Setup Screen
  if (!current) {
    return (
      <div className="min-h-screen bg-background text-on-surface font-body-md flex">
        <Sidebar />

        {/* Main Content Area */}
        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] p-4 sm:p-gutter pt-20 lg:pt-6 min-h-screen flex-1">
          <div className="max-w-[1000px] mx-auto space-y-6 lg:space-y-lg pb-xxl">
          {/* Header Section */}
          <header className="mb-8 max-w-3xl">
            <div className="inline-flex items-center gap-sm px-4 py-1.5 bg-primary-fixed text-primary rounded-full mb-4">
              <span className="text-sm">🎯</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Interview Setup</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-2 tracking-tight">Let&apos;s prepare your next interview.</h1>
            <p className="text-base text-on-surface-variant">Configure your session and let the AI tailor questions based on your history and goals.</p>
          </header>

          {error === "INTERVIEW_LIMIT_REACHED" ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white border border-outline-variant/30 rounded-xxl shadow-2xl w-full max-w-3xl mx-auto min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-error-red/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-error-red text-3xl">block</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Interview Limit Reached</h3>
              <p className="text-on-surface-variant font-medium mb-2">You have used all {usageInfo?.maxUses ?? 3} interviews available this {usageInfo?.windowLabel ?? "month"}.</p>
              <p className="text-on-surface-variant font-medium">Please come back next {usageInfo?.windowLabel ?? "month"}.</p>
              <button
                onClick={() => router.push(ROUTES.dashboard)}
                className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white border border-outline-variant/30 rounded-xxl shadow-2xl ai-glow w-full max-w-3xl mx-auto min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Generating Tailored Questions...</h3>
              <p className="w-full text-sm sm:text-base text-on-surface-variant ">
                Clutchly is analyzing your target role (<span className="font-semibold text-primary">{targetRole}</span>) and past performance memory to compile the optimal session syllabus.
              </p>
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-6 py-2 rounded-xl border border-error-red text-error-red hover:bg-error-red hover:text-white font-bold transition-colors shadow-sm active:scale-95 text-xs uppercase tracking-wider cursor-pointer mt-4"
                >
                Cancel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
              {/* Left Column: Configuration */}
              <section className="lg:col-span-8 space-y-6">
                {/* Company Selection */}
                <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                  <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Select Company</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-md">
                    {["Google", "Amazon", "Microsoft", "Meta", "NVIDIA", "Other"].map((comp) => {
                      const isSelected = selectedCompany === comp;
                      return (
                        <button
                          key={comp}
                          onClick={() => {
                            setSelectedCompany(comp);
                            setValidationErrors({});
                          }}
                          className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary-fixed/30 hover:bg-primary-fixed/50"
                              : "border-outline-variant/30 hover:border-primary/50"
                          }`}
                        >
                          <span className="text-xs font-semibold">{comp}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Other section with smooth animation */}
                  <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${selectedCompany === 'Other' ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                    <div className="min-h-0 space-y-6">
                      <div className="pt-4 border-t border-outline-variant/20">
                        <h3 className="text-[11px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Company Type <span className="text-error-red">*</span></h3>
                        <div className="flex gap-4">
                          {["Big Tech", "Startup"].map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                setCompanyType(type);
                                setValidationErrors(prev => ({ ...prev, companyType: [] }));
                              }}
                              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                                companyType === type
                                  ? "border-primary bg-primary text-white shadow-md"
                                  : "border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        {validationErrors.companyType && validationErrors.companyType.length > 0 && (
                          <p className="text-error-red text-xs mt-2 font-semibold">{validationErrors.companyType[0]}</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-[11px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Company Name <span className="text-error-red">*</span></h3>
                        <input
                          type="text"
                          value={customCompanyName}
                          onChange={(e) => {
                            setCustomCompanyName(e.target.value);
                            setValidationErrors(prev => ({ ...prev, customCompanyName: [] }));
                          }}
                          placeholder="Enter company name"
                          className={`w-full p-3 bg-white border rounded-xl focus:ring-primary focus:border-primary outline-none text-sm font-semibold transition-all ${
                            validationErrors.customCompanyName && validationErrors.customCompanyName.length > 0 ? "border-error-red bg-error-red/5" : "border-outline-variant"
                          }`}
                        />
                        {validationErrors.customCompanyName && validationErrors.customCompanyName.length > 0 && (
                          <p className="text-error-red text-xs mt-2 font-semibold">{validationErrors.customCompanyName[0]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role & Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                  <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Role</h2>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full p-3 bg-white border border-outline-variant rounded-xl focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Difficulty</h2>
                    <div className="flex p-1 bg-surface-container rounded-xl">
                      {["Junior", "Mid-Level", "Senior+"].map((lvl) => {
                        const isSelected = difficulty === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => setDifficulty(lvl)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white shadow-sm text-primary"
                                : "text-on-surface-variant hover:bg-surface-container-highest"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Job Description (Optional) */}
                <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Job Description (Optional)</h2>
                    <span className="text-[10px] px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full font-bold uppercase tracking-wider">
                      Optional
                    </span>
                  </div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description (JD) here to tailor the interview questions specifically to the role's requirements..."
                    rows={4}
                    className="w-full p-3 bg-white border border-outline-variant rounded-xl focus:ring-primary focus:border-primary outline-none text-sm font-semibold transition-all resize-none"
                  />
                </div>


                {/* Interview Type Selection */}
                <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                  <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Interview Type</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                    {[
                      { type: "Technical", icon: "code", desc: "DSA, LeetCode, Architecture" },
                      { type: "Behavioral", icon: "psychology", desc: "Culture, Leadership, Conflict" },
                      { type: "System Design", icon: "layers", desc: "Scalability, Cloud, APIs" },
                    ].map((item) => {
                      const isSelected = interviewType === item.type;
                      return (
                        <div
                          key={item.type}
                          onClick={() => setInterviewType(item.type)}
                          className={`p-6 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary-fixed/20"
                              : "border-outline-variant/30 hover:bg-surface-container"
                          }`}
                        >
                          <span className={`material-symbols-outlined mb-4 ${isSelected ? "text-primary" : "text-outline"}`}>
                            {item.icon}
                          </span>
                          <p className="font-bold text-base mb-1">{item.type}</p>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>


                {/* CTA Card */}
                <div className="bg-primary p-6 rounded-xxl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-white">
                  <div>
                    <h3 className="text-lg font-bold">Your AI interviewer is ready.</h3>
                    <p className="text-white text-xs opacity-90">Session tailored to {targetRole} role at {selectedCompany}.</p>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button
                      onClick={() => router.push(ROUTES.dashboard)}
                      className="flex-1 md:flex-initial px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all active:scale-95 cursor-pointer text-xs"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStart}
                      disabled={usageInfo?.isLimitReached}
                      className="flex-1 md:flex-initial px-6 py-3 bg-white text-primary hover:bg-surface-container font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">mic</span>
                      Start Interview
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Column: Sidebar */}
              <aside className="lg:col-span-4 space-y-6">
                {setupLoading ? (
                  <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm animate-pulse h-64"></div>
                ) : (
                  <>
                    {/* Usage Limits Card */}
                    {usageInfo && (
                      <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
                        <div className="w-full flex items-center justify-between mb-6">
                          <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">{usageInfo.windowLabel ?? "month"} USAGE</p>
                        </div>
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle className="text-[#F5F5FA]" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="8"></circle>
                            <circle 
                              className={usageInfo.isLimitReached ? "text-error-red" : "text-[#240A8A]"} 
                              cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" 
                              strokeDasharray="301.6" 
                              strokeDashoffset={301.6 - (301.6 * Math.min(usageInfo.totalUsed, usageInfo.maxUses)) / usageInfo.maxUses} 
                              strokeWidth="8" strokeLinecap="round"
                            ></circle>
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-extrabold">{usageInfo.totalUsed}/{usageInfo.maxUses}</span>
                            <span className="text-[10px] text-on-surface-variant font-medium mt-1">Interviews</span>
                          </div>
                        </div>
                        <p className={`mt-6 text-xs font-medium leading-relaxed ${usageInfo.isLimitReached ? "text-error-red" : "text-on-surface-variant"}`}>
                          {usageInfo.isLimitReached ? "You have reached your limit." : `You have ${usageInfo.remaining} uses remaining this ${usageInfo.windowLabel ?? "month"}.`}
                        </p>
                      </div>
                    )}

                    {/* Profile Card */}
                    <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                      <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Candidate Profile</h2>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-on-surface-variant font-semibold">Full Name</p>
                          <p className="text-sm font-bold text-on-surface">{profileData?.user?.fullName || "Not Provided"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant font-semibold">Experience</p>
                          <p className="text-sm font-bold text-on-surface">{profileData?.profile?.experience || "Not Provided"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant font-semibold">Target Role</p>
                          <p className="text-sm font-bold text-on-surface">{profileData?.profile?.targetRole || "Not Provided"}</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                          {profileData?.profile?.githubUrl ? (
                            <Link href={profileData.profile.githubUrl} className="text-primary text-sm font-semibold hover:underline" target="_blank">
                              GitHub ↗
                            </Link>
                          ) : (
                            <span className="text-on-surface-variant text-sm font-semibold">GitHub (Not Provided)</span>
                          )}
                          {profileData?.profile?.linkedinUrl ? (
                            <Link href={profileData.profile.linkedinUrl} className="text-primary text-sm font-semibold hover:underline" target="_blank">
                              LinkedIn ↗
                            </Link>
                          ) : (
                            <span className="text-on-surface-variant text-sm font-semibold">LinkedIn (Not Provided)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Analytics / Empty State */}
                    {(profileData?.analytics?.totalInterviews || 0) === 0 ? (
                      <div className="bg-surface-indigo p-lg rounded-xxl border border-primary/20 ai-glow relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-sm mb-4">
                          <span className="material-symbols-outlined text-primary">auto_awesome</span>
                          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">Welcome to Clutchly</h3>
                        </div>
                        <p className="text-sm text-on-surface leading-relaxed mb-6">
                          We&apos;ll track your performance, weaknesses, and improvement over time.
                        </p>
                        <p className="text-sm text-on-surface font-semibold">
                          Start your first interview to begin building your memory bank.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                        <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Dynamic Insights</h2>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                            <span className="text-xs text-on-surface-variant font-semibold">Readiness Score</span>
                            <span className="text-sm font-bold text-primary">{profileData?.analytics?.readinessScore || 0}%</span>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant font-semibold mb-2">Focus Areas</p>
                            <div className="flex flex-wrap gap-2">
                              {insightsData?.filter((n: any) => n.kind === 'weakness').slice(0, 3).map((n: any) => (
                                <span key={n.id} className="px-2 py-1 bg-error/10 text-error text-[10px] font-bold rounded-full">{n.content}</span>
                              ))}
                              {(!insightsData || insightsData.filter((n: any) => n.kind === 'weakness').length === 0) && (
                                <span className="text-xs text-on-surface-variant">No focus areas identified yet.</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant font-semibold mb-2">Top Strengths</p>
                            <div className="flex flex-wrap gap-2">
                              {insightsData?.filter((n: any) => n.kind === 'strength').slice(0, 3).map((n: any) => (
                                <span key={n.id} className="px-2 py-1 bg-success-green/10 text-success-green text-[10px] font-bold rounded-full">{n.content}</span>
                              ))}
                              {(!insightsData || insightsData.filter((n: any) => n.kind === 'strength').length === 0) && (
                                <span className="text-xs text-on-surface-variant">No strengths recorded yet.</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant font-semibold mb-2">Last Feedback Summary</p>
                            <p className="text-xs text-on-surface leading-relaxed">
                              {insightsData?.find((n: any) => n.kind === 'note')?.content || "No feedback summary available."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </aside>
            </div>
          )}
          </div>
          {cancelModal}
        </main>
      </div>
    );
  }

  // State 2: Active Voice Interview (Deepgram Voice Agent V2)
  return <VoiceInterview interview={current} onExit={cancel} />;
}
