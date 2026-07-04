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
