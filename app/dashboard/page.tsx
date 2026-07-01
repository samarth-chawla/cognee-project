"use client";

import Link from "next/link";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

export default function DashboardPage() {
  const stats = [
    { label: "Interviews", value: 0 },
    { label: "Avg Score", value: "—" },
    { label: "Memory Nodes", value: 0 },
    { label: "Reports", value: 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href={ROUTES.interview}>
          <Button>Start Interview</Button>
        </Link>
      </div>
      <StatsCards stats={stats} />
      <div className="flex gap-3 text-sm">
        <Link className="underline" href={ROUTES.reports}>Reports</Link>
        <Link className="underline" href={ROUTES.memory}>Memory</Link>
        <Link className="underline" href={ROUTES.settings}>Settings</Link>
      </div>
    </div>
  );
}
