import type { ID } from "./index";

export interface MemoryNode {
  id: ID;
  userId: ID;
  content: string;
  kind: "fact" | "preference" | "weakness" | "strength" | "note";
  source?: string;
  createdAt: string;
}

export interface MemoryQueryResult {
  nodes: MemoryNode[];
  answer?: string;
}
