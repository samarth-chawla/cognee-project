export function isOnboardingInput(value: unknown): value is { targetRole: string } {
  return typeof value === "object" && value !== null && typeof (value as { targetRole?: unknown }).targetRole === "string";
}
