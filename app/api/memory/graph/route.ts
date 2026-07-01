import { NextRequest, NextResponse } from "next/server";
import { getMemoryGraph } from "@/lib/cognee/graph";
import { errorResponse, ok } from "@/lib/utils/api";
export async function GET(request: NextRequest) {
  try { const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user"; return NextResponse.json(ok(await getMemoryGraph(userId))); }
  catch (reason) { return errorResponse(reason, "memory graph error"); }
}
