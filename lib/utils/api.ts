import { NextResponse } from "next/server";

export function ok<T>(data: T) {
  return { ok: true as const, data };
}

export function fail(error: string) {
  return { ok: false as const, error };
}

export function notImplemented(feature: string) {
  return NextResponse.json(fail(`${feature} is not configured`), { status: 501 });
}

export function errorResponse(reason: unknown, fallback: string) {
  const message = reason instanceof Error ? reason.message : fallback;
  return NextResponse.json(fail(message), { status: 500 });
}
