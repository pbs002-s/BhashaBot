import type { Sentiment } from "@/lib/types";

const COLORS: Record<Sentiment, string> = {
  happy: "bg-mint",
  neutral: "bg-fog",
  confused: "bg-signal",
  angry: "bg-coral",
  urgent: "bg-coral",
};

export default function SentimentDot({ sentiment }: { sentiment: Sentiment }) {
  const isAlert = sentiment === "angry" || sentiment === "urgent";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${COLORS[sentiment] || "bg-fog"} ${
          isAlert ? "animate-pulse-dot" : ""
        }`}
      />
      <span className="font-mono text-[11px] uppercase tracking-wide text-fog">
        {sentiment}
      </span>
    </span>
  );
}
