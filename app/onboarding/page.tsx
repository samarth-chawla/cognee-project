"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ROUTES } from "@/lib/utils/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const { targetRole, setTargetRole } = useSettingsStore();

  const [name, setName] = useState("Alex Chen");
  const [role, setRole] = useState(targetRole || "Software Engineer");
  const [company, setCompany] = useState("Stanford University");
  const [experience, setExperience] = useState("3-5 Years");
  const [resumeName, setResumeName] = useState("resume_final_2024.pdf");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Stepper state
  const [step, setStep] = useState(1);

  const handleComplete = () => {
    setLoading(true);
    setTargetRole(role);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(ROUTES.dashboard);
      }, 800);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden flex items-center justify-center py-xxl grid-bg relative">
      <div className="absolute top-8 left-8">
        <Link href={ROUTES.home} className="text-body-lg font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined">arrow_back</span>
          Home
        </Link>
      </div>

      <main className="max-w-[1000px] w-full mx-auto px-md md:px-0 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl items-center">
          {/* Left Column: Setup Form */}
          <div className="md:col-span-7">
            <div className="bg-white p-lg md:p-xl rounded-xl shadow-2xl ai-glow border border-outline-variant/30">
              {/* Badge */}
              <div className="inline-flex items-center gap-sm bg-primary-container/10 px-4 py-1.5 rounded-full mb-6">
                <span className="text-lg">🧠</span>
                <span className="font-semibold text-[11px] text-primary uppercase tracking-wider">Personalized AI Setup</span>
              </div>
              
              {/* Header */}
              <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-2">Let&apos;s build your interview profile.</h1>
                <p className="text-sm text-on-surface-variant max-w-lg">Your AI interviewer will remember your goals, strengths, weaknesses, and progress to personalize every session.</p>
              </header>

              {/* Progress Stepper */}
              <div className="flex items-center gap-md mb-8">
                <div className="flex items-center gap-sm flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>1</div>
                  <span className={`text-xs font-semibold ${step >= 1 ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>Experience</span>
                </div>
                <div className="h-[2px] flex-1 stepper-line"></div>
                <div className="flex items-center gap-sm flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant opacity-60"}`}>2</div>
                  <span className={`text-xs font-semibold ${step >= 2 ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>Goals</span>
                </div>
                <div className="h-[2px] flex-1 stepper-line"></div>
                <div className="flex items-center gap-sm flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant opacity-60"}`}>3</div>
                  <span className={`text-xs font-semibold ${step >= 3 ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>Preview</span>
                </div>
              </div>

              {/* Form Section */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-on-surface">Tell us about yourself</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Alex Chen"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Target Role</label>
                      <input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Senior Product Designer"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">College/Company</label>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Stanford University"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                      >
                        <option>0-2 Years</option>
                        <option>3-5 Years</option>
                        <option>6-10 Years</option>
                        <option>10+ Years</option>
                      </select>
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Resume Upload</label>
                    <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">upload_file</span>
                      </div>
                      <p className="text-sm text-on-surface font-semibold">Click to upload or drag and drop</p>
                      <p className="text-xs text-on-surface-variant mt-1">PDF, DOCX up to 10MB</p>
                      {resumeName && (
                        <div className="mt-3 bg-white px-3 py-1.5 rounded-lg border border-outline-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-500 text-sm">description</span>
                          <span className="text-xs text-on-surface-variant">{resumeName}</span>
                          <button onClick={(e) => { e.stopPropagation(); setResumeName(""); }} className="text-xs text-on-surface-variant hover:text-error ml-2 cursor-pointer font-bold">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-on-surface">Choose your primary focus areas</h2>
                  <p className="text-xs text-on-surface-variant">The AI will emphasize these aspects during your sessions.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-outline-variant rounded-xl p-4 flex items-start gap-3 bg-surface-container-lowest hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-primary mt-0.5">code</span>
                      <div>
                        <p className="font-bold text-sm">Coding & Algorithms</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">LeetCode challenges, data structures, and optimization.</p>
                      </div>
                    </div>
                    <div className="border border-outline-variant rounded-xl p-4 flex items-start gap-3 bg-surface-container-lowest hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-secondary mt-0.5">schema</span>
                      <div>
                        <p className="font-bold text-sm">System Design</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Scaling systems, architecture, and API design principles.</p>
                      </div>
                    </div>
                    <div className="border border-outline-variant rounded-xl p-4 flex items-start gap-3 bg-surface-container-lowest hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-tertiary mt-0.5">forum</span>
                      <div>
                        <p className="font-bold text-sm">Behavioral Questions</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">STAR method, leadership, and company culture fit.</p>
                      </div>
                    </div>
                    <div className="border border-outline-variant rounded-xl p-4 flex items-start gap-3 bg-surface-container-lowest hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-success-green mt-0.5">record_voice_over</span>
                      <div>
                        <p className="font-bold text-sm">Communication Skills</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Confidence, pacing, and structured speaking style.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-on-surface">Confirm your settings</h2>
                  <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-sm">
                      <span className="text-on-surface-variant font-medium">Candidate Name</span>
                      <span className="font-bold text-on-surface">{name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-sm">
                      <span className="text-on-surface-variant font-medium">Target Role</span>
                      <span className="font-bold text-on-surface">{role}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-sm">
                      <span className="text-on-surface-variant font-medium">Experience Level</span>
                      <span className="font-bold text-on-surface">{experience}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Uploaded Resume</span>
                      <span className="font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-red-500 text-xs">description</span>
                        {resumeName || "None"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <footer className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between">
                <button
                  onClick={() => step > 1 && setStep(step - 1)}
                  disabled={step === 1}
                  className="px-6 py-3 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={step < 3 ? () => setStep(step + 1) : handleComplete}
                  disabled={loading || success}
                  className={`px-6 py-3 rounded-lg text-xs font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
                    success ? "bg-success-green shadow-success-green/20" : "bg-primary shadow-primary/20 hover:bg-[#4338CA]"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      Saving...
                      <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                    </span>
                  ) : success ? (
                    "Success!"
                  ) : step < 3 ? (
                    "Next Step"
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </footer>
            </div>
          </div>

          {/* Right Column: AI Graphic Visual */}
          <div className="md:col-span-5 hidden md:block">
            <div className="relative h-[600px] flex items-center justify-center">
              {/* Background Atmospheric Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-primary/5 via-transparent to-tertiary/5 rounded-full blur-3xl opacity-60"></div>
              </div>
              {/* Flow Visualization */}
              <div className="relative z-10 w-full space-y-8">
                {/* Candidate Node */}
                <div className="flex items-center justify-center">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-white border border-outline-variant p-1 shadow-xl">
                      <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkdLvDVtYzBRvnUfMUzNQ5ES6uWd8d1rQ_DbpVAUjiIVYFD2nwxK3POBo50li7C2MyI9g8V6XAswueGHtRVDmgJPYbw1SvQIlNj_D7jZQuXyyXvt8DJMJ5lRTqWdZmeO4MH5VHoeIYfLHpVBgfiwZwygklW5VJTAA1h9J-KdO7AwT0L2U19ZAirkw65pYD7XVqxoqtV-04gVxrm58xVshdFaqbXLDrMcUlYwcaimDgJ4oHzv0sYBiL6DIvyMgAUpBi-kkGOxdl_z3h')" }}></div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-success-green text-white p-1 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                    </div>
                  </div>
                </div>

                {/* Connector Line 1 */}
                <div className="flex justify-center -my-6">
                  <div className="h-16 w-px bg-gradient-to-b from-primary/40 to-primary/10"></div>
                </div>

                {/* AI Interview Memory Node */}
                <div className="flex justify-center">
                  <div className="bg-white/85 backdrop-blur-md border border-primary/20 p-6 rounded-2xl shadow-xl ai-glow relative w-[260px]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">psychology</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary mb-0.5 uppercase tracking-wider">Active Engine</p>
                        <p className="text-lg font-bold text-on-surface">Memory Agent</p>
                      </div>
                    </div>
                    {/* Floating Data Cards */}
                    <div className="absolute -top-10 -right-12 bg-white px-3 py-1.5 rounded-xl border border-outline-variant shadow-lg flex items-center gap-2 animate-bounce">
                      <span className="material-symbols-outlined text-success-green text-sm">trending_up</span>
                      <span className="text-xs text-on-surface font-semibold">Confidence +12%</span>
                    </div>
                    <div className="absolute top-4 -left-16 bg-white px-3 py-1.5 rounded-xl border border-outline-variant shadow-lg flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                      <span className="text-xs text-on-surface font-semibold">Memory Updated</span>
                    </div>
                    <div className="absolute -bottom-6 -right-6 bg-on-surface text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                      <span className="text-base font-extrabold leading-none">85</span>
                      <span className="text-[10px] opacity-75 font-semibold uppercase tracking-wider">Current Score</span>
                    </div>
                  </div>
                </div>

                {/* Connector Line 2 */}
                <div className="flex justify-center -my-6">
                  <div className="h-16 w-px bg-gradient-to-b from-primary/10 to-primary/40"></div>
                </div>

                {/* Progress Visualization */}
                <div className="flex justify-center">
                  <div className="w-full max-w-[280px] bg-white/40 border border-outline-variant/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-on-surface-variant font-medium">Profile Readiness</span>
                      <span className="text-xs text-primary font-bold">{step === 1 ? "35%" : step === 2 ? "65%" : "100%"}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(30,0,169,0.4)] transition-all duration-500"
                        style={{ width: step === 1 ? "35%" : step === 2 ? "65%" : "100%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
