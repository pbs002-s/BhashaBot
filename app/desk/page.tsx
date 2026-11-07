"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import ChannelBubbles from "@/components/dashboard/ChannelBubbles";
import KpiRow, { type Stats } from "@/components/dashboard/KpiRow";
import LanguageRings from "@/components/dashboard/LanguageRings";
import { PALETTE_EVENT, STUDIO_EVENT, parseTab, tabHref, type NavTab } from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import TrafficChart from "@/components/dashboard/TrafficChart";
import { useSettings, useT } from "@/components/providers/AppProviders";
import type { AnalyticsSummary, ConversationLog } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

const TAB_TITLE = {
  live: "nav.live",
  analytics: "nav.analytics",
  leads: "nav.leads",
  knowledge: "nav.knowledge",
  settings: "nav.settings",
} as const satisfies Record<NavTab, TranslationKey>;

export default function DeskPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <Desk />
    </Suspense>
  );
}

function Desk() {
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

  // The tab lives in the URL, so the browser back button steps through tabs
  // instead of leaving the desk.
  const router = useRouter();
  const params = useSearchParams();
  const activeTab = parseTab(params.get("tab"));
  const setActiveTab = useCallback(
    (tab: NavTab) => router.push(tabHref(tab), { scroll: false }),
    [router]
  );
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

  // The sidebar lives in the shared layout, so it reaches the desk by event.
  useEffect(() => {
    const openStudio = () => setStudioOpen(true);
    const openPalette = () => setPaletteOpen(true);
    window.addEventListener(STUDIO_EVENT, openStudio);
    window.addEventListener(PALETTE_EVENT, openPalette);
    if (params.get("studio") === "1") {
      setStudioOpen(true);
      router.replace(tabHref(activeTab), { scroll: false });
    }
    return () => {
      window.removeEventListener(STUDIO_EVENT, openStudio);
      window.removeEventListener(PALETTE_EVENT, openPalette);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div className="relative z-10">
        <main id="desk" className={compact ? "flex min-w-0 flex-col gap-4 py-2" : "flex min-w-0 flex-col gap-5 py-3"}>
          <TopBar title={t(TAB_TITLE[activeTab])} onOpenPalette={() => setPaletteOpen(true)} />

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col gap-5 pb-10"
          >
            {activeTab === "live" ? (
              <>
                {/* Reference layout: KPIs + traffic on the left, language rings and channels on the right. */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                  <div className="flex flex-col gap-5 xl:col-span-8">
                    <KpiRow stats={stats} logs={logs} onFilterClick={handleStatFilter} />
                    <TrafficChart logs={logs} />
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
                    <LanguageRings analytics={analytics} />
                    <ChannelBubbles logs={logs} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
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
              </>
            ) : null}

            {activeTab === "analytics" ? <AnalyticsPanel analytics={analytics} /> : null}

            {activeTab === "leads" ? (
              <LeadsPanel logs={logs} isFullPage onSelectLog={setSelected} />
            ) : null}

            {activeTab === "knowledge" ? <KnowledgePanel /> : null}

            {activeTab === "settings" ? <SettingsPanel /> : null}
          </motion.div>
        </main>
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
