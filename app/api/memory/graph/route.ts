import { NextRequest, NextResponse } from "next/server";
import { recallFacts } from "@/services/cognee.service";
import { requireUserId, getOrCreateDBUser, AuthError } from "@/services/auth.service";
import { errorResponse, ok } from "@/lib/utils/api";
import type { MemoryNode } from "@/types";

const DEFAULT_QUERY =
  "List everything you know about this candidate: strengths, weaknesses, skills, target companies, and recommendations from past interviews.";

export async function GET(request: NextRequest) {
  try {
    const clerkId = await requireUserId();
    await getOrCreateDBUser(clerkId);

    const q = request.nextUrl.searchParams.get("q")?.trim();
    const facts = await recallFacts(q || DEFAULT_QUERY);

    const nodes: MemoryNode[] = facts.map((content, index) => ({
      id: `mem-${index}`,
      userId: clerkId,
      content,
      kind: "fact",
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json(ok({ nodes, edges: [] as Array<{ source: string; target: string }> }));
  } catch (reason) {
    if (reason instanceof AuthError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return errorResponse(reason, "memory graph error");
  }
}
