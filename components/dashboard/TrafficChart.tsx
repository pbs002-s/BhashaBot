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
      className="flex-1"
      title={t("dash.traffic")}
      sub={t("dash.traffic.sub")}
      actions={
        <div className="flex items-center gap-4 text-[0.7rem] text-fog">
          <Legend className="bg-lineLight" label={t("dash.traffic.human")} />
          <Legend className="bg-signal" label={t("dash.traffic.auto")} />
        </div>
      }
    >
      <div ref={root} className="mt-6 flex flex-1 flex-col pl-8">
        {/* One plot box: gridlines, y labels, bars and tooltip all measure from it. */}
        <div className="relative min-h-56 flex-1">
          {Array.from({ length: TICKS + 1 }, (_, i) => (
            <div key={i} aria-hidden className="absolute inset-x-0" style={{ bottom: `${(i / TICKS) * 100}%` }}>
              <span className="absolute -left-8 w-6 -translate-y-1/2 text-right font-mono text-[0.65rem] leading-none text-fogLight">
                {i * step}
              </span>
              <span className="block border-t border-dashed border-line" />
            </div>
          ))}

          <div className="absolute inset-0 flex items-stretch justify-between gap-2">
            {days.map((d, i) => (
              <div
                key={d.day}
                className="relative flex flex-1 items-end justify-center gap-1.5"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${dayLabel(d.day)}: ${d.human} ${t("dash.traffic.human")}, ${d.auto} ${t("dash.traffic.auto")}`}
              >
                {hover === i ? (
                  <div
                    className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-card bg-[#16140f] px-3 py-2 text-[0.7rem] text-white shadow-lifted"
                    style={{ bottom: `${(Math.max(d.auto, d.human) / top) * 100}%` }}
                  >
                    <Row dot="bg-white/50" n={d.human} label={t("dash.traffic.human")} />
                    <Row dot="bg-signal" n={d.auto} label={t("dash.traffic.auto")} />
                  </div>
                ) : null}
                <Bar value={d.human} top={top} className="bg-lineLight" />
                <Bar value={d.auto} top={top} className="bg-signal" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-between gap-2">
          {days.map((d) => (
            <span key={d.day} className="flex-1 text-center text-[0.68rem] leading-none text-fog" suppressHydrationWarning>
              {dayLabel(d.day)}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Bar({ value, top, className }: { value: number; top: number; className: string }) {
  return (
    <span
      className={`traffic-bar block w-3 origin-bottom rounded-full ${className}`}
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
