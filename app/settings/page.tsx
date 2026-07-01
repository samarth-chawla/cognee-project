"use client";

import { useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { AIProvider } from "@/types";

export default function SettingsPage() {
  const {
    provider,
    targetRole,
    voiceEnabled,
    setProvider,
    setTargetRole,
    setVoiceEnabled,
  } = useSettingsStore();

  const [fullName, setFullName] = useState("Samarth");
  const [title, setTitle] = useState("Senior Frontend Engineer");
  const [bio, setBio] = useState(
    "Passionate about building performant web applications and mastering system design. Currently focused on React ecosystems and distributed systems."
  );
  const [linkedin, setLinkedin] = useState("linkedin.com/in/samarth");
  const [github, setGithub] = useState("@samarth-dev");
  const [activeTab, setActiveTab] = useState("profile");

  const [persistentContext, setPersistentContext] = useState(true);
  const [gapAnalysis, setGapAnalysis] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [goalAchievements, setGoalAchievements] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <Sidebar currentRole={targetRole || "Software Engineer"} />

      {/* Main Content Area */}
      <main className="ml-64 p-gutter w-full min-h-screen flex-1">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-xl pt-6 pb-32">
          
          {/* Left Side Settings Menu */}
          <div className="w-full lg:w-64 shrink-0 space-y-1">
            <h3 className="text-[10px] font-bold text-on-surface-variant px-4 py-2 uppercase tracking-wider">Personal</h3>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "profile" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">person</span> Profile
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "preferences" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">tune</span> Preferences
            </button>
            
            <h3 className="text-[10px] font-bold text-on-surface-variant px-4 py-2 uppercase tracking-wider mt-6">App Settings</h3>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "notifications" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">notifications_active</span> Notifications
            </button>
            <button
              onClick={() => setActiveTab("memory")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "memory" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">neurology</span> AI Memory
            </button>
          </div>

          {/* Scrollable Content Canvas */}
          <div className="flex-1 space-y-8">
            <section>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary font-bold text-[10px] uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-[14px]">settings</span> SETTINGS
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Manage your interview profile</h2>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">Customize your AI interviewer and account preferences to get the best practice experience.</p>
            </section>

            {/* Profile Section */}
            {activeTab === "profile" && (
              <section className="bg-white border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-container/10 border border-outline-variant/30 flex items-center justify-center">
                      <img
                        className="w-full h-full object-cover"
                        alt="Profile avatar"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu2xcTJEgh6AeExYKNVFDMOSh0Knu6LiRMsLDoz4vAvwajF27spYC3JauQygEccryBsB30Pq8qym7M-NMJGPcmoyZvfFqhKNJ3qoU0KNaCBZLkuOUmX12eJjWsKjkkkBi8GRNWC0BkYALt2RRLw36A5r1ZIhSPLsUibRXQzQV1Ag6MnhI-Nimz6RVF0buLAXowvM64TtjgbIWGm3hgPLBtuK9iCwZtBhJkLrAChsx0JecwCh95QWWQSeXRbDgF9sK3M5iCIdi6gxGN"
                      />
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Personal Information</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Updates are synced across all your interview sessions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                  <div className="space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Full Name</label>
                    <input
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Professional Title</label>
                    <input
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Bio</label>
                    <textarea
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium leading-relaxed"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">LinkedIn URL</label>
                    <div className="flex items-center bg-white border border-outline-variant rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">link</span>
                      <input
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none"
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">GitHub Handle</label>
                    <div className="flex items-center bg-white border border-outline-variant rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">code</span>
                      <input
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none"
                        type="text"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Preferences Section */}
            {activeTab === "preferences" && (
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-on-surface px-1">Interview Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Target Role</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">AI provider</label>
                    <div className="flex gap-4">
                      {(["openai", "gemini"] as AIProvider[]).map((p) => {
                        const isSelected = provider === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setProvider(p)}
                            className={`flex-1 py-2.5 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                : "border-outline-variant/30 text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">Voice Response Model</h4>
                        <p className="text-xs text-on-surface-variant font-medium mt-1">Practice with speech inputs instead of typing.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voiceEnabled}
                          onChange={(e) => setVoiceEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Notifications Section */}
            {activeTab === "notifications" && (
              <section className="bg-white border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold text-on-surface">Notification Settings</h3>
                <div className="space-y-4 text-xs font-bold">
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="text-sm font-semibold text-on-surface">Session Reminders</span>
                    <input
                      type="checkbox"
                      checked={sessionReminders}
                      onChange={(e) => setSessionReminders(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-5 h-5 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="text-sm font-semibold text-on-surface">Weekly Progress Reports</span>
                    <input
                      type="checkbox"
                      checked={weeklyReports}
                      onChange={(e) => setWeeklyReports(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-5 h-5 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-semibold text-on-surface">Goal Achievements</span>
                    <input
                      type="checkbox"
                      checked={goalAchievements}
                      onChange={(e) => setGoalAchievements(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* AI Memory Settings Section */}
            {activeTab === "memory" && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                  <h3 className="text-lg font-bold text-on-surface">AI Memory Preferences</h3>
                </div>
                
                <div className="space-y-4 text-xs font-bold">
                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Persistent Context</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Allow AI to remember your feedback from previous sessions.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={persistentContext}
                        onChange={(e) => setPersistentContext(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Skill Gap Analysis</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Store identified weaknesses to tailor future difficulty levels.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gapAnalysis}
                        onChange={(e) => setGapAnalysis(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border border-error/20 bg-error/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-error">Danger Zone: Reset Memory</h4>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">Permanently delete all stored interview context and learning data.</p>
                  </div>
                  <button className="px-6 py-2.5 border border-error text-error hover:bg-error hover:text-white transition-all rounded-xl text-xs font-bold cursor-pointer active:scale-95">
                    Reset Memory
                  </button>
                </div>
              </section>
            )}

            {/* Account Usage stats */}
            <section className="bg-white border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-on-surface mb-6">Account Usage</h3>
              <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-4 bg-surface-container rounded-2xl">
                  <p className="text-3xl font-extrabold text-primary">24</p>
                  <p className="text-[9px] font-bold text-on-surface-variant mt-2 uppercase tracking-wider">INTERVIEWS</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl">
                  <p className="text-3xl font-extrabold text-primary">186</p>
                  <p className="text-[9px] font-bold text-on-surface-variant mt-2 uppercase tracking-wider">MEMORY ENTRIES</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl">
                  <p className="text-3xl font-extrabold text-success-green">PRO</p>
                  <p className="text-[9px] font-bold text-on-surface-variant mt-2 uppercase tracking-wider">ACCOUNT STATUS</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-outline-variant/30 text-xs">
                <p className="text-on-surface-variant font-medium">Need to leave us? This action is permanent and will remove all your data.</p>
                <button className="text-error font-bold hover:underline cursor-pointer">Delete Account</button>
              </div>
            </section>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="w-72 shrink-0 space-y-6 hidden xl:block">
            {/* Memory Status */}
            <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">MEMORY STATUS</h4>
                  <span className="w-2.5 h-2.5 bg-success-green rounded-full animate-pulse"></span>
                </div>
                <p className="text-xl font-bold text-success-green leading-none">Active Sync</p>
                <p className="text-[10px] text-on-surface-variant font-semibold">Last synced 2 hours ago</p>
                <div className="pt-4 border-t border-outline-variant/30">
                  <div className="flex justify-between text-[10px] font-bold mb-2 text-on-surface-variant uppercase tracking-wider">
                    <span>Storage Used</span>
                    <span>14.2 MB</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl p-6 shadow-md">
              <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-2">CURRENT STREAK</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">8</span>
                <span className="text-sm font-semibold">Days</span>
              </div>
              <div className="mt-4 flex gap-1">
                <div className="flex-1 h-1 bg-white rounded-full"></div>
                <div className="flex-1 h-1 bg-white rounded-full"></div>
                <div className="flex-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
