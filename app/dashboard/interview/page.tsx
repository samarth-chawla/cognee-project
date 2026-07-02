"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WaveformShader } from "@/components/ui/WaveformShader";
import { useInterview } from "@/hooks/useInterview";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ROUTES } from "@/lib/utils/constants";
import { nowISO } from "@/lib/utils";

export default function InterviewPage() {
  const router = useRouter();
  const { current, loading, error, start, submitAnswer, finish, reset } = useInterview();
  const { currentIndex, currentQuestion } = useInterviewStore();
  const { targetRole, setTargetRole, provider } = useSettingsStore();

  // Setup form states
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [difficulty, setDifficulty] = useState("Mid-Level");
  const [interviewType, setInterviewType] = useState("Technical");
  const [interviewMode, setInterviewMode] = useState("Voice Only");
  const [duration, setDuration] = useState(45);

  // Live Interview states
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState("00:00:00");
  const [showHint, setShowHint] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

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
    // Save target role if edited, then launch
    await start();
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
      <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col">
        {/* TopNavBar */}
        <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
            <div className="flex items-center gap-xl">
              <Link href={ROUTES.home} className="font-headline-md text-headline-md font-bold text-primary hover:opacity-85 transition-opacity">
                Interview Memory Agent
              </Link>
              <div className="hidden md:flex items-center gap-lg text-sm font-semibold">
                <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.dashboard}>Dashboard</Link>
                <Link className="text-primary border-b-2 border-primary pb-1" href={ROUTES.interview}>Practice</Link>
                <Link className="text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.memory}>Memory Bank</Link>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <button className="p-1.5 active:scale-95 transition-transform text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button onClick={() => router.push(ROUTES.settings)} className="p-1.5 active:scale-95 transition-transform text-on-surface-variant hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-primary-container overflow-hidden border border-outline-variant/30">
                <img
                  className="w-full h-full object-cover"
                  alt="Avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu2xcTJEgh6AeExYKNVFDMOSh0Knu6LiRMsLDoz4vAvwajF27spYC3JauQygEccryBsB30Pq8qym7M-NMJGPcmoyZvfFqhKNJ3qoU0KNaCBZLkuOUmX12eJjWsKjkkkBi8GRNWC0BkYALt2RRLw36A5r1ZIhSPLsUibRXQzQV1Ag6MnhI-Nimz6RVF0buLAXowvM64TtjgbIWGm3hgPLBtuK9iCwZtBhJkLrAChsx0JecwCh95QWWQSeXRbDgF9sK3M5iCIdi6gxGN"
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-24 pb-xxl px-gutter max-w-container-max mx-auto w-full flex-1">
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
                    {[
                      { name: "Google", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHd03qbHU9dbgp39H6WDgKD5T_7tdGlxXd8QIUAa0gyjXutubiI6HEBNggcW6KsdiOKPbdbXOX3EhPNfpBwV5v0gmGnysm6FBXauQdWEuziniCsWQcBk0WjceT104E3Svao_gJfAF6c0Env6lVXdGBol00_j5DFYCTyAnMTuD69FMn6GHx0Qg3Niw9lvL15pte7mXJVXPyUG8Cj8eWCuXv8jvhj_JYfJs2ni4adoDC23wMsgSRDx9XgSDJvkJw3nvhz0TSdUECY5k-" },
                      { name: "Amazon", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDe8SdbCc6hE5czm0Zl9Q1jX7Pnbcqc5_ICuKVGstP0t4hD9W-CddB2CjGl3W5hSJugWhKsA-GoafoRu4CtJzwQ-EFeq2oKBDnF4TDXrYiH_MEITTOuFPqkzXlRIpGCWYiXFJB_sSw2QgWqi2vH4JYDqhTdsnVS0Wu7g6yu3giO7jtr-QMVuldF5u2pTeBI2XkH__n26JtUdH4HZORgqCYOSyGIBaw8k8XKayAzKGZ7-hTB-Hh_b7S3TdpfH2F3S-6iZ28ik3JQBiWE" },
                      { name: "Microsoft", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4ArhNs57j4rd-RkKXnZZK4HEt_tBXjjsX-_tp4I6gwgW-4g5s_lcsW3HrqnocX_uErn1aceQmbsbZuIYevG0u_iXXpyMFsLVDsu-EIT7fs8l8fgH50IzM9LP812eckX2f6InaloVTO4_s2P3Irzr4zfEMZSF0ukZmZTh1voNwON3xT8P2c4JHzD8PXa-SdCEaJfOEv8_tpAldT519MpB0MA3XOv1pfF9PtQSGiLFUPQ_ytvmtiu1WKeAdAIRLWGVaK2p3_zixFjYP" }
                    ].map((comp) => {
                      const isSelected = selectedCompany === comp.name;
                      return (
                        <button
                          key={comp.name}
                          onClick={() => setSelectedCompany(comp.name)}
                          className={`flex flex-col items-center gap-sm p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary-fixed/30 hover:bg-primary-fixed/50"
                              : "border-outline-variant/30 hover:border-primary/50"
                          }`}
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <img className="w-8 h-8 object-contain" alt={comp.name} src={comp.img} />
                          </div>
                          <span className="text-xs font-semibold">{comp.name}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setSelectedCompany("Other")}
                      className={`flex flex-col items-center gap-sm p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedCompany === "Other"
                          ? "border-primary bg-primary-fixed/30"
                          : "border-outline-variant/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline">more_horiz</span>
                      </div>
                      <span className="text-xs font-semibold">Other</span>
                    </button>
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

                {/* Mode & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                  <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Interview Mode</h2>
                    <div className="flex flex-col gap-sm">
                      {[
                        { mode: "Voice Only", icon: "mic" },
                        { mode: "Text-based", icon: "keyboard" }
                      ].map((item) => {
                        const isSelected = interviewMode === item.mode;
                        return (
                          <button
                            key={item.mode}
                            onClick={() => setInterviewMode(item.mode)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary-fixed/20"
                                : "border-outline-variant/30 hover:bg-surface-container"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined ${isSelected ? "text-primary" : "text-outline"}`}>{item.icon}</span>
                              <span className="text-sm font-semibold text-on-surface">{item.mode}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-4 ${isSelected ? "border-primary" : "border-outline-variant"}`}></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                    <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Duration</h2>
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-extrabold text-primary">{duration}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant pb-1">MINUTES</span>
                      </div>
                      <input
                        type="range"
                        max="90"
                        min="15"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                        <span>15m</span>
                        <span>45m</span>
                        <span>90m</span>
                      </div>
                    </div>
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
                {/* AI Strategy */}
                <div className="bg-surface-indigo p-lg rounded-xxl border border-primary/20 ai-glow relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-sm mb-4">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Strategy</h3>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed mb-6">
                    Focus on <strong className="text-primary">React State Management</strong> and <strong className="text-primary">System Scalability</strong> based on Google&apos;s interview patterns.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">React</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">System Design</span>
                  </div>
                </div>

                {/* Memory Bank */}
                <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                  <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Memory Bank</h2>
                  <div className="space-y-6 relative pl-4 border-l border-outline-variant/30">
                    <div className="flex gap-4 relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-secondary border-2 border-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px]">history_edu</span>
                      </div>
                      <div className="w-full">
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">OCT 24, 2026</p>
                        <p className="text-sm font-bold text-on-surface">JOB SDE II</p>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex-1 bg-surface-container h-1 rounded-full overflow-hidden">
                            <div className="bg-success-green h-full" style={{ width: "78%" }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-success-green whitespace-nowrap">78% Score</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-outline border-2 border-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px]">check_circle</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">OCT 18, 2026</p>
                        <p className="text-sm font-bold text-on-surface">Google Mock</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Completed 8/8 questions</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Summary */}
                <div className="bg-white p-lg rounded-xxl border border-outline-variant/30 shadow-sm">
                  <h2 className="text-[11px] font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Preview Summary</h2>
                  <ul className="space-y-3 text-xs font-semibold">
                    <li className="flex justify-between py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Focus Area</span>
                      <span>{interviewType} Session</span>
                    </li>
                    <li className="flex justify-between py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Difficulty</span>
                      <span>{difficulty}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Voice Mode</span>
                      <span>{interviewMode}</span>
                    </li>
                    <li className="flex justify-between py-2">
                      <span className="text-on-surface-variant">Total Duration</span>
                      <span>{duration} Minutes</span>
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-secondary-fixed/30 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">info</span>
                    <p className="text-[10px] text-on-secondary-fixed-variant leading-relaxed font-semibold">
                      Agent will monitor filler words and response latency throughout the session.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          )}
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
