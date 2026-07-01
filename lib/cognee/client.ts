import type { MemoryNode, MemoryQueryResult } from "@/types";
import { nowISO, uid } from "@/lib/utils";

/**
 * Thin client for a Cognee service.
 *
 * Cognee is a Python-based memory/knowledge-graph engine. In this app we talk
 * to it over an HTTP sidecar (COGNEE_API_URL). If that env var is not set the
 * client falls back to a no-op in-memory stub so the app still runs in a demo.
 */

const BASE = process.env.COGNEE_API_URL;
const KEY = process.env.COGNEE_API_KEY;

// In-memory fallback store (per server process).
const stub: MemoryNode[] = [];

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}),
  };
}

/** Add content to the user's memory graph. */
export async function addMemory(
  userId: string,
  content: string,
  kind: MemoryNode["kind"] = "note",
  source?: string
): Promise<MemoryNode> {
  const node: MemoryNode = {
    id: uid("mem"),
    userId,
    content,
    kind,
    source,
    createdAt: nowISO(),
  };

  if (!BASE) {
    stub.push(node);
    return node;
  }

  const res = await fetch(`${BASE}/add`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, content, kind, source }),
  });
  if (!res.ok) throw new Error(`Cognee add failed: ${res.status}`);
  return (await res.json()) as MemoryNode;
}

/** Trigger Cognee to build/refresh the knowledge graph ("cognify"). */
export async function cognify(userId: string): Promise<void> {
  if (!BASE) return;
  const res = await fetch(`${BASE}/cognify`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`Cognee cognify failed: ${res.status}`);
}

/** Semantic search over the user's memory graph. */
export async function searchMemory(
  userId: string,
  q: string
): Promise<MemoryQueryResult> {
  if (!BASE) {
    const nodes = stub.filter(
      (n) => n.userId === userId && n.content.toLowerCase().includes(q.toLowerCase())
    );
    return { nodes };
  }

  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, query: q }),
  });
  if (!res.ok) throw new Error(`Cognee search failed: ${res.status}`);
  return (await res.json()) as MemoryQueryResult;
}

/** List all memory nodes for a user. */
export async function listMemory(userId: string): Promise<MemoryNode[]> {
  if (!BASE) return stub.filter((n) => n.userId === userId);
  const res = await fetch(`${BASE}/list?userId=${encodeURIComponent(userId)}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Cognee list failed: ${res.status}`);
  return (await res.json()) as MemoryNode[];
}
