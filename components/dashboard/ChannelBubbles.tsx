"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ConversationLog } from "@/lib/types";
import { countBy, topShares } from "@/lib/dashboard-metrics";
import { useSettings, useT } from "../providers/AppProviders";
import Card from "./Card";

// Hand-placed slots so the cluster overlaps like the reference instead of a grid.
const SLOTS = [
  { x: 58, y: 48, size: 104, tone: "bg-signal text-onSignal" },
  { x: 24, y: 66, size: 80, tone: "bg-signal/80 text-onSignal" },
  { x: 74, y: 78, size: 62, tone: "bg-signalSoft text-onSignal" },
  { x: 26, y: 26, size: 50, tone: "bg-signalSoft/70 text-onSignal" },
];

export default function ChannelBubbles({ logs }: { logs: ConversationLog[] }) {
  const t = useT();
  const { settings } = useSettings();
  const root = useRef<HTMLDivElement>(null);

  const channels = useMemo(
    () => topShares(countBy(logs, (l) => l.platform, "web"), SLOTS.length, logs.length),
    [logs]
  );
  const signature = channels.map((c) => c.count).join(",");

  useGSAP(
    () => {
      if (settings.ui.reduceMotion) return;
      gsap.from(".bubble", { scale: 0, duration: 0.9, ease: "back.out(1.8)", stagger: 0.1 });
      // A slow idle float so the cluster feels alive without pulling focus.
      gsap.to(".bubble", { y: "+=5", duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: { each: 0.4, from: "random" } });
    },
    { scope: root, dependencies: [signature] }
  );

  return (
    <Card title={t("dash.channels")} sub={t("dash.channels.sub")}>
      <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
        <div ref={root} className="relative h-44" aria-hidden>
          {channels.map((c, i) => {
            const slot = SLOTS[i];
            return (
              <span
                key={c.label}
                className={`bubble absolute flex items-center justify-center rounded-full font-display text-sm font-semibold shadow-lifted ring-4 ring-panel ${slot.tone}`}
                style={{ width: slot.size, height: slot.size, left: `calc(${slot.x}% - ${slot.size / 2}px)`, top: `calc(${slot.y}% - ${slot.size / 2}px)`, zIndex: SLOTS.length - i }}
              >
                {c.count}
              </span>
            );
          })}
        </div>

        <ul className="flex min-w-[7.5rem] flex-col gap-3">
          {channels.length === 0 ? <li className="text-xs text-fog">{t("dash.empty")}</li> : null}
          {channels.map((c) => (
            <li key={c.label}>
              <p className="text-xs font-semibold capitalize text-paper">{c.label}</p>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full origin-left rounded-full bg-signal transition-transform duration-700 ease-settle" style={{ transform: `scaleX(${c.pct / 100})` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
