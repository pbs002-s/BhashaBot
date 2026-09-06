"use client";

import React from "react";
import type { Sentiment } from "@/lib/types";
import { useT } from "./providers/AppProviders";
import { cx } from "./ui/primitives";

const CONFIG: Record<Sentiment, { dot: string; text: string; border: string; bg: string }> = {
  happy: { dot: "bg-mint", text: "text-mint", border: "border-mint/30", bg: "bg-mint/10" },
  neutral: { dot: "bg-fog", text: "text-fog", border: "border-line", bg: "bg-panelCard" },
  confused: { dot: "bg-sky", text: "text-sky", border: "border-sky/30", bg: "bg-sky/10" },
  urgent: { dot: "bg-signal", text: "text-signal", border: "border-signal/35", bg: "bg-signal/12" },
  angry: { dot: "bg-coral", text: "text-coral", border: "border-coral/35", bg: "bg-coral/12" },
};

export default function SentimentDot({
  sentiment,
  showLabel = true,
}: {
  sentiment: Sentiment;
  showLabel?: boolean;
}) {
  const t = useT();
  const conf = CONFIG[sentiment] || CONFIG.neutral;
  const alert = sentiment === "angry" || sentiment === "urgent";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium",
        conf.bg,
        conf.text,
        conf.border
      )}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {alert ? (
          <span className={cx("absolute inline-flex h-full w-full animate-pulse-dot rounded-full", conf.dot)} />
        ) : null}
        <span className={cx("relative inline-flex h-1.5 w-1.5 rounded-full", conf.dot)} />
      </span>
      {showLabel ? <span>{t(`sentiment.${sentiment}` as any)}</span> : null}
    </span>
  );
}
