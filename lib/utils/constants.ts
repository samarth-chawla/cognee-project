export const APP_NAME = "ARIA";
export const APP_DESCRIPTION = "AI mock interviews with long-term memory. ARIA tracks your performance and tailors questions to help you land your dream job.";

export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/aria_interview",
  github: "https://github.com/aria-interview",
  linkedin: "https://linkedin.com/company/aria-interview",
} as const;

// Support contacts used by the footer. Temporary placeholders — easy to replace later.
export const CONTACT_EMAIL = "support@interviewmemoryagent.com";
export const FEEDBACK_EMAIL = "feedback@interviewmemoryagent.com";
export const BUG_REPORT_EMAIL = "support@interviewmemoryagent.com";

export const ROUTES = {
  home: "/",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  interview: "/dashboard/interview",
  reports: "/dashboard/reports",
  memory: "/dashboard/memory",
  flow: "/dashboard/flow",
  settings: "/dashboard/settings",
} as const;

export const API = {
  auth: "/api/auth/me",
  interview: "/api/interview/start",
  interviewAnswer: "/api/interview/answer",
  interviewNext: "/api/interview/next",
  interviewEnd: "/api/interview/end",
  interviewCancel: "/api/interview/cancel",

  // Voice Agent (V2) — persistent Deepgram Voice Agent interview.
  interviewVoiceToken: "/api/interview/voice/token",
  interviewVoiceAnswer: "/api/interview/voice/answer",
  pendingReport: "/api/interview/pending-report",
  speech: "/api/speech/transcribe",
  memory: "/api/memory/graph",
  reports: "/api/interview/history",
  analytics: "/api/analytics",
} as const;

export const QUESTION_TYPES = ["behavioral", "technical", "system_design", "coding"] as const;
export const DEFAULT_MODELS = { gemini: "gemini-2.5-flash-lite" } as const;
export const MAX_INTERVIEW_QUESTIONS = 8;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
