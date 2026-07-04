/**
 * Gapless streaming player for raw linear16 PCM produced by the Voice Agent.
 *
 * The agent streams little-endian 16-bit mono PCM chunks over the WebSocket
 * (output encoding `linear16`, container `none`). We convert each chunk to
 * Float32 and schedule it back-to-back on a Web Audio timeline so playback is
 * continuous. `clear()` stops everything instantly for barge-in.
 *
 * Browser-only — instantiate lazily inside a client component/hook.
 */
export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private readonly sampleRate: number;
  /** Next timeline position (seconds) to schedule audio at. */
  private nextStartTime = 0;
  /** Sources currently scheduled — tracked so barge-in can stop them. */
  private sources = new Set<AudioBufferSourceNode>();
  private onPlaybackEnd?: () => void;

  constructor(sampleRate: number, onPlaybackEnd?: () => void) {
    this.sampleRate = sampleRate;
    this.onPlaybackEnd = onPlaybackEnd;
  }

  /** Lazily create/resume the AudioContext (must follow a user gesture). */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx({ sampleRate: this.sampleRate });
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Queue one linear16 PCM chunk for playback. */
  enqueue(chunk: ArrayBuffer): void {
    if (chunk.byteLength === 0) return;
    const ctx = this.ensureContext();

    // linear16 → Float32 in [-1, 1). Handle odd byte lengths defensively.
    const usableBytes = chunk.byteLength - (chunk.byteLength % 2);
    const int16 = new Int16Array(chunk, 0, usableBytes / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    if (float32.length === 0) return;

    const buffer = ctx.createBuffer(1, float32.length, this.sampleRate);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Schedule immediately after whatever is already queued.
    const now = ctx.currentTime;
    const startAt = Math.max(this.nextStartTime, now);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      if (this.sources.size === 0) {
        this.onPlaybackEnd?.();
      }
    };
  }

  /** True while audio is queued/playing. */
  get isPlaying(): boolean {
    return this.sources.size > 0;
  }

  /** Stop and drop all queued audio immediately (barge-in). */
  clear(): void {
    for (const source of this.sources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.sources.clear();
    this.nextStartTime = this.ctx?.currentTime ?? 0;
  }

  /** Tear down the AudioContext. */
  dispose(): void {
    this.clear();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
