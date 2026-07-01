import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notImplemented, ok } from "@/lib/utils/api";
export async function GET() { return NextResponse.json(ok(await getCurrentUser())); }
export async function PATCH() { return notImplemented("Profile updates"); }
