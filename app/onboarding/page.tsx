"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ROUTES } from "@/lib/utils/constants";

const ALLOWED_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function OnboardingPage() {
  const router = useRouter();
  const { setTargetRole } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [targetRole, setTargetRoleLocal] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsed, setParsed] = useState(false);
  const [parsedData, setParsedData] = useState<{
    charactersExtracted: number;
    pages: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setResumeError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setResumeError("File exceeds 10 MB limit.");
      return;
    }
    setResumeFile(file);
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadResume = async () => {
    if (!resumeFile) return;
    setUploading(true);
    setUploadProgress(0);
    setParsing(false);
    setParsingProgress(0);
    setParsed(false);
    setErrors({});

    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const xhr = new XMLHttpRequest();

      const result = await new Promise<{
        resumeId: string;
        charactersExtracted: number;
        pages: number;
      }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 50);
            setUploadProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const body = JSON.parse(xhr.responseText);
              if (body.success) {
                resolve(body);
              } else {
                reject(new Error(body.error || "Upload failed"));
              }
            } catch {
              reject(new Error("Invalid response from server"));
            }
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error || "Upload failed"));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", "/api/user/resume");
        xhr.send(formData);
      });

      setUploadProgress(50);

      setParsing(true);

      const progressInterval = setInterval(() => {
        setParsingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          clearInterval(progressInterval);

          setParsingProgress(100);
          setParsed(true);
          setParsedData({
            charactersExtracted: result.charactersExtracted,
            pages: result.pages,
          });
          setUploading(false);
          setParsing(false);
          resolve();
        }, 500);
      });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setResumeError(msg);
      setUploading(false);
      setParsing(false);
      throw err;
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!experience) newErrors.experience = "Experience is required";
    if (!targetRole.trim()) newErrors.targetRole = "Target role is required";
    if (githubUrl && !validateUrl(githubUrl)) newErrors.githubUrl = "Invalid GitHub URL";
    if (linkedinUrl && !validateUrl(linkedinUrl)) newErrors.linkedinUrl = "Invalid LinkedIn URL";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!resumeFile) {
        setErrors({ resume: "Please upload a resume" });
        return;
      }
      setStep(3);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setTargetRole(targetRole);
    setErrors({});

    try {
      if (resumeFile && !parsed) {
        await handleUploadResume();
      }

      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience,
          githubUrl: githubUrl || "",
          linkedinUrl: linkedinUrl || "",
          targetRole,
          preferredInterviewMode: "VOICE",
          preferredDifficulty: "MEDIUM",
          targetCompanies: [],
          interviewTypes: [],
        }),
      });

      const body = await res.json();
      if (!body.success) {
        throw new Error(body.message || "Onboarding failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors({ form: msg });
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push(ROUTES.dashboard);
    }, 800);
  };

  const isStep2Disabled = step === 2 && !resumeFile;

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
          <div className="md:col-span-7">
            <div className="bg-white p-lg md:p-xl rounded-xl shadow-2xl ai-glow border border-outline-variant/30">
              <div className="inline-flex items-center gap-sm bg-primary-container/10 px-4 py-1.5 rounded-full mb-6">
                <span className="text-lg">🧠</span>
                <span className="font-semibold text-[11px] text-primary uppercase tracking-wider">Personalized AI Setup</span>
              </div>

              <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-2">Let&apos;s build your interview profile.</h1>
                <p className="text-sm text-on-surface-variant">Clutchly remembers your goals, strengths, weaknesses, and progress—so every interview gets more personal.</p>
              </header>

              <div className="flex items-center gap-md mb-8">
                <div className="flex items-center gap-sm flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>1</div>
                  <span className={`text-xs font-semibold ${step >= 1 ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>Profile</span>
                </div>
                <div className="h-[2px] flex-1 stepper-line"></div>
                <div className="flex items-center gap-sm flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant opacity-60"}`}>2</div>
                  <span className={`text-xs font-semibold ${step >= 2 ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>Resume</span>
                </div>
                <div className="h-[2px] flex-1 stepper-line"></div>
                <div className="flex items-center gap-sm flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant opacity-60"}`}>3</div>
                  <span className={`text-xs font-semibold ${step >= 3 ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>Review</span>
                </div>
              </div>

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
                        placeholder="Your full name"
                        type="text"
                      />
                      {errors.name && <p className="text-xs text-error px-1">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Target Role</label>
                      <input
                        value={targetRole}
                        onChange={(e) => setTargetRoleLocal(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Target role you are applying for"
                        type="text"
                      />
                      {errors.targetRole && <p className="text-xs text-error px-1">{errors.targetRole}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                      >
                        <option value="">Select experience</option>
                        <option>0-2 Years</option>
                        <option>3-5 Years</option>
                        <option>6-10 Years</option>
                        <option>10+ Years</option>
                      </select>
                      {errors.experience && <p className="text-xs text-error px-1">{errors.experience}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">GitHub Profile URL</label>
                      <input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="https://github.com/username"
                        type="url"
                      />
                      {errors.githubUrl && <p className="text-xs text-error px-1">{errors.githubUrl}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">LinkedIn Profile URL</label>
                      <input
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="https://linkedin.com/in/username"
                        type="url"
                      />
                      {errors.linkedinUrl && <p className="text-xs text-error px-1">{errors.linkedinUrl}</p>}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-on-surface">Upload your resume</h2>
                  <p className="text-xs text-on-surface-variant">We&apos;ll extract raw text from your PDF to personalize future interview questions.</p>

                  <div
                    className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
                    onClick={handleDropZoneClick}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary">upload_file</span>
                    </div>
                    <p className="text-sm text-on-surface font-semibold">Click to upload or drag and drop</p>
                    <p className="text-xs text-on-surface-variant mt-1">PDF up to 10MB</p>
                    {resumeFile && (
                      <div className="mt-3 bg-white px-3 py-1.5 rounded-lg border border-outline-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-sm">description</span>
                        <span className="text-xs text-on-surface-variant">{resumeFile.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); setParsed(false); setParsedData(null); setUploadProgress(0); setParsingProgress(0); }} className="text-xs text-on-surface-variant hover:text-error ml-2 cursor-pointer font-bold">&times;</button>
                      </div>
                    )}
                    {resumeError && (
                      <p className="mt-2 text-xs text-error">{resumeError}</p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {(uploading || parsing || parsed) && resumeFile && (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-on-surface-variant">
                          {uploading ? "Uploading..." : parsing ? "Extracting text..." : parsed ? "Text extracted!" : ""}
                        </span>
                        <span className={parsed ? "text-success-green" : "text-primary"}>
                          {parsed ? "100%" : `${Math.min(uploadProgress + parsingProgress, 100)}%`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full shadow-[0_0_8px_rgba(30,0,169,0.4)] transition-all duration-500 ${
                            parsed ? "bg-success-green" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(uploadProgress + parsingProgress, 100)}%` }}
                        ></div>
                      </div>
                      {parsed && parsedData && (
                        <div className="bg-success-green/5 border border-success-green/20 rounded-lg p-4 flex items-start gap-3">
                          <span className="material-symbols-outlined text-success-green text-sm mt-0.5">check_circle</span>
                          <div>
                            <p className="text-xs font-bold text-on-surface">Resume text extracted successfully</p>
                            <p className="text-xs text-on-surface-variant mt-1">
                              {parsedData.charactersExtracted.toLocaleString()} characters extracted from {parsedData.pages} page{parsedData.pages !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


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
                      <span className="font-bold text-on-surface">{targetRole}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-sm">
                      <span className="text-on-surface-variant font-medium">Experience Level</span>
                      <span className="font-bold text-on-surface">{experience}</span>
                    </div>
                    {githubUrl && (
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-sm">
                        <span className="text-on-surface-variant font-medium">GitHub</span>
                        <span className="font-bold text-on-surface text-xs truncate max-w-[180px]">{githubUrl}</span>
                      </div>
                    )}
                    {linkedinUrl && (
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 text-sm">
                        <span className="text-on-surface-variant font-medium">LinkedIn</span>
                        <span className="font-bold text-on-surface text-xs truncate max-w-[180px]">{linkedinUrl}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Resume</span>
                      <span className="font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-success-green text-xs">check_circle</span>
                        {resumeFile?.name || "None"}
                      </span>
                    </div>
                    {parsedData && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-on-surface-variant font-medium">Characters Extracted</span>
                        <span className="font-bold text-on-surface">{parsedData.charactersExtracted.toLocaleString()}</span>
                      </div>
                    )}
                    {parsedData && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-on-surface-variant font-medium">Pages Parsed</span>
                        <span className="font-bold text-on-surface">{parsedData.pages}</span>
                      </div>
                    )}
                  </div>
                  {(uploading || parsing) && (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-on-surface-variant">
                          {uploading ? "Uploading resume..." : "Extracting text..."}
                        </span>
                        <span className="text-primary font-bold">
                          {Math.min(uploadProgress + parsingProgress, 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(30,0,169,0.4)] transition-all duration-500"
                          style={{ width: `${Math.min(uploadProgress + parsingProgress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <footer className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between">
                <button
                  onClick={() => step > 1 && setStep(step - 1)}
                  disabled={step === 1 || loading}
                  className="px-6 py-3 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={step < 3 ? handleNext : handleComplete}
                  disabled={loading || success || isStep2Disabled}
                  className={`px-6 py-3 rounded-lg text-xs font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
                    success
                      ? "bg-success-green shadow-success-green/20"
                      : loading || isStep2Disabled
                      ? "bg-outline-variant text-on-surface-variant cursor-not-allowed shadow-none"
                      : "bg-primary shadow-primary/20 hover:bg-[#4338CA]"
                  }`}
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      Uploading... ({Math.min(uploadProgress + parsingProgress, 100)}%)
                      <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                    </span>
                  ) : parsing ? (
                    <span className="flex items-center gap-2">
                      Parsing... ({Math.min(uploadProgress + parsingProgress, 100)}%)
                      <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                    </span>
                  ) : loading ? (
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
              {errors.form && (
                <p className="mt-4 text-xs text-error text-center">{errors.form}</p>
              )}
            </div>
          </div>

          <div className="md:col-span-5 hidden md:block">
            <div className="relative h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-primary/5 via-transparent to-tertiary/5 rounded-full blur-3xl opacity-60"></div>
              </div>
              <div className="relative z-10 w-full space-y-8">
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

                <div className="flex justify-center -my-6">
                  <div className="h-16 w-px bg-gradient-to-b from-primary/40 to-primary/10"></div>
                </div>

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

                <div className="flex justify-center -my-6">
                  <div className="h-16 w-px bg-gradient-to-b from-primary/10 to-primary/40"></div>
                </div>

                <div className="flex justify-center">
                  <div className="w-full max-w-[280px] bg-white/40 border border-outline-variant/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-on-surface-variant font-medium">Profile Readiness</span>
                      <span className="text-xs text-primary font-bold">{step === 1 ? "30%" : step === 2 ? (parsed ? "80%" : "50%") : "100%"}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(30,0,169,0.4)] transition-all duration-500"
                        style={{ width: step === 1 ? "30%" : step === 2 ? (parsed ? "80%" : "50%") : "100%" }}
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
