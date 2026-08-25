"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import StatusHeader, { type NavTab } from "@/components/StatusHeader";
import StatsBar from "@/components/StatsBar";
import ConversationFeed from "@/components/ConversationFeed";
import LeadsPanel from "@/components/LeadsPanel";
import DemoButton from "@/components/DemoButton";
import SimulatorModal from "@/components/SimulatorModal";
import ConversationDrawer from "@/components/ConversationDrawer";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import KnowledgePanel from "@/components/KnowledgePanel";
import WebhookSettingsPanel from "@/components/WebhookSettingsPanel";
import type { ConversationLog, AnalyticsSummary } from "@/lib/types";

interface Stats {
  total: number;
  handoffs: number;
  resolvedByAiPct: number;
  avgLatencyMs: number;
  pendingHandoffs?: number;
  totalLeads?: number;
}

export default function Page() {
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    handoffs: 0,
    resolvedByAiPct: 100,
    avgLatencyMs: 0,
    pendingHandoffs: 0,
    totalLeads: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>("live");
  const [activeFeedFilter, setActiveFeedFilter] = useState<string>("all");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const prevLogsCountRef = useRef<number>(0);

  // Play subtle web audio chime on new handoff or lead
  const playAlertChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [soundEnabled]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || {});
      setAnalytics(data.analytics || null);

      if (prevLogsCountRef.current > 0 && data.logs?.length > prevLogsCountRef.current) {
        const latest = data.logs[0];
        if (latest?.needsHuman || latest?.leadName) {
          playAlertChime();
        }
      }
      prevLogsCountRef.current = data.logs?.length || 0;

      // Also update selected log if currently open in drawer
      if (selectedLog) {
        const updated = data.logs?.find((l: ConversationLog) => l.id === selectedLog.id);
        if (updated) setSelectedLog(updated);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }, [playAlertChime, selectedLog]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  function handleFilterClick(filterId: string) {
    if (filterId === "resolution") {
      setActiveFeedFilter("needsHuman");
    } else if (filterId === "leads") {
      setActiveFeedFilter("hasLead");
    } else {
      setActiveFeedFilter("all");
    }
    setActiveTab("live");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col bg-ink font-body antialiased selection:bg-signal selection:text-ink">
      {/* Top Header with Brand, Tab navigation & Simulator Trigger */}
      <StatusHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Global Quick Stats Metrics Bar */}
      <StatsBar stats={stats} onFilterClick={handleFilterClick} />

      {/* Main Tab Views */}
      <div className="flex flex-1 flex-col px-4 pb-12 md:px-8">
        {/* Tab 1: Live Stream & Feed */}
        {activeTab === "live" && (
          <div className="flex flex-1 flex-col gap-5 lg:flex-row">
            <section className="flex flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-sm font-semibold text-paper">
                    Live Multilingual Conversations
                  </h2>
                  <p className="text-[11px] text-fog">
                    Real-time webhook and simulated customer interaction feed
                  </p>
                </div>
                <DemoButton onSent={refresh} />
              </div>
              <ConversationFeed
                logs={logs}
                onSelectLog={(log) => setSelectedLog(log)}
                activeFilter={activeFeedFilter}
              />
            </section>

            {/* Sidebar Leads Overview */}
            <aside className="flex w-full flex-col gap-4 lg:w-80">
              <LeadsPanel logs={logs} isFullPage={false} onSelectLog={(l) => setSelectedLog(l)} />
            </aside>
          </div>
        )}

        {/* Tab 2: Analytics & Insights */}
        {activeTab === "analytics" && <AnalyticsPanel analytics={analytics} />}

        {/* Tab 3: Full Leads CRM */}
        {activeTab === "leads" && (
          <LeadsPanel logs={logs} isFullPage={true} onSelectLog={(l) => setSelectedLog(l)} />
        )}

        {/* Tab 4: Knowledge Base Grounding */}
        {activeTab === "knowledge" && <KnowledgePanel />}

        {/* Tab 5: Webhook & Security */}
        {activeTab === "settings" && <WebhookSettingsPanel />}
      </div>

      {/* Live AI Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulationSuccess={refresh}
      />

      {/* Conversation Thread Inspector Drawer */}
      <ConversationDrawer
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onUpdated={refresh}
      />
    </main>
  );
}
