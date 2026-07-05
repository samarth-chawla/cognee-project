/**
 * Types for the Deepgram Voice Agent interview experience (V2).
 * The conversation state machine drives the UI (mic orb, status pill, etc.).
 */

export type ConversationState =
  | "IDLE"
  | "CONNECTING"
  | "READY"
  | "GREETING"
  | "AI_SPEAKING"
  // Question asked; waiting (20–30s) for the candidate to START speaking. No
  // auto-repeat happens in this state — we simply wait quietly.
  | "WAITING_FOR_FIRST_RESPONSE"
  // Candidate is actively answering. Natural pauses are allowed; we never
  // interrupt. Completion is decided by the LLM (complete_answer) with a
  // silence-timeout fallback.
  | "USER_ANSWERING"
  | "USER_LISTENING"
  | "PROCESSING"
  | "WAITING_FOR_BACKEND"
  | "FINISHED"
  | "EVALUATING"
  | "REPORT_READY"
  | "ERROR";

export type TurnRole = "ai" | "user";

export interface ConversationTurn {
  id: string;
  role: TurnRole;
  text: string;
  /** True while this is a not-yet-finalized live transcript bubble. */
  live?: boolean;
}
