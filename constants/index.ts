// App-wide constants

export const APP_NAME = "Interview Memory Agent";

export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  interview: "/interview",
  reports: "/reports",
  memory: "/memory",
  settings: "/settings",
} as const;

export const API = {
  auth: "/api/auth",
  interview: "/api/interview",
  evaluation: "/api/evaluation",
  speech: "/api/speech",
  memory: "/api/memory",
  reports: "/api/reports",
} as const;

export const QUESTION_TYPES = [
  "behavioral",
  "technical",
  "system_design",
  "coding",
] as const;

export const DEFAULT_MODELS = {
  openai: "gpt-4o-mini",
  gemini: "gemini-1.5-flash",
} as const;

export const MAX_INTERVIEW_QUESTIONS = 8;
