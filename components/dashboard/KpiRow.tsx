"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChatsCircle, Gauge, Lightning, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";
import type { ConversationLog } from "@/lib/types";
import { dayOverDay } from "@/lib/dashboard-metrics";
import { useSettings, useT } from "../providers/AppProviders";
import { cx } from "../ui/primitives";

export interface Stats {
  total: number;
  handoffs: number;
  resolvedByAiPct: number;
  avgLatencyMs: number;
  pendingHandoffs?: number;
  totalLeads?: number;
}

gsap.registerPlugin(useGSAP);

export default function KpiRow({
  stats,
  logs,
  onFilterClick,
}: {
  stats: Stats;
  logs: ConversationLog[];
  onFilterClick: (filter: string) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const root = useRef<HTMLDivElement>(null);

  // Cards rise in once; the numbers re-tween every time the value changes.
  useGSAP(
    () => {
      if (settings.ui.reduceMotion) return;
      gsap.from(".kpi-card", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" });
    },
    { scope: root }
  );

  const cards: Array<{
    key: string;
    label: string;
    value: number;
    suffix?: string;
    sub: string;
    icon: React.ReactNode;
    delta: number | null;
    /** For latency a drop is good news. */
    invert?: boolean;
    filter?: string;
  }> = [
    {
      key: "total",
      label: t("stat.total"),
      value: stats.total,
      sub: t("stat.total.sub"),
      icon: <ChatsCircle size={20} weight="duotone" />,
      delta: dayOverDay(logs),
      filter: "all",
    },
    {
      key: "resolution",
      label: t("stat.resolution"),
      value: stats.resolvedByAiPct,
      suffix: "%",
      sub: t("stat.resolution.sub", { n: stats.pendingHandoffs ?? 0 }),
      icon: <Gauge size={20} weight="duotone" />,
      delta: dayOverDay(logs, (l) => !l.needsHuman),
      filter: "resolution",
    },
    {
      key: "leads",
      label: t("stat.leads"),
      value: stats.totalLeads ?? 0,
      sub: t("stat.leads.sub"),
      icon: <UserCirclePlus size={20} weight="duotone" />,
      delta: dayOverDay(logs, (l) => Boolean(l.leadName || l.leadPhone || l.leadEmail)),
      filter: "leads",
    },
    {
      key: "latency",
      label: t("stat.latency"),
      value: stats.avgLatencyMs,
      suffix: "ms",
      sub: t("stat.latency.sub"),
      icon: <Lightning size={20} weight="duotone" />,
      delta: null,
      invert: true,
    },
  ];

  return (
    <div ref={root} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => {
        const hero = i === 0;
        return (
          <button
            key={card.key}
            type="button"
            onClick={card.filter ? () => onFilterClick(card.filter!) : undefined}
            className={cx(
              "kpi-card spotlight group relative overflow-hidden rounded-core p-5 text-left transition-[transform,box-shadow] duration-500 ease-physical hover:-translate-y-0.5",
              hero
                ? "beam-border bg-gradient-to-br from-signal to-signalSoft text-onSignal shadow-[0_18px_40px_-18px_rgb(var(--c-signal)/0.8)]"
                : "border border-line/70 bg-panel shadow-ambient hover:shadow-lifted",
              !card.filter && "cursor-default"
            )}
          >
            {hero ? <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" /> : null}
            <div className="relative flex items-start justify-between">
              <span
                className={cx(
                  "flex h-11 w-11 items-center justify-center rounded-card",
                  hero ? "bg-white text-signal" : "border border-line bg-panelCard text-paper"
                )}
              >
                {card.icon}
              </span>
              <DeltaBadge value={card.delta} invert={card.invert} onHero={hero} />
            </div>
            <p className={cx("relative mt-5 text-xs font-medium", hero ? "text-onSignal/85" : "text-fog")}>{card.label}</p>
            <div className="relative mt-1 flex items-end gap-3">
              <Ticker value={card.value} suffix={card.suffix} still={settings.ui.reduceMotion} />
              <span className={cx("pb-1 text-[0.68rem] leading-snug", hero ? "text-onSignal/75" : "text-fog")}>
                {card.delta === null ? card.sub : t("dash.vsYesterday")}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** GSAP number tween; tabular figures keep the width steady while it counts. */
function Ticker({ value, suffix = "", still }: { value: number; suffix?: string; still: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const state = { n: still ? value : last.current };
      const render = () => (el.textContent = `${Math.round(state.n).toLocaleString()}${suffix}`);
      render();
      if (!still) gsap.to(state, { n: value, duration: 1.1, ease: "power3.out", onUpdate: render });
      last.current = value;
    },
    { dependencies: [value, suffix, still] }
  );

  return (
    <span ref={ref} className="font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular">
      0{suffix}
    </span>
  );
}

function DeltaBadge({ value, invert, onHero }: { value: number | null; invert?: boolean; onHero: boolean }) {
  if (value === null) return null;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 font-mono text-[0.65rem] font-semibold",
        onHero ? "bg-white/20 text-onSignal" : good ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
      )}
    >
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}
