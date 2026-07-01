import { NextRequest, NextResponse } from "next/server";
import { addMemory } from "@/lib/cognee/client";
import { getMemory, queryMemory } from "@/services/memory.service";
import { errorResponse, fail, ok } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
    const query = request.nextUrl.searchParams.get("q");
    return NextResponse.json(ok(query ? await queryMemory(userId, query) : await getMemory(userId)));
  } catch (reason) { return errorResponse(reason, "memory error"); }
}

export async function POST(request: NextRequest) {
  try {
    const { userId = "demo-user", content, kind, source } = await request.json();
    if (!content) return NextResponse.json(fail("content required"), { status: 400 });
    return NextResponse.json(ok(await addMemory(userId, content, kind, source)));
  } catch (reason) { return errorResponse(reason, "memory error"); }
}
