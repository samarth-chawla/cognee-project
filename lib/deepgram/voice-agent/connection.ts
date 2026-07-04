import type { Deepgram } from "@deepgram/sdk";

/**
 * Browser connection to the Deepgram Voice Agent runtime.
 *
 * Why a raw WebSocket instead of `client.agent.v1.createConnection()`:
 * the SDK's socket runs `JSON.parse(event.data)` on EVERY inbound frame, which
 * throws on the binary linear16 audio the agent streams back — so agent audio
 * can't be received through the SDK in the browser. A raw WebSocket with
 * `binaryType = "arraybuffer"` lets us branch on binary vs JSON ourselves. Auth
 * mirrors the repo's proven Step-1 pattern (`hooks/useDeepgram.ts`): browsers
 * can't set Authorization headers, so the minted access token rides in the
 * `Sec-WebSocket-Protocol` subprotocols as `["bearer", <token>]`.
 *
 * Message shapes reuse the SDK's generated types (`Deepgram.agent.*`) so the
 * wire protocol stays faithful — nothing is invented.
 */

export const AGENT_CONVERSE_URL =
  "wss://agent.deepgram.com/v1/agent/converse";

/** Any JSON control frame the agent can send us (audio is handled separately). */
export type AgentServerMessage = { type?: string; [key: string]: unknown };

export interface AgentConnectionHandlers {
  onOpen?: () => void;
  /** JSON control frame (branch on `.type`). */
  onMessage?: (message: AgentServerMessage) => void;
  /** Binary linear16 audio chunk from the agent's TTS. */
  onAudio?: (chunk: ArrayBuffer) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
}

export class AgentConnection {
  private socket: WebSocket | null = null;
  private readonly handlers: AgentConnectionHandlers;

  constructor(handlers: AgentConnectionHandlers = {}) {
    this.handlers = handlers;
  }

  /** Open the socket with the minted access token. Resolves once OPEN. */
  connect(accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(AGENT_CONVERSE_URL, ["bearer", accessToken]);
      socket.binaryType = "arraybuffer";
      this.socket = socket;

      socket.onopen = () => {
        settled = true;
        this.handlers.onOpen?.();
        resolve();
      };

      socket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.handlers.onAudio?.(event.data);
          return;
        }
        // Some browsers may deliver binary as Blob if binaryType was ignored.
        if (typeof Blob !== "undefined" && event.data instanceof Blob) {
          event.data.arrayBuffer().then((buf) => this.handlers.onAudio?.(buf));
          return;
        }
        if (typeof event.data === "string") {
          try {
            this.handlers.onMessage?.(JSON.parse(event.data));
          } catch {
            // Non-JSON text frame — ignore.
          }
        }
      };

      socket.onerror = (event) => {
        this.handlers.onError?.(event);
        if (!settled) {
          settled = true;
          reject(new Error("Voice Agent WebSocket connection failed"));
        }
      };

      socket.onclose = (event) => {
        this.handlers.onClose?.(event);
      };
    });
  }

  get isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private sendJson(payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  sendSettings(settings: Deepgram.agent.AgentV1Settings): void {
    this.sendJson(settings);
  }

  sendInjectAgentMessage(message: Deepgram.agent.AgentV1InjectAgentMessage): void {
    this.sendJson(message);
  }

  sendFunctionCallResponse(
    response: Deepgram.agent.AgentV1SendFunctionCallResponse
  ): void {
    this.sendJson(response);
  }

  sendUpdatePrompt(update: Deepgram.agent.AgentV1UpdatePrompt): void {
    this.sendJson(update);
  }

  sendKeepAlive(): void {
    this.sendJson({ type: "KeepAlive" });
  }

  /** Send a raw linear16 PCM mic chunk. */
  sendMedia(chunk: ArrayBuffer): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(chunk);
    }
  }

  /** Close the socket and detach handlers. */
  close(): void {
    const socket = this.socket;
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
    this.socket = null;
  }
}
