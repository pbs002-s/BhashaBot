"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChartBar, Gauge, Globe, Lightning, SmileyMeh, WarningDiamond } from "@phosphor-icons/react/dist/ssr";
import type { AnalyticsSummary, Sentiment } from "@/lib/types";
import { useT } from "./providers/AppProviders";
import { EmptyState, Meter, SectionHead, cx } from "./ui/primitives";

const SENTIMENT_TONE: Record<Sentiment, "mint" | "fog" | "sky" | "signal" | "coral"> = {
  happy: "mint",
  neutral: "fog",
  confused: "sky",
  urgent: "signal",
  angry: "coral",
};

export default function AnalyticsPanel({ analytics }: { analytics: AnalyticsSummary | null }) {
  const t = useT();

  if (!analytics || analytics.totalConversations === 0) {
    return (
      <div className="rounded-shell border border-dashed border-line bg-panelCard/30 p-1.5">
        <div className="rounded-core border border-line/50 bg-panel/60">
          <EmptyState
            icon={<ChartBar size={20} />}
            title={t("insights.empty.title")}
            body={t("insights.empty.body")}
          />
        </div>
      </div>
    );
  }

  const total = analytics.totalConversations;
  const languages = Object.entries(analytics.languageBreakdown || {}).sort(([, a], [, b]) => b - a);
  const intents = Object.entries(analytics.intentBreakdown || {}).sort(([, a], [, b]) => b - a);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* --- headline trio, deliberately unequal --- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Kpi
          className="md:col-span-5"
          label={t("insights.deflection")}
          value={`${analytics.resolutionRatePct}%`}
          tone="text-mint"
          sub={t("insights.deflection.sub", {
            done: total - analytics.pendingHandoffs,
            total,
          })}
          icon={<Gauge size={16} className="text-mint" />}
          meter={analytics.resolutionRatePct}
          meterTone="mint"
        />
        <Kpi
          className="md:col-span-3"
          label={t("insights.pending")}
          value={String(analytics.pendingHandoffs)}
          tone="text-coral"
          sub={t("insights.pending.sub", { n: analytics.resolvedHandoffs })}
          icon={<WarningDiamond size={16} className="text-coral" />}
        />
        <Kpi
          className="md:col-span-4"
          label={t("insights.latency")}
          value={`${analytics.avgLatencyMs}ms`}
          tone="text-violet"
          sub={t("insights.latency.sub")}
          icon={<Lightning size={16} className="text-violet" />}
        />
      </div>

      {/* --- breakdowns --- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <SectionHead
            title={t("insights.sentiment")}
            icon={<SmileyMeh size={17} />}
            actions={<span className="font-mono text-[0.7rem] text-fog">{total}</span>}
          />
          <div className="flex flex-col gap-4 p-6">
            {(Object.entries(analytics.sentimentBreakdown) as Array<[Sentiment, number]>).map(
              ([sentiment, count], index) => {
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <motion.div
                    key={sentiment}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium text-paper">
                        {t(`sentiment.${sentiment}` as any)}
                      </span>
                      <span className="font-mono text-[0.7rem] text-fog">
                        {count} · {pct}%
                      </span>
                    </div>
                    <Meter value={pct} tone={SENTIMENT_TONE[sentiment]} />
                  </motion.div>
                );
              }
            )}
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <SectionHead
            title={t("insights.languages")}
            icon={<Globe size={17} />}
            actions={
              <span className="font-mono text-[0.7rem] text-fog">
                {t("insights.detected", { n: languages.length })}
              </span>
            }
          />
          <div className="flex flex-col gap-4 p-6">
            {languages.map(([language, count], index) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <motion.div
                  key={language}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-paper">{language}</span>
                    <span className="font-mono text-[0.7rem] text-fog">
                      {count} · {pct}%
                    </span>
                  </div>
                  <Meter value={pct} tone="sky" />
                </motion.div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <SectionHead
            title={t("insights.intents")}
            icon={<ChartBar size={17} />}
            actions={
              <span className="font-mono text-[0.7rem] text-fog">
                {t("insights.categories", { n: intents.length })}
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 xl:grid-cols-3">
            {intents.map(([intent, count], index) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <motion.div
                  key={intent}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.04, 0.3) }}
                  className="rounded-card border border-line bg-panelCard p-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-mono text-[0.72rem] font-medium text-paper">
                      {intent.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-[0.7rem] text-signal">{count}</span>
                  </div>
                  <div className="mt-3">
                    <Meter value={pct} />
                  </div>
                  <p className="mt-2 text-right font-mono text-[0.65rem] text-fog">
                    {t("insights.ofTotal", { n: pct })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cx(
        "rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient",
        className
      )}
    >
      <div className="h-full rounded-core border border-line/60 bg-panel shadow-inset">{children}</div>
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone,
  meter,
  meterTone,
  className,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: string;
  meter?: number;
  meterTone?: "mint" | "signal" | "coral" | "sky" | "violet";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient",
        className
      )}
    >
      <div className="h-full rounded-core border border-line/60 bg-panel p-5 shadow-inset">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-fog">{label}</span>
          {icon}
        </div>
        <p
          className={cx(
            "mt-3 font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular",
            tone
          )}
        >
          {value}
        </p>
        <p className="mt-2 text-[0.7rem] leading-relaxed text-fog">{sub}</p>
        {typeof meter === "number" ? (
          <div className="mt-4">
            <Meter value={meter} tone={meterTone} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
