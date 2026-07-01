import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Short unique id — fine for hackathon/demo use. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Wrap a value in the standard API envelope. */
export function ok<T>(data: T) {
  return { ok: true as const, data };
}

export function fail(error: string) {
  return { ok: false as const, error };
}
