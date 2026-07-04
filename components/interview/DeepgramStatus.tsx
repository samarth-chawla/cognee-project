"use client";

import { useEffect, useState } from "react";

import { useDeepgram, type DeepgramConnectionState } from "@/hooks/useDeepgram";

const STATUS: Record<
  DeepgramConnectionState,
  { dot: string; label: string; emoji: string }
> = {
  DISCONNECTED: { dot: "bg-gray-400", label: "Disconnected", emoji: "⚪" },
  CONNECTING: { dot: "bg-yellow-400 animate-pulse", label: "Connecting…", emoji: "🟡" },
  CONNECTED: { dot: "bg-green-500", label: "Connected", emoji: "🟢" },
  ERROR: { dot: "bg-red-500", label: "Connection Failed", emoji: "🔴" },
};

/** Live countdown to token expiry, refreshed once per second. */
function useCountdown(expiresAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const remaining = Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000));
  return remaining > 0 ? `${remaining}s` : "expired";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10 last:border-0">
      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-bold text-on-surface font-mono truncate max-w-[60%] text-right">
        {value}
      </span>
    </div>
  );
}

/**
 * Step 1 verification surface for the Deepgram connection. Renders the live
 * connection status, a lightweight health check (connection id, token expiry,
 * latency), and connect/disconnect controls. Intentionally standalone so it can
 * be dropped into any page without touching the V1 interview flow.
 */
export function DeepgramStatus() {
  const {
    state,
    error,
    isConnected,
    connectionId,
    tokenExpiresAt,
    latencyMs,
    connect,
    disconnect,
  } = useDeepgram();

  const status = STATUS[state];
  const busy = state === "CONNECTING";
  const countdown = useCountdown(tokenExpiresAt);

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
          Deepgram Connection
        </h2>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status.dot}`} aria-hidden />
          <span className="text-xs font-semibold text-on-surface-variant">
            {status.emoji} {status.label}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {isConnected && (
        <div className="bg-surface-container/50 rounded-xl px-4 py-2 mb-4">
          <Metric label="Connection ID" value={connectionId ?? "—"} />
          <Metric
            label="Token Expiry"
            value={countdown ? `${countdown} left` : "—"}
          />
          <Metric label="Latency" value={latencyMs != null ? `${latencyMs} ms` : "—"} />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={connect}
          disabled={busy || isConnected}
          className="flex-1 h-10 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {busy ? "Connecting…" : "Connect"}
        </button>
        <button
          onClick={disconnect}
          disabled={state === "DISCONNECTED"}
          className="flex-1 h-10 border border-outline-variant text-on-surface-variant rounded-xl text-xs font-bold hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
