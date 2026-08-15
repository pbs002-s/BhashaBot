"use client";
import { motion } from "framer-motion";
import CountUp from "./CountUp";

interface Stats {
  total: number;
  handoffs: number;
  resolvedByAiPct: number;
  avgLatencyMs: number;
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Conversations", value: stats.total, suffix: "" },
    { label: "Resolved by AI", value: stats.resolvedByAiPct, suffix: "%" },
    { label: "Human handoffs", value: stats.handoffs, suffix: "" },
    { label: "Avg. reply latency", value: stats.avgLatencyMs, suffix: "ms" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-2 gap-3 px-6 py-6 md:grid-cols-4 md:px-10"
    >
      {cards.map((c) => (
        <motion.div
          key={c.label}
          variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="rounded-xl border border-line bg-panel px-4 py-4"
        >
          <CountUp value={c.value} suffix={c.suffix} />
          <p className="mt-1 text-xs text-fog">{c.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
