"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ConversationLog } from "@/lib/types";
import { dailyTraffic } from "@/lib/dashboard-metrics";
import { useLocale, useSettings } from "../providers/AppProviders";
import Card from "./Card";

const TICKS = 4;

/** Grouped bars, one pair per day: answered by AI vs handed to a person. */
export default function TrafficChart({ logs }: { logs: ConversationLog[] }) {
  const { t, locale } = useLocale();
  const { settings } = useSettings();
  const root = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const days = useMemo(() => dailyTraffic(logs), [logs]);
  const peak = Math.max(1, ...days.map((d) => Math.max(d.auto, d.human)));
  const step = Math.max(1, Math.ceil(peak / TICKS));
  const top = step * TICKS;
  // Keyed on the shape of the data so bars only regrow when a count changes.
  const signature = days.map((d) => `${d.auto}.${d.human}`).join("|");

  useGSAP(
    () => {
      if (settings.ui.reduceMotion) return;
      gsap.fromTo(
        ".traffic-bar",
        { scaleY: 0 },
        { scaleY: 1, duration: 0.9, ease: "elastic.out(1, 0.75)", stagger: { each: 0.04, from: "start" } }
      );
    },
    { scope: root, dependencies: [signature] }
  );

  const dayLabel = (ms: number) =>
    new Date(ms).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { weekday: "short" });

  return (
    <Card
      title={t("dash.traffic")}
      sub={t("dash.traffic.sub")}
      actions={
        <div className="flex items-center gap-4 text-[0.7rem] text-fog">
          <Legend className="bg-lineLight" label={t("dash.traffic.human")} />
          <Legend className="bg-signal" label={t("dash.traffic.auto")} />
        </div>
      }
    >
      <div ref={root} className="relative mt-6 flex h-64 gap-3">
        {/* y axis */}
        <div className="flex flex-col-reverse justify-between pb-6 text-right font-mono text-[0.65rem] text-fogLight">
          {Array.from({ length: TICKS + 1 }, (_, i) => (
            <span key={i}>{i * step}</span>
          ))}
        </div>

        <div className="relative flex flex-1 items-end justify-between gap-2 pb-6">
          {Array.from({ length: TICKS + 1 }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute inset-x-0 border-t border-dashed border-line"
              style={{ bottom: `calc(1.5rem + ${(i / TICKS) * 100}% - ${(i / TICKS) * 1.5}rem)` }}
            />
          ))}

          {days.map((d, i) => (
            <div
              key={d.day}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${dayLabel(d.day)}: ${d.human} ${t("dash.traffic.human")}, ${d.auto} ${t("dash.traffic.auto")}`}
            >
              {hover === i ? (
                <div className="pointer-events-none absolute z-10 -translate-y-2 whitespace-nowrap rounded-card bg-[#16140f] px-3 py-2 text-[0.7rem] text-white shadow-lifted" style={{ bottom: `${(Math.max(d.auto, d.human) / top) * 100}%` }}>
                  <Row dot="bg-white/50" n={d.human} label={t("dash.traffic.human")} />
                  <Row dot="bg-signal" n={d.auto} label={t("dash.traffic.auto")} />
                </div>
              ) : null}
              <div className="flex h-full w-full items-end justify-center gap-1.5">
                <Bar value={d.human} top={top} className="bg-lineLight" />
                <Bar value={d.auto} top={top} className="bg-signal" />
              </div>
              <span className="absolute -bottom-0 translate-y-full pt-1 text-[0.68rem] text-fog" suppressHydrationWarning>
                {dayLabel(d.day)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Bar({ value, top, className }: { value: number; top: number; className: string }) {
  return (
    <span
      className={`traffic-bar block w-full max-w-[1.1rem] origin-bottom rounded-full ${className}`}
      style={{ height: `${Math.max(3, (value / top) * 100)}%` }}
    />
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="hidden items-center gap-1.5 sm:flex">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function Row({ dot, n, label }: { dot: string; n: number; label: string }) {
  return (
    <p className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="font-mono font-semibold">{n}</span>
      <span className="text-white/60">{label}</span>
    </p>
  );
}
