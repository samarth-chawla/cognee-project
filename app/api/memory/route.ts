import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/utils";
import { addMemory } from "@/lib/cognee";
import { getMemory, queryMemory } from "@/services/memoryService";

/**
 * GET  /api/memory?userId=&q=   -> list or semantic-search memory
 * POST /api/memory              -> { userId, content, kind?, source? } add memory
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "demo-user";
    const q = searchParams.get("q");

    const data = q ? await queryMemory(userId, q) : await getMemory(userId);
    return NextResponse.json(ok(data));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "memory error"),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId = "demo-user", content, kind, source } = await req.json();
    if (!content) {
      return NextResponse.json(fail("content required"), { status: 400 });
    }
    const node = await addMemory(userId, content, kind, source);
    return NextResponse.json(ok(node));
  } catch (e) {
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "memory error"),
      { status: 500 }
    );
  }
}
