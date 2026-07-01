export type ID = string;
export type Role = "candidate" | "admin";
export type AIProvider = "openai" | "gemini";

export interface User {
  id: ID;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export * from "./interview";
export * from "./report";
export * from "./memory";
export * from "./analytics";
export * from "./speech";
