"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { AIProvider } from "@/types";

export default function SettingsPage() {
  const {
    provider,
    targetRole,
    voiceEnabled,
    setProvider,
    setTargetRole,
    setVoiceEnabled,
  } = useSettingsStore();

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Target role</label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">AI provider</label>
            <div className="flex gap-2">
              {(["openai", "gemini"] as AIProvider[]).map((p) => (
                <Button
                  key={p}
                  variant={provider === p ? "default" : "outline"}
                  onClick={() => setProvider(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="voice"
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            <label htmlFor="voice" className="text-sm">Enable voice answers</label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
