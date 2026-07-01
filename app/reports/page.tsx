"use client";

import { useEffect, useState } from "react";
import { ReportCard } from "@/components/reports/ReportCard";
import { API } from "@/constants";
import type { Report } from "@/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API.reports}?userId=demo-user`)
      .then((r) => r.json())
      .then((j) => setReports(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-sm text-zinc-500">No reports yet.</p>
      )}
      <div className="space-y-3">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
}
