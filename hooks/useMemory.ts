"use client";

import { useCallback, useState } from "react";
import type { MemoryNode } from "@/types";
import { API } from "@/lib/utils/constants";

export function useMemory() {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (userId = "demo-user") => {
    setLoading(true);
    try {
      const response = await fetch(`${API.memory}?userId=${encodeURIComponent(userId)}`);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error);
      setNodes(payload.data);
    } finally { setLoading(false); }
  }, []);
  return { nodes, loading, load };
}
