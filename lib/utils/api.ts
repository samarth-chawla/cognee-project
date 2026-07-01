import { NextResponse } from "next/server";
import type { ZodError } from "zod";

// Legacy response helpers (ok / fail shape)
export function ok<T>(data: T) {
  return { ok: true as const, data };
}

export function fail(error: string) {
  return { ok: false as const, error };
}

// Phase 2 response helpers (success / failure shape)
export function success<T>(data: T) {
  return NextResponse.json({ success: true as const, data });
}

export function failure(message: string, status = 400) {
  return NextResponse.json({ success: false as const, message }, { status });
}

export function failureWithErrors(message: string, errors: unknown, status = 400) {
  return NextResponse.json({ success: false as const, message, errors }, { status });
}

export function handleZodError(error: ZodError) {
  const messages = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return failureWithErrors("Validation failed", messages, 422);
}

// Shared utilities
export function notImplemented(feature: string) {
  return NextResponse.json(fail(`${feature} is not configured`), { status: 501 });
}

export function errorResponse(reason: unknown, fallback: string) {
  const message = reason instanceof Error ? reason.message : fallback;
  return NextResponse.json(fail(message), { status: 500 });
}

export function unauthorized() {
  return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
}
