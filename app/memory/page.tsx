"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API } from "@/constants";
import type { MemoryNode } from "@/types";

export default function MemoryPage() {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [q, setQ] = useState("");

  function load(search?: string) {
    const url = search
      ? `${API.memory}?userId=demo-user&q=${encodeURIComponent(search)}`
      : `${API.memory}?userId=demo-user`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const data = j.data;
        setNodes(Array.isArray(data) ? data : data?.nodes ?? []);
      });
  }

  useEffect(() => load(), []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Memory</h1>
      <div className="flex gap-2">
        <Input placeholder="Search memory…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => load(q)}>Search</Button>
      </div>
      <div className="space-y-2">
        {nodes.map((n) => (
          <Card key={n.id}>
            <CardContent className="pt-6 text-sm">
              <span className="mr-2 rounded bg-zinc-100 px-2 py-0.5 text-xs uppercase dark:bg-zinc-800">
                {n.kind}
              </span>
              {n.content}
            </CardContent>
          </Card>
        ))}
        {nodes.length === 0 && <p className="text-sm text-zinc-500">No memory yet.</p>}
      </div>
    </div>
  );
}
