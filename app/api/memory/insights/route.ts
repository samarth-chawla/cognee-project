import { NextRequest, NextResponse } from "next/server";
import { queryMemory } from "@/services/memory.service";
import { errorResponse, fail, ok } from "@/lib/utils/api";
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
    const query = request.nextUrl.searchParams.get("q");
    if (!query) return NextResponse.json(fail("q required"), { status: 400 });
    return NextResponse.json(ok(await queryMemory(userId, query)));
  } catch (reason) { return errorResponse(reason, "memory insights error"); }
}
