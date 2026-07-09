"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser, useClerk } from "@clerk/nextjs";
import Sidebar from "@/components/common/Sidebar";
import { useSettingsStore } from "@/store/useSettingsStore";
import { API } from "@/lib/utils/constants";
import type { AIProvider, Report } from "@/types";
import { computeStreak } from "@/lib/utils/memoryInsights";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const EXPERIENCE_OPTIONS = ["0-2 Years", "3-5 Years", "6-10 Years", "10+ Years"];
const COMPANY_OPTIONS = ["Google", "Amazon", "Microsoft", "Meta", "NVIDIA"];
const INTERVIEW_TYPE_OPTIONS = ["behavioral", "technical", "system_design"];
const DIFFICULTY_OPTIONS = ["EASY", "MEDIUM", "HARD"] as const;

interface ProfileData {
  user: { id: string; email: string; fullName: string };
  profile: {
    experience: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    targetRole: string | null;
    preferredDifficulty: "EASY" | "MEDIUM" | "HARD";
    targetCompanies: string[];
    interviewTypes: string[];
  } | null;
}

function formatInterviewType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const {
    provider,
    targetRole,
    voiceEnabled,
    persistentContext,
    gapAnalysis,
    weeklyGoal,
    setProvider,
    setTargetRole,
    setVoiceEnabled,
    setPersistentContext,
    setGapAnalysis,
    setWeeklyGoal,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [memoryNodeCount, setMemoryNodeCount] = useState(0);
  const [memoryOk, setMemoryOk] = useState<boolean | null>(null);

  // Profile tab form
  const [experience, setExperience] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveState, setProfileSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [profileError, setProfileError] = useState("");

  // Preferences tab form
  const [preferredDifficulty, setPreferredDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<string[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaveState, setPrefsSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [prefsError, setPrefsError] = useState("");

  // Reset memory
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "done" | "error">("idle");

  // Delete account (clear data)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "done" | "error">("idle");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        const data: ProfileData = j.data;
        setProfileData(data);
        setExperience(data.profile?.experience ?? "");
        setGithubUrl(data.profile?.githubUrl ?? "");
        setLinkedinUrl(data.profile?.linkedinUrl ?? "");
        setPreferredDifficulty(data.profile?.preferredDifficulty ?? "MEDIUM");
        setTargetCompanies(data.profile?.targetCompanies ?? []);
        setInterviewTypes(data.profile?.interviewTypes ?? []);
        if (data.profile?.targetRole) setTargetRole(data.profile.targetRole);
      })
      .catch(() => setProfileData(null));

    fetch(API.reports)
      .then((r) => r.json())
      .then((j) => setReports(Array.isArray(j.data) ? j.data : []))
      .catch(() => setReports([]));

    fetch(API.memory)
      .then((r) => r.json())
      .then((j) => {
        const nodes = Array.isArray(j.data) ? j.data : j.data?.nodes ?? [];
        setMemoryNodeCount(nodes.length);
        setMemoryOk(Boolean(j.success ?? j.ok));
      })
      .catch(() => setMemoryOk(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileSaveState("idle");
    setProfileError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, githubUrl, linkedinUrl }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Failed to save profile");
      setProfileSaveState("saved");
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
      setProfileSaveState("error");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    setPrefsSaveState("idle");
    setPrefsError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, preferredDifficulty, targetCompanies, interviewTypes }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Failed to save preferences");
      setPrefsSaveState("saved");
      toast.success("Preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save preferences");
      setPrefsSaveState("error");
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleCompany = (company: string) => {
    setTargetCompanies([company]);
  };

  const toggleInterviewType = (type: string) => {
    setInterviewTypes([type]);
  };

  const handleResetMemory = async () => {
    if (!profileData?.user.id) return;
    setResetting(true);
    setResetState("idle");
    try {
      const res = await fetch("/api/cognee/forget", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileData.user.id }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Failed to reset memory");
      setResetState("done");
      setMemoryNodeCount(0);
      setConfirmResetOpen(false);
      toast.success("Memory reset successfully");
    } catch {
      toast.error("Failed to reset memory");
      setResetState("error");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profileData?.user.id) return;
    setDeletingData(true);
    setDeleteState("idle");
    try {
      await fetch("/api/cognee/forget", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileData.user.id }),
      });
      const res = await fetch("/api/user/data", { method: "DELETE" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || "Failed to delete data");
      
      setDeleteState("done");
      setConfirmDeleteOpen(false);
      toast.success("Account data deleted");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to delete account data");
      setDeleteState("error");
    } finally {
      setDeletingData(false);
    }
  };

  const streak = computeStreak(reports);
  const displayName = user?.fullName || user?.firstName || profileData?.user.fullName || "Candidate";
  const email = profileData?.user.email ?? "";
  const avatarUrl = user?.imageUrl;

  const confirmResetDialog =
    confirmResetOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => !resetting && setConfirmResetOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-2xl bg-error-red/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error-red">psychology</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Reset AI memory?</h2>
              <p className="text-sm text-on-surface-variant mt-2">
                This permanently deletes everything your AI interviewer remembers about your past sessions. This can&apos;t be undone.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setConfirmResetOpen(false)}
                  disabled={resetting}
                  className="py-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetMemory}
                  disabled={resetting}
                  className="py-3 rounded-xl bg-error-red text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? "Resetting..." : "Reset Memory"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const confirmDeleteDialog =
    confirmDeleteOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => !deletingData && setConfirmDeleteOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-6 "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-2xl bg-error-red/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error-red">delete_forever</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Delete Account Data?</h2>
              <p className="text-sm text-on-surface-variant mt-2">
                This permanently deletes all your interviews, reports, and AI memory. Your account and profile settings will remain. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setConfirmDeleteOpen(false)}
                  disabled={deletingData}
                  className="py-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingData}
                  className="py-3 rounded-xl bg-error-red text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {deletingData ? "Deleting..." : "Delete Data"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] p-4 sm:p-gutter pt-20 lg:pt-6 min-h-screen flex-1">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[16rem_1fr] xl:grid-cols-[16rem_1fr_18rem] gap-6 lg:gap-xl pb-32">

          {/* Left Side Settings Menu */}
          <div className="w-full space-y-1 lg:sticky lg:top-6 lg:self-start">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              <h3 className="hidden lg:block text-[10px] font-bold text-on-surface-variant px-4 py-2 uppercase tracking-wider">Personal</h3>
              <button
                onClick={() => setActiveTab("profile")}
                className={`shrink-0 lg:w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "profile" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">person</span> Profile
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`shrink-0 lg:w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "preferences" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">tune</span> Preferences
              </button>

              <h3 className="hidden lg:block text-[10px] font-bold text-on-surface-variant px-4 py-2 uppercase tracking-wider mt-6">App Settings</h3>

              <button
                onClick={() => setActiveTab("memory")}
                className={`shrink-0 lg:w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "memory" ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">neurology</span> AI Memory
              </button>
            </div>
          </div>

          {/* Scrollable Content Canvas */}
          <div className="min-w-0 space-y-8">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-container/10 border border-outline-variant/30 flex items-center justify-center">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="w-full h-full object-cover" alt={displayName} src={avatarUrl} />
                      ) : (
                        <span className="text-2xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <button
                      onClick={() => openUserProfile()}
                      className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-on-surface truncate">{displayName}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed truncate">{email}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">Manage name, email & photo via your account settings.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                  <div className="space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Experience Level</label>
                    <select
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium cursor-pointer"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    >
                      <option value="">Select experience</option>
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">GitHub URL</label>
                    <div className="flex items-center bg-white border border-outline-variant rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">code</span>
                      <input
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none"
                        type="text"
                        placeholder="https://github.com/username"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">LinkedIn URL</label>
                    <div className="flex items-center bg-white border border-outline-variant rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">link</span>
                      <input
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none"
                        type="text"
                        placeholder="https://linkedin.com/in/username"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2 pt-4 border-t border-outline-variant/30">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Resume</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        Upload New Resume
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              setSavingProfile(true);
                              const res = await fetch("/api/user/resume", {
                                method: "POST",
                                body: formData,
                              });
                              const j = await res.json();
                              if (!res.ok || !j.success) throw new Error(j.error || "Failed to upload resume");
                              toast.success("Resume uploaded");
                            } catch (err: any) {
                              toast.error(err.message || "Failed to upload resume");
                            } finally {
                              setSavingProfile(false);
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-on-surface-variant font-medium">PDF format only. Uploading will replace your active resume.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary shadow-md hover:bg-[#4338CA] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
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
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Weekly Goal (Interviews)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium"
                      value={weeklyGoal}
                      onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Preferred Difficulty</label>
                    <div className="flex gap-2">
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setPreferredDifficulty(d)}
                          className={`flex-1 py-2.5 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                            preferredDifficulty === d
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                              : "border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm md:col-span-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Target Companies</label>
                    <div className="flex flex-wrap gap-2">
                      {COMPANY_OPTIONS.map((c) => (
                        <button
                          key={c}
                          onClick={() => toggleCompany(c)}
                          className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            targetCompanies.includes(c)
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                              : "border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-sm md:col-span-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">Interview Types</label>
                    <div className="flex flex-wrap gap-2">
                      {INTERVIEW_TYPE_OPTIONS.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleInterviewType(t)}
                          className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            interviewTypes.includes(t)
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                              : "border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {formatInterviewType(t)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-1">
                  <button
                    onClick={savePrefs}
                    disabled={savingPrefs}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary shadow-md hover:bg-[#4338CA] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingPrefs ? "Saving..." : "Save Changes"}
                  </button>
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
                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center justify-between shadow-sm gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Persistent Context</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Allow AI to remember your feedback from previous sessions.</p>
                    </div>
                    <ToggleSwitch checked={persistentContext} onChange={setPersistentContext} />
                  </div>

                  <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center justify-between shadow-sm gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Skill Gap Analysis</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Store identified weaknesses to tailor future difficulty levels.</p>
                    </div>
                    <ToggleSwitch checked={gapAnalysis} onChange={setGapAnalysis} />
                  </div>
                </div>

                <div className="p-6 border border-error/20 bg-error/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-error">Danger Zone: Reset Memory</h4>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      Permanently delete all stored interview context and learning data ({memoryNodeCount} fact{memoryNodeCount === 1 ? "" : "s"} stored).
                    </p>
                    {resetState === "done" && <p className="text-xs font-bold text-success-green mt-1">Memory reset.</p>}
                    {resetState === "error" && <p className="text-xs font-bold text-error-red mt-1">Failed to reset memory.</p>}
                  </div>
                  <button
                    onClick={() => setConfirmResetOpen(true)}
                    className="px-6 py-2.5 border border-error text-error hover:bg-error hover:text-white transition-all rounded-xl text-xs font-bold cursor-pointer active:scale-95 shrink-0"
                  >
                    Reset Memory
                  </button>
                </div>
              </section>
            )}

            {/* Account Usage stats */}
            <section className="bg-white border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-on-surface mb-6">Account Usage</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-4 bg-surface-container rounded-2xl">
                  <p className="text-3xl font-extrabold text-primary">{reports.length}</p>
                  <p className="text-[9px] font-bold text-on-surface-variant mt-2 uppercase tracking-wider">Interviews</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl">
                  <p className="text-3xl font-extrabold text-primary">{memoryNodeCount}</p>
                  <p className="text-[9px] font-bold text-on-surface-variant mt-2 uppercase tracking-wider">Memory Facts</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl">
                  <p className="text-3xl font-extrabold text-on-surface-variant">Free</p>
                  <p className="text-[9px] font-bold text-on-surface-variant mt-2 uppercase tracking-wider">Account Status</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-outline-variant/30 text-xs">
                <p className="text-on-surface-variant font-medium">Clear all interview history, reports, and memory.</p>
                <button 
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="px-4 py-2 rounded-lg text-error-red font-bold hover:bg-error-red/10 transition-colors cursor-pointer active:scale-95"
                >
                  Delete Account Data
                </button>
              </div>
            </section>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="w-full xl:w-72 space-y-6">
            {/* Memory Status */}
            <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Memory Status</h4>
                  <span className={`w-2.5 h-2.5 rounded-full ${memoryOk === false ? "bg-error-red" : "bg-success-green animate-pulse"}`}></span>
                </div>
                <p className={`text-xl font-bold leading-none ${memoryOk === false ? "text-error-red" : "text-success-green"}`}>
                  {memoryOk === false ? "Unavailable" : "Active Sync"}
                </p>
                <p className="text-[10px] text-on-surface-variant font-semibold">{memoryNodeCount} facts recalled</p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {confirmResetDialog}
      {confirmDeleteDialog}
    </div>
  );
}
