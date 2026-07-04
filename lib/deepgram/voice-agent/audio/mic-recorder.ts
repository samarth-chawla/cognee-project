/**
 * Microphone capture for the Voice Agent.
 *
 * Captures mic audio, downsamples it to the agent's expected input rate, and
 * emits little-endian linear16 PCM chunks via `onChunk`. Uses a ScriptProcessor
 * node for broad browser support (AudioWorklet would need a separate module file
 * and adds no benefit at this chunk size).
 *
 * Browser-only.
 */
export interface MicRecorderOptions {
  /** Target sample rate the agent expects (e.g. 16000). */
  targetSampleRate: number;
  /** Called with each linear16 PCM chunk (transferable ArrayBuffer). */
  onChunk: (chunk: ArrayBuffer) => void;
}

export class MicRecorder {
  private readonly targetSampleRate: number;
  private readonly onChunk: (chunk: ArrayBuffer) => void;

  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;

  constructor(options: MicRecorderOptions) {
    this.targetSampleRate = options.targetSampleRate;
    this.onChunk = options.onChunk;
  }

  /** Request the mic and begin streaming PCM chunks. Throws if permission denied. */
  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();

    this.source = this.ctx.createMediaStreamSource(this.stream);
    // Buffer size 4096 balances latency vs callback overhead.
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);

    const inputRate = this.ctx.sampleRate;

    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsample(input, inputRate, this.targetSampleRate);
      const pcm = floatToLinear16(downsampled);
      this.onChunk(pcm.buffer as ArrayBuffer);
    };

    this.source.connect(this.processor);
    // ScriptProcessor only fires while connected to the graph; route it to a
    // muted destination so we don't echo the mic back to the speakers.
    this.processor.connect(this.ctx.destination);
  }

  /** Stop capture and release the mic + audio graph. */
  stop(): void {
    if (this.processor) {
      this.processor.onaudioprocess = null;
      try {
        this.processor.disconnect();
      } catch {
        /* noop */
      }
      this.processor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        /* noop */
      }
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

/** Linear-interpolation downsample from `inputRate` to `outputRate`. */
function downsample(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Float32Array {
  if (outputRate >= inputRate) {
    return input;
  }
  const ratio = inputRate / outputRate;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const before = Math.floor(pos);
    const after = Math.min(before + 1, input.length - 1);
    const frac = pos - before;
    output[i] = input[before] + (input[after] - input[before]) * frac;
  }
  return output;
}

/** Float32 [-1,1] → little-endian linear16 PCM. */
function floatToLinear16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}
