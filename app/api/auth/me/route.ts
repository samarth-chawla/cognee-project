import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { fail, ok, errorResponse } from "@/lib/utils/api";
import { nowISO, uid } from "@/lib/utils/helpers";
import type { AuthSession, User } from "@/types";

export async function GET() {
  try { return NextResponse.json(ok(await getCurrentUser())); }
  catch (reason) { return errorResponse(reason, "Unable to load current user"); }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    if (!email) return NextResponse.json(fail("email required"), { status: 400 });
    const user: User = { id: uid("user"), email, name: name ?? email.split("@")[0], role: "candidate", createdAt: nowISO() };
    const session: AuthSession = { user, token: uid("token") };
    return NextResponse.json(ok(session));
  } catch (reason) { return errorResponse(reason, "auth error"); }
}
