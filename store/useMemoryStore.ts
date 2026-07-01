import { create } from "zustand";
import type { MemoryNode } from "@/types";

interface MemoryState { nodes: MemoryNode[]; setNodes: (nodes: MemoryNode[]) => void; }
export const useMemoryStore = create<MemoryState>((set) => ({ nodes: [], setNodes: (nodes) => set({ nodes }) }));
