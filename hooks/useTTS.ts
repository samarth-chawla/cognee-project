"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TTSState = "IDLE" | "LOADING" | "SPEAKING" | "FINISHED" | "ERROR";

export interface UseTTSReturn {
  /** Current playback state machine value. */
  state: TTSState;
  /** Human-readable error message when state === "ERROR". */
  error: string | null;
  /**
   * Fetch audio for `text` from /api/speech/speak and start playing.
   * Safe to call again after FINISHED or ERROR to retry / play next.
   */
  speak: (text: string) => Promise<void>;
  /** Stop playback and reset to IDLE. */
  stop: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTTS(): UseTTSReturn {
  const [state, setState] = useState<TTSState>("IDLE");
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  /** Revoke any previously created blob URL to avoid memory leaks. */
  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  /** Stop any in-progress audio, revoke blob URL. */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    revokeObjectUrl();
    setState("IDLE");
    setError(null);
  }, [revokeObjectUrl]);

  // Cleanup on unmount.
  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(
    async (text: string) => {
      // Guard: do not allow concurrent calls.
      if (state === "LOADING" || state === "SPEAKING") return;

      // Reset previous state.
      stop();
      setError(null);
      setState("LOADING");

      try {
        // ----------------------------------------------------------------
        // 1. Fetch audio from server
        // ----------------------------------------------------------------
        const res = await fetch("/api/speech/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          let message = `TTS request failed (${res.status})`;
          try {
            const json = await res.json();
            if (json?.error) message = json.error;
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }

        // ----------------------------------------------------------------
        // 2. Buffer audio blob and create object URL
        // ----------------------------------------------------------------
        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Received empty audio from TTS");

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        // ----------------------------------------------------------------
        // 3. Play via HTMLAudioElement
        // ----------------------------------------------------------------
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.oncanplaythrough = null; // not needed for blob URLs

          audio.onended = () => {
            setState("FINISHED");
            resolve();
          };

          audio.onerror = () => {
            reject(new Error("Audio playback failed"));
          };

          setState("SPEAKING");
          audio.play().catch(reject);
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown TTS error";
        setError(message);
        setState("ERROR");
      } finally {
        revokeObjectUrl();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, stop, revokeObjectUrl]
  );

  return { state, error, speak, stop };
}
