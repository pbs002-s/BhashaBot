"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import CommandPalette from "@/components/CommandPalette";
import ConversationDrawer from "@/components/ConversationDrawer";
import ConversationFeed from "@/components/ConversationFeed";
import DemoButton from "@/components/DemoButton";
import KnowledgePanel from "@/components/KnowledgePanel";
import LeadsPanel from "@/components/LeadsPanel";
import ReplyStudio from "@/components/ReplyStudio";
import SettingsPanel from "@/components/SettingsPanel";
import SiteFooter from "@/components/SiteFooter";
import StatsBar, { type Stats } from "@/components/StatsBar";
import StatusHeader, { type NavTab } from "@/components/StatusHeader";
import { useSettings, useT } from "@/components/providers/AppProviders";
import type { AnalyticsSummary, ConversationLog } from "@/lib/types";

export default function DeskPage() {
  const t = useT();
  const { settings } = useSettings();

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
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<NavTab>("live");
  const [feedFilter, setFeedFilter] = useState("all");
  const [studioOpen, setStudioOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selected, setSelected] = useState<ConversationLog | null>(null);

  const previousCount = useRef(0);
  const soundRef = useRef(settings.ui.sound);
  soundRef.current = settings.ui.sound;

  /** A short two-note rise, quiet enough to sit in an office. */
  const chime = useCallback(() => {
    if (!soundRef.current || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      /* Audio is a nicety; never let it break the page. */
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: ConversationLog[] = data.logs || [];

      setLogs(incoming);
      setStats(data.stats || {});
      setAnalytics(data.analytics || null);

      if (previousCount.current > 0 && incoming.length > previousCount.current) {
        const latest = incoming[0];
        if (latest?.needsHuman || latest?.leadName) chime();
      }
      previousCount.current = incoming.length;

      setSelected((current) => {
        if (!current) return current;
        return incoming.find((l) => l.id === current.id) || current;
      });
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, [chime]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleStatFilter(filter: string) {
    setFeedFilter(filter === "resolution" ? "needsHuman" : filter === "leads" ? "hasLead" : "all");
    setActiveTab("live");
  }

  async function fireTestEvent() {
    await fetch("/api/seed", { method: "POST" });
    refresh();
  }

  const compact = settings.ui.density === "compact";

  return (
    <>
      <AmbientBackdrop />

      <a className="skip-link" href="#desk">
        {t("app.skipToContent")}
      </a>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <StatusHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenStudio={() => setStudioOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main
          id="desk"
          className={compact ? "flex flex-1 flex-col gap-4 pt-8" : "flex flex-1 flex-col gap-6 pt-10"}
        >
          {activeTab === "live" ? (
            <StatsBar stats={stats} logs={logs} onFilterClick={handleStatFilter} />
          ) : null}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[86rem] flex-1 px-5 pb-20 md:px-8"
          >
            {activeTab === "live" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <section className="flex flex-col gap-3 lg:col-span-8 xl:col-span-9">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-paper">
                        {t("live.title")}
                      </h2>
                      <p className="mt-1 text-xs text-fog">{t("live.subtitle")}</p>
                    </div>
                    <DemoButton onSent={refresh} />
                  </div>

                  <ConversationFeed
                    logs={logs}
                    loading={loading}
                    activeFilter={feedFilter}
                    onSelectLog={setSelected}
                    emptyAction={<DemoButton onSent={refresh} />}
                  />
                </section>

                <div className="lg:col-span-4 xl:col-span-3">
                  <LeadsPanel logs={logs} onSelectLog={setSelected} />
                </div>
              </div>
            ) : null}

            {activeTab === "analytics" ? <AnalyticsPanel analytics={analytics} /> : null}

            {activeTab === "leads" ? (
              <LeadsPanel logs={logs} isFullPage onSelectLog={setSelected} />
            ) : null}

            {activeTab === "knowledge" ? <KnowledgePanel /> : null}

            {activeTab === "settings" ? <SettingsPanel /> : null}
          </motion.div>
        </main>

        <SiteFooter />
      </div>

      <ReplyStudio
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        onDrafted={refresh}
      />

      <ConversationDrawer
        log={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onUpdated={refresh}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActiveTab}
        onOpenStudio={() => setStudioOpen(true)}
        onFireTest={fireTestEvent}
      />
    </>
  );
}
