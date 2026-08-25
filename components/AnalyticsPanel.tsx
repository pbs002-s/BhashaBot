"use client";
import React from "react";
import { motion } from "framer-motion";
import type { AnalyticsSummary } from "@/lib/types";
import {
  PieChart,
  BarChart3,
  Globe,
  Smile,
  ShieldCheck,
  Zap,
  Flame,
  AlertTriangle,
  HelpCircle,
  Meh,
} from "lucide-react";

const SENTIMENT_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  happy: { bg: "bg-mint", text: "text-mint", icon: Smile },
  neutral: { bg: "bg-fog", text: "text-fog", icon: Meh },
  confused: { bg: "bg-signal", text: "text-signal", icon: HelpCircle },
  urgent: { bg: "bg-signalLight", text: "text-signalLight", icon: Flame },
  angry: { bg: "bg-coral", text: "text-coral", icon: AlertTriangle },
};

export default function AnalyticsPanel({
  analytics,
}: {
  analytics: AnalyticsSummary | null;
}) {
  if (!analytics || analytics.totalConversations === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel p-12 text-center">
        <BarChart3 className="h-10 w-10 text-fog/50" />
        <h3 className="mt-3 font-display text-base font-semibold text-paper">No Analytics Data Yet</h3>
        <p className="mt-1 max-w-sm text-xs text-fog">
          Start receiving Messenger messages or fire test events to generate real-time sentiment, language, and intent analytics.
        </p>
      </div>
    );
  }

  const total = analytics.totalConversations;

  // Sorted languages
  const sortedLanguages = Object.entries(analytics.languageBreakdown || {}).sort(
    ([, a], [, b]) => b - a
  );

  // Sorted intents
  const sortedIntents = Object.entries(analytics.intentBreakdown || {}).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Top High-level KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-xs text-fog">
            <span>AI Deflection Rate</span>
            <ShieldCheck className="h-4 w-4 text-mint" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-mint">
            {analytics.resolutionRatePct}%
          </p>
          <p className="mt-1 text-[11px] text-fog">
            {total - analytics.pendingHandoffs} of {total} resolved autonomously
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-xs text-fog">
            <span>Pending Handoffs</span>
            <AlertTriangle className="h-4 w-4 text-coral" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-coral">
            {analytics.pendingHandoffs}
          </p>
          <p className="mt-1 text-[11px] text-fog">
            {analytics.resolvedHandoffs} handoffs resolved by support agents
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-xs text-fog">
            <span>Average Latency</span>
            <Zap className="h-4 w-4 text-violet" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-violet">
            {analytics.avgLatencyMs}ms
          </p>
          <p className="mt-1 text-[11px] text-fog">End-to-end inference & reply delivery</p>
        </div>
      </div>

      {/* Main Breakdown Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. Sentiment Emotional Breakdown */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <Smile className="h-4 w-4 text-mint" />
              Customer Sentiment Spectrum
            </h3>
            <span className="font-mono text-xs text-fog">{total} total</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {Object.entries(analytics.sentimentBreakdown).map(([sentiment, count]) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              const conf = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral;
              const Icon = conf.icon;

              return (
                <div key={sentiment} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium capitalize text-paper">
                      <Icon className={`h-3.5 w-3.5 ${conf.text}`} />
                      {sentiment}
                    </span>
                    <span className="font-mono text-[11px] text-fog">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-panelCard">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${conf.bg}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Multilingual Reach Breakdown */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky" />
              Multilingual Language Reach
            </h3>
            <span className="font-mono text-xs text-fog">{sortedLanguages.length} detected</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {sortedLanguages.map(([lang, count]) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={lang} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-paper">{lang}</span>
                    <span className="font-mono text-[11px] text-fog">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-panelCard">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-sky"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Top Customer Intents */}
        <div className="rounded-xl border border-line bg-panel p-5 md:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-paper flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-signal" />
              Categorized Inquiry Intents
            </h3>
            <span className="font-mono text-xs text-fog">{sortedIntents.length} categories</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {sortedIntents.map(([intent, count]) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={intent} className="rounded-lg border border-line bg-panelCard p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-paper">
                      {intent.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-[11px] text-signal font-medium">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-panel">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-signal transition-all duration-300"
                    />
                  </div>
                  <span className="mt-1 block text-right font-mono text-[10px] text-fog">
                    {pct}% of total inquiries
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
