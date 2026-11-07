"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { AnalyticsSummary } from "@/lib/types";
import { topShares } from "@/lib/dashboard-metrics";
import { useSettings, useT } from "../providers/AppProviders";
import Card from "./Card";

const RINGS = [
  { r: 80, stroke: "rgb(var(--c-signal))", dot: "bg-signal" },
  { r: 64, stroke: "rgb(var(--c-violet))", dot: "bg-violet" },
  { r: 48, stroke: "rgb(var(--c-mint))", dot: "bg-mint" },
];
// Each ring is a 3/4 arc, like the reference: the open quarter holds the total.
const SWEEP = 0.75;

/** Concentric progress arcs for the three most-used languages. */
export default function LanguageRings({ analytics }: { analytics: AnalyticsSummary | null }) {
  const t = useT();
  const { settings } = useSettings();
  const root = useRef<HTMLDivElement>(null);

  const total = analytics?.totalConversations ?? 0;
  const top = topShares(analytics?.languageBreakdown ?? {}, RINGS.length, total);
  const signature = top.map((s) => s.pct).join(",");

  useGSAP(
    () => {
      if (settings.ui.reduceMotion) return;
      gsap.from(".lang-arc", {
        attr: { "stroke-dasharray": (_: number, el: SVGCircleElement) => `0 ${el.dataset.c}` },
        duration: 1.4,
        ease: "power3.out",
        stagger: 0.12,
      });
    },
    { scope: root, dependencies: [signature] }
  );

  return (
    <Card title={t("insights.languages")} sub={t("dash.languages.sub")}>
      <div ref={root} className="relative mx-auto mt-4 h-48 w-48">
        <svg viewBox="0 0 180 180" className="h-full w-full rotate-[135deg]" aria-hidden>
          {RINGS.map((ring, i) => {
            const c = 2 * Math.PI * ring.r;
            const share = (top[i]?.pct ?? 0) / 100;
            return (
              <g key={ring.r} fill="none" strokeWidth={9} strokeLinecap="round">
                <circle cx={90} cy={90} r={ring.r} stroke="rgb(var(--c-line))" strokeDasharray={`${c * SWEEP} ${c}`} />
                {share > 0 ? (
                  <circle
                    className="lang-arc"
                    data-c={c}
                    cx={90}
                    cy={90}
                    r={ring.r}
                    stroke={ring.stroke}
                    strokeDasharray={`${c * SWEEP * share} ${c}`}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-3xl font-semibold leading-none tracking-[-0.03em] text-paper tabular">{total}</p>
          <p className="mt-1 text-[0.65rem] leading-none text-fog">{t("dash.languages.total")}</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {top.length === 0 ? <li className="text-xs text-fog">{t("dash.empty")}</li> : null}
        {top.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${RINGS[i].dot}`} />
            <span className="flex-1 truncate font-medium text-paper">{s.label}</span>
            <span className="font-mono text-xs text-paper tabular">{s.count}</span>
            <span className="w-12 rounded-full bg-panelCard px-2 py-0.5 text-center font-mono text-[0.65rem] text-fog">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
