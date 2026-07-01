import { listMemory } from "./client";

export async function getMemoryGraph(userId: string) {
  const nodes = await listMemory(userId);
  return { nodes, edges: [] as Array<{ source: string; target: string }> };
}
