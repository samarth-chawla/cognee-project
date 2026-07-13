export const APP_NAME = "Clutchly";
export const APP_TAGLINE = "The AI Coach That Never Forgets.";
export const APP_TAGLINE_ALT = "Practice. Improve. Get Hired.";
export const APP_DESCRIPTION =
  "Clutchly is your AI interview coach that remembers every interview, adapts to your progress, and helps you become interview-ready through personalized voice practice.";

export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/clutchly",
  github: "https://github.com/clutchly",
  linkedin: "https://linkedin.com/company/clutchly",
} as const;

// Support forms (Typeform) used by the footer. Temporary placeholder URLs —
// replace with the real Typeform form links when available.
export const CONTACT_FORM_URL =
  "https://form.typeform.com/to/JddmsEdK";
export const FEEDBACK_FORM_URL =
  "https://form.typeform.com/to/REPLACE_WITH_FEEDBACK_FORM";
export const BUG_REPORT_FORM_URL =
  "https://form.typeform.com/to/REPLACE_WITH_BUG_REPORT_FORM";

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
