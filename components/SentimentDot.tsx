import React from "react";
import type { Sentiment } from "@/lib/types";
import { Smile, Meh, HelpCircle, AlertTriangle, Flame } from "lucide-react";

const CONFIG: Record<
  Sentiment,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  happy: {
    label: "Happy",
    color: "text-mint",
    bg: "bg-mint/10",
    border: "border-mint/20",
    icon: Smile,
  },
  neutral: {
    label: "Neutral",
    color: "text-fog",
    bg: "bg-fog/10",
    border: "border-fog/20",
    icon: Meh,
  },
  confused: {
    label: "Confused",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/20",
    icon: HelpCircle,
  },
  urgent: {
    label: "Urgent",
    color: "text-signalLight",
    bg: "bg-signal/15",
    border: "border-signal/30",
    icon: Flame,
  },
  angry: {
    label: "Angry",
    color: "text-coral",
    bg: "bg-coral/15",
    border: "border-coral/30",
    icon: AlertTriangle,
  },
};

export default function SentimentDot({
  sentiment,
  showLabel = true,
}: {
  sentiment: Sentiment;
  showLabel?: boolean;
}) {
  const conf = CONFIG[sentiment] || CONFIG.neutral;
  const Icon = conf.icon;
  const isAlert = sentiment === "angry" || sentiment === "urgent";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${conf.bg} ${conf.color} ${conf.border}`}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {isAlert && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            sentiment === "happy"
              ? "bg-mint"
              : sentiment === "angry"
              ? "bg-coral"
              : sentiment === "confused" || sentiment === "urgent"
              ? "bg-signal"
              : "bg-fog"
          }`}
        />
      </span>
      <Icon className="h-3 w-3 opacity-90" />
      {showLabel && <span>{conf.label}</span>}
    </span>
  );
}
