"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Phase 3 - Step 1: Deepgram connection bootstrap.
 *
 * Responsibilities (only): fetch a short-lived token, request microphone access,
 * open the Deepgram WebSocket, and expose the connection state plus a small set
 * of health-check metrics. No STT, no TTS, no transcript handling — those arrive
 * in later steps.
 */

export type DeepgramConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR";

const DEEPGRAM_LISTEN_URL = "wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true";

/** Idle keep-alive cadence. Deepgram closes idle sockets (~10s) without this. */
const KEEP_ALIVE_MS = 8000;

interface TokenResponse {
  success: boolean;
  data?: { token: string; expiresAt: string; expiresIn: number };
  message?: string;
}

export interface DeepgramHealth {
  /** Deepgram request_id once its metadata frame arrives, else a local session id. */
  connectionId: string | null;
  /** ISO expiry of the short-lived browser token. */
  tokenExpiresAt: string | null;
  /** WebSocket handshake round-trip in milliseconds. */
  latencyMs: number | null;
}

export interface UseDeepgramResult extends DeepgramHealth {
  state: DeepgramConnectionState;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Math.random().toString(36).slice(2)}`;
}

export function useDeepgram(): UseDeepgramResult {
  const [state, setState] = useState<DeepgramConnectionState>("DISCONNECTED");
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    if (mountedRef.current) {
      setState("DISCONNECTED");
      setError(null);
      setConnectionId(null);
      setLatencyMs(null);
    }
  }, [cleanup]);

  const connect = useCallback(async () => {
    // Ignore duplicate calls while a connection is already in flight or live.
    if (state === "CONNECTING" || state === "CONNECTED") return;

    setError(null);
    setState("CONNECTING");
    setConnectionId(null);
    setLatencyMs(null);
    setTokenExpiresAt(null);

    // 1. Exchange the server-held API key for a short-lived browser token.
    let token: string;
    try {
      const res = await fetch("/api/speech/token");
      const json = (await res.json()) as TokenResponse;
      if (!res.ok || !json.success || !json.data?.token) {
        throw new Error(json.message || "Could not obtain a Deepgram token");
      }
      token = json.data.token;
      if (mountedRef.current) setTokenExpiresAt(json.data.expiresAt);
    } catch (reason) {
      if (!mountedRef.current) return;
      setState("ERROR");
      setError(
        reason instanceof Error
          ? `Token request failed: ${reason.message}`
          : "Token request failed"
      );
      return;
    }

    // 2. Request microphone permission (kept for later streaming steps).
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (reason) {
      if (!mountedRef.current) return;
      cleanup();
      setState("ERROR");
      const name = reason instanceof DOMException ? reason.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone permission denied"
          : name === "NotFoundError"
            ? "No microphone found"
            : "Could not access the microphone"
      );
      return;
    }

    // 3. Open the Deepgram WebSocket. Browsers can't set Authorization headers,
    //    so the JWT is passed via the Sec-WebSocket-Protocol subprotocols as
    //    ['bearer', <token>] (mirrors Deepgram's ['token', <api-key>] pattern).
    try {
      const handshakeStart = performance.now();
      const socket = new WebSocket(DEEPGRAM_LISTEN_URL, ["bearer", token]);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) return;
        setState("CONNECTED");
        setError(null);
        setLatencyMs(Math.round(performance.now() - handshakeStart));
        setConnectionId(newSessionId());

        // Keep the idle socket open with lightweight KeepAlive control frames.
        keepAliveRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, KEEP_ALIVE_MS);
      };

      // Read Deepgram's Metadata frame only to surface its real request_id.
      socket.onmessage = (event) => {
        if (!mountedRef.current || typeof event.data !== "string") return;
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "Metadata" && payload?.request_id) {
            setConnectionId(payload.request_id as string);
          }
        } catch {
          // Non-JSON frames are irrelevant to the health check.
        }
      };

      socket.onerror = () => {
        if (!mountedRef.current) return;
        setState("ERROR");
        setError("Deepgram WebSocket connection failed");
      };

      socket.onclose = (event) => {
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        if (!mountedRef.current) return;
        // A clean close after an explicit disconnect is already handled there.
        setState((prev) => {
          if (prev === "CONNECTED" && !event.wasClean) {
            setError("Deepgram connection lost");
            return "ERROR";
          }
          return prev === "CONNECTED" ? "DISCONNECTED" : prev;
        });
      };
    } catch (reason) {
      if (!mountedRef.current) return;
      cleanup();
      setState("ERROR");
      setError(
        reason instanceof Error
          ? `WebSocket error: ${reason.message}`
          : "WebSocket error"
      );
    }
  }, [state, cleanup]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    error,
    isConnected: state === "CONNECTED",
    connectionId,
    tokenExpiresAt,
    latencyMs,
    connect,
    disconnect,
  };
}
