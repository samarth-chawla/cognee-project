---
name: deepgram-voice-setup
description: Deepgram voice pipeline (Phase 3) setup facts — SDK shape, token grant, browser auth
metadata:
  type: project
---

Phase 3 voice interview uses `@deepgram/sdk` v5 (Fern-generated): client is `new DeepgramClient({ apiKey })`, token grant is `client.auth.v1.tokens.grant({ ttl_seconds })` → `{ access_token, expires_in }` (NOT the old `createClient` API).

Step 1 (connection bootstrap) verified working on 2026-07-04:
- Token grant requires an **Owner/Administrator** Deepgram key. A basic/Member key returns `403 FORBIDDEN "Insufficient permissions"`.
- Browser authenticates the WebSocket with the short-lived JWT via subprotocols `["bearer", token]` (mirrors Deepgram's documented `["token", apiKey]` for raw keys). Confirmed accepted.
- Idle listen sockets close after ~10s without a `{ type: "KeepAlive" }` control frame; the hook sends one every 8s.

Files: `lib/deepgram/client.ts` (`getDeepgramClient`), `services/deepgram.service.ts` (`createDeepgramToken`), `GET /api/speech/token`, `hooks/useDeepgram.ts`, verification page at `/dashboard/interview/voice-check`. Later steps add TTS (stored `ttsTranscript`), streaming STT, and the auto-advancing conversation loop.
