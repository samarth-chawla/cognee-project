import { NextRequest, NextResponse } from "next/server";
import { ok, fail, uid, nowISO } from "@/lib/utils";
import type { AuthSession, User } from "@/types";

/**
 * POST /api/auth
 * body: { action: "login" | "register", email, password, name? }
 *
 * Demo stub — swap in real password hashing + DB lookup for production.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, email, name } = await req.json();
    if (!email) return NextResponse.json(fail("email required"), { status: 400 });

    const user: User = {
      id: uid("user"),
      email,
      name: name ?? email.split("@")[0],
      role: "candidate",
      createdAt: nowISO(),
    };

    const session: AuthSession = { user, token: uid("token") };
    return NextResponse.json(ok(session));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "auth error"),
      { status: 500 }
    );
  }
}
