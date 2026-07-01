"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ROUTES } from "@/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const { targetRole, setTargetRole } = useSettingsStore();
  const [role, setRole] = useState(targetRole);

  function save() {
    setTargetRole(role);
    router.push(ROUTES.dashboard);
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Tell us your target role</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Senior Frontend Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={save}>Continue</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
