"use client";

import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { API } from "@/lib/utils/constants";
import type { AuthSession } from "@/types";

/** Client-side auth helper backed by /api/auth/me. */
export function useAuth() {
  const { user, token, setSession, clear } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API.auth, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        const session = json.data as AuthSession;
        setSession(session.user, session.token);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setSession]
  );

  const logout = useCallback(() => clear(), [clear]);

  return { user, token, loading, error, login, logout };
}
