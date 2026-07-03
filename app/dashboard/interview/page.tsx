"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { WaveformShader } from "@/components/ui/WaveformShader";

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
import { useInterviewStore } from "@/store/useInterviewStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ROUTES } from "@/lib/utils/constants";
import { nowISO } from "@/lib/utils";
import Sidebar from "@/components/common/Sidebar";

export default function InterviewPage() {
  const router = useRouter();
  const { current, loading, error, start, submitAnswer, finish, reset } = useInterview();
  const { currentIndex, currentQuestion } = useInterviewStore();
  const { targetRole, setTargetRole, provider } = useSettingsStore();

  // Setup form states
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [companyType, setCompanyType] = useState("");
  const [customCompanyName, setCustomCompanyName] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [difficulty, setDifficulty] = useState("Mid-Level");
  const [interviewType, setInterviewType] = useState("Technical");
  const [jobDescription, setJobDescription] = useState("");

  // Data Fetching states
  const [profileData, setProfileData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [setupLoading, setSetupLoading] = useState(true);

  // Live Interview states
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState("00:00:00");
  const [showHint, setShowHint] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  useEffect(() => {
    async function fetchSetupData() {
      try {
        setSetupLoading(true);
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.success) {
          setProfileData(json.data);
          if (json.data.profile?.targetRole) {
            setTargetRole(json.data.profile.targetRole);
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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSetupLoading(false);
      }
    }
    fetchSetupData();
  }, [setTargetRole]);

  const activeQuestion = currentQuestion();
  const done = current && currentIndex >= current.questions.length;

  // Active Timer Effect
  useEffect(() => {
    if (!current) return;
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
      const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      setTimer(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [current]);

  // Auto scroll transcript or reset hint when question changes
  useEffect(() => {
    setAnswer("");
    setShowHint(false);
  }, [currentIndex]);

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

    const payload = selectedCompany === "Other" 
      ? { company: "Other", companyType, customCompanyName, jobDescription } 
      : { company: selectedCompany, jobDescription };

    await start(payload);
  };

  const handleNext = () => {
    if (!activeQuestion) return;
    submitAnswer({
      questionId: activeQuestion.id,
      text: answer || "Candidate chose not to answer or provided no response.",
      createdAt: nowISO(),
    });
  };

  const handleFinish = async () => {
    setEvaluationLoading(true);
    const evalData = await finish();
    setEvaluationLoading(false);
    if (evalData) {
      router.push(ROUTES.reports);
    }
  };

  // State 1: Setup Screen
  if (!current) {
    return (
      <div className="min-h-screen bg-background text-on-surface font-body-md flex">
        <Sidebar />

        {/* Main Content Area */}
        <main className="ml-64 p-gutter w-full min-h-screen flex-1">
          <div className="max-w-[1000px] mx-auto space-y-lg pb-xxl pt-6">
          {/* Header Section */}
          <header className="mb-8 max-w-3xl">
            <div className="inline-flex items-center gap-sm px-4 py-1.5 bg-primary-fixed text-primary rounded-full mb-4">
              <span className="text-sm">🎯</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Interview Setup</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-2 tracking-tight">Let&apos;s prepare your next interview.</h1>
            <p className="text-base text-on-surface-variant">Configure your session and let the AI tailor questions based on your history and goals.</p>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-outline-variant/30 rounded-xxl shadow-2xl ai-glow w-full max-w-3xl mx-auto min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Generating Tailored Questions...</h3>
              <p className="text-sm text-on-surface-variant max-w-md">
                ARIA is analyzing your target role (<span className="font-semibold text-primary">{targetRole}</span>) and past performance memory to compile the optimal session syllabus.
              </p>
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
                    <p className="text-primary-container text-xs opacity-90">Session tailored to {targetRole} role at {selectedCompany}.</p>
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
                      className="flex-1 md:flex-initial px-6 py-3 bg-white text-primary hover:bg-surface-container font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer text-xs"
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
                          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">Welcome to Interview Memory Agent</h3>
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
        </main>
      </div>
    );
  }

  // State 2: Active Live Interview Screen
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md overflow-hidden h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm px-gutter h-16 flex justify-between items-center max-w-full">
        <div className="flex items-center gap-md">
          <span className="text-lg font-bold text-primary">InterviewAI</span>
        </div>
        <div className="flex items-center gap-md bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant/20">
          <span className="material-symbols-outlined text-primary-container text-sm">work</span>
          <span className="text-sm font-bold text-on-surface">{targetRole} Interview</span>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm bg-error-container/20 px-3 py-1.5 rounded-lg border border-error-red/10">
            <span className="material-symbols-outlined text-error-red text-sm">timer</span>
            <span className="text-sm font-bold text-error-red">{timer}</span>
          </div>
          <button
            onClick={reset}
            className="px-4 py-1.5 border border-error-red text-error-red rounded-lg text-xs font-bold hover:bg-error-red hover:text-white transition-all duration-200 cursor-pointer active:scale-95"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 mt-16 flex overflow-hidden">
        {/* Left Sidebar: Progress */}
        <aside className="w-72 bg-surface border-r border-outline-variant/30 flex flex-col p-lg gap-lg overflow-y-auto">
          <div>
            <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block mb-2">Current Progress</span>
            <div className="flex items-end gap-sm">
              <h3 className="text-lg font-bold text-on-surface">Question {done ? currentIndex : currentIndex + 1} of {current.questions.length}</h3>
            </div>
            <div className="mt-3 px-3 py-1 bg-surface-container rounded-lg inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-xs text-on-surface-variant font-semibold">Mode: Active Simulation</span>
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-2">
            {current.questions.map((q, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 p-3 rounded-xxl transition-all ${
                    isCurrent
                      ? "bg-primary-container/10 text-primary-container border border-primary-container/20 font-bold"
                      : "text-on-surface-variant/80"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isPassed
                      ? "bg-success-green/10 text-success-green"
                      : isCurrent
                      ? "bg-primary text-white"
                      : "bg-surface-container"
                  }`}>
                    {isPassed ? (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="text-xs truncate">{q.type || `Question ${idx + 1}`}</span>
                </div>
              );
            })}
          </nav>
          <div className="bg-surface-container border border-outline-variant/30 rounded-xxl p-4">
            <p className="text-xs text-on-surface-variant italic leading-relaxed">
              &quot;ARIA evaluates your technical depth, structured thinking, and pacing.&quot;
            </p>
            <p className="text-[9px] font-bold text-primary-container mt-2 uppercase tracking-wider">— AI Coach Tip</p>
          </div>
        </aside>

        {/* Center Panel: Main Interview */}
        <section className="flex-1 flex flex-col bg-surface-container-low overflow-y-auto relative p-6">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center gap-6 pb-20">
            {/* AI Avatar Card */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden ai-glow">
                  <img
                    className="w-full h-full object-cover"
                    alt="AI Avatar"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu2xBsZayqErBrWQXSnNoUZGLIGAiPp_I-Pnws-c2JZ79W23sOBqggulu4nc27QXplOv0f3IHEtBReQz6MZlgbJIGg9Hi2phVnmi8ZuhKH4ZB1Sh3UMSMRF2I-15rx88ZvksqM1JhSB93AuC0pz4CX04P1aGeAQhSE_aZZhT15ku1JjG9F7zNYoeCDsP9XfAuU1we52KYz5MBY6XsoduTqUjT5sNQSC8MHovHVR8l6dzQv3kRjLiQQpXw0Qxx3fGFUr1Y3_r1pM5Qz"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full shadow-md border border-outline-variant/20 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
                  <span className="text-[10px] font-bold text-on-surface">ARIA</span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            {activeQuestion ? (
              <div className="bg-white rounded-xxl p-6 shadow-xl border border-outline-variant/30 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded tracking-wider uppercase">
                    {activeQuestion.type || "Interview Question"}
                  </span>
                  <span className="text-[10px] px-2.5 py-1 bg-tertiary-fixed text-tertiary rounded-full font-bold uppercase tracking-wider">
                    MEDIUM
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-4 leading-snug">
                  {activeQuestion.prompt}
                </h2>
                <div className="flex gap-4 text-xs font-semibold text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">history</span>
                    <span>Allocated: 3 mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">star</span>
                    <span>Topic: {activeQuestion.type || "Core Technology"}</span>
                  </div>
                </div>
              </div>
            ) : done ? (
              <div className="bg-white rounded-xxl p-8 shadow-xl border border-outline-variant/30 text-center space-y-4">
                <span className="material-symbols-outlined text-success-green text-5xl fill-current">check_circle</span>
                <h2 className="text-2xl font-bold">All questions answered!</h2>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                  Click below to finish and let ARIA compile your memory records, scoring metrics, and communication feedbacks.
                </p>
                <button
                  onClick={handleFinish}
                  disabled={evaluationLoading}
                  className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-[#4338CA] transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  {evaluationLoading ? (
                    <>
                      Evaluating Session...
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    </>
                  ) : (
                    <>
                      Finish & Evaluate
                      <span className="material-symbols-outlined">analytics</span>
                    </>
                  )}
                </button>
              </div>
            ) : null}

            {/* Waveform Visualization */}
            {!done && (
              <div className="space-y-4">
                <div className="w-full h-24 relative overflow-hidden rounded-xl border border-outline-variant/20">
                  <WaveformShader />
                </div>

                {/* Input Text Box */}
                <div className="bg-white rounded-xxl border border-outline-variant/30 p-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Your Answer</span>
                  <textarea
                    rows={4}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Floating Bottom Control Bar */}
          {!done && (
            <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none z-30">
              <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl border border-outline-variant/30 rounded-xxl shadow-2xl p-2.5 flex items-center justify-between gap-4 pointer-events-auto">
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-all active:scale-95 text-on-surface-variant hover:text-error cursor-pointer"
                    title="Cancel Session"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowHint(!showHint)}
                  className={`flex-1 h-10 border rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    showHint
                      ? "border-primary bg-primary-fixed/20 text-primary"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  {showHint ? "Hide Hint" : "Ask Hint"}
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 h-10 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Submit Answer</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {showHint && (
                <div className="max-w-xl mx-auto mt-2 bg-secondary-fixed/50 backdrop-blur-md p-4 rounded-xl border border-secondary-fixed text-xs font-medium text-on-secondary-fixed-variant shadow-md pointer-events-auto animate-fade-in">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    ARIA&apos;s Hint:
                  </p>
                  <p>
                    {activeQuestion?.type === "technical"
                      ? "Mention virtual DOM diffing, fiber reconciliation, and how state updates trigger batch DOM modifications."
                      : "Structure your explanation focusing on scaling constraints, consensus mechanisms, or specific data trade-offs."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Sidebar: AI Insights */}
        <aside className="w-80 bg-surface border-l border-outline-variant/30 flex flex-col p-lg gap-lg overflow-y-auto">
          {/* AI Memory Profile */}
          <div className="bg-white border border-outline-variant/30 rounded-xxl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
              <span className="text-[10px] font-bold tracking-wider text-on-surface uppercase">AI MEMORY PROFILE</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center bg-success-green/5 px-3 py-2 rounded-lg text-xs font-semibold">
                <span className="text-on-surface">Strong in React</span>
                <span className="material-symbols-outlined text-success-green text-[16px]">trending_up</span>
              </div>
              <div className="flex justify-between items-center bg-error/5 px-3 py-2 rounded-lg text-xs font-semibold">
                <span className="text-on-surface">Weak in DP</span>
                <span className="material-symbols-outlined text-error text-[16px]">trending_down</span>
              </div>
              <div className="flex justify-between items-center bg-primary/5 px-3 py-2 rounded-lg text-xs font-semibold">
                <span className="text-on-surface">Confidence improving</span>
                <span className="material-symbols-outlined text-primary text-[16px]">bolt</span>
              </div>
            </div>
          </div>

          {/* Session Guidelines */}
          <div className="bg-white border border-outline-variant/30 rounded-xxl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">info</span>
              <span className="text-[10px] font-bold tracking-wider text-on-surface uppercase">Session Checklist</span>
            </div>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success-green text-sm">check</span>
                Speak clearly at constant pacing
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success-green text-sm">check</span>
                Analyze edge cases aloud
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success-green text-sm">check</span>
                Utilize the STAR framework
              </li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
