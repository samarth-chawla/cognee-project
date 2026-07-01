export function isStartInterviewInput(value: unknown): value is { role: string; userId?: string } {
  return typeof value === "object" && value !== null && typeof (value as { role?: unknown }).role === "string";
}
