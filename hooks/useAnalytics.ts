"use client";

import { useCallback, useState } from "react";
import type { AnalyticsSummary } from "@/types";
import { API } from "@/lib/utils/constants";

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API.analytics);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error);
      setData(payload.data);
    } finally { setLoading(false); }
  }, []);
  return { data, loading, load };
}
