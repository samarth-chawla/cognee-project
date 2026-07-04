import { DeepgramStatus } from "@/components/interview/DeepgramStatus";

/**
 * Phase 3 - Step 1 verification page.
 *
 * Isolated route (does not alter the working interview flow) used to confirm the
 * Deepgram token endpoint, microphone permission, and WebSocket connection all
 * work end to end before later steps build the voice conversation on top.
 */
export default function VoiceCheckPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-extrabold text-on-surface mb-2 tracking-tight">
          Voice Connection Check
        </h1>
        <p className="text-sm text-on-surface-variant">
          Verify the Deepgram voice pipeline connects successfully. Click Connect,
          allow microphone access, and watch for the green status indicator.
        </p>
      </div>
      <DeepgramStatus />
    </main>
  );
}
