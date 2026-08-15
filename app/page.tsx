"use client";
import { useCallback, useEffect, useState } from "react";
import StatusHeader from "@/components/StatusHeader";
import StatsBar from "@/components/StatsBar";
import ConversationFeed from "@/components/ConversationFeed";
import LeadsPanel from "@/components/LeadsPanel";
import DemoButton from "@/components/DemoButton";
import type { ConversationLog } from "@/lib/types";

interface Stats {
  total: number;
  handoffs: number;
  resolvedByAiPct: number;
  avgLatencyMs: number;
}

export default function Page() {
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    handoffs: 0,
    resolvedByAiPct: 100,
    avgLatencyMs: 0,
  });

  const refresh = useCallback(async () => {
    const res = await fetch("/api/logs", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setLogs(data.logs);
    setStats(data.stats);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col">
      <StatusHeader />
      <StatsBar stats={stats} />

      <div className="flex flex-1 flex-col gap-4 px-6 pb-10 md:flex-row md:px-10">
        <section className="flex flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-medium text-paper">Live conversations</h2>
            <DemoButton onSent={refresh} />
          </div>
          <ConversationFeed logs={logs} />
        </section>

        <aside className="flex w-full flex-col gap-4 md:w-72">
          <LeadsPanel logs={logs} />
        </aside>
      </div>
    </main>
  );
}
