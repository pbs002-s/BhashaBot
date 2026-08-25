"use client";
import { motion } from "framer-motion";
import CountUp from "./CountUp";
import { MessageSquare, ShieldCheck, Users, Zap } from "lucide-react";

interface Stats {
  total: number;
  handoffs: number;
  resolvedByAiPct: number;
  avgLatencyMs: number;
  pendingHandoffs?: number;
  totalLeads?: number;
}

export default function StatsBar({
  stats,
  onFilterClick,
}: {
  stats: Stats;
  onFilterClick?: (filterType: string) => void;
}) {
  const cards = [
    {
      id: "all",
      label: "Total Conversations",
      value: stats.total,
      suffix: "",
      subtext: "Logged across all channels",
      icon: MessageSquare,
      color: "text-sky",
      borderGlow: "hover:border-sky/40",
    },
    {
      id: "resolution",
      label: "AI Resolution Rate",
      value: stats.resolvedByAiPct,
      suffix: "%",
      subtext: `${stats.pendingHandoffs || 0} pending human handoffs`,
      icon: ShieldCheck,
      color: "text-mint",
      borderGlow: "hover:border-mint/40",
    },
    {
      id: "leads",
      label: "Captured Leads",
      value: stats.totalLeads ?? 0,
      suffix: "",
      subtext: "Qualified contacts extracted",
      icon: Users,
      color: "text-signal",
      borderGlow: "hover:border-signal/40",
    },
    {
      id: "latency",
      label: "Avg Reply Latency",
      value: stats.avgLatencyMs,
      suffix: "ms",
      subtext: "Real-time edge processing",
      icon: Zap,
      color: "text-violet",
      borderGlow: "hover:border-violet/40",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-4 md:px-8"
    >
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            onClick={() => onFilterClick?.(c.id)}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`group cursor-pointer rounded-xl border border-line bg-panel p-4 transition-all duration-200 hover:bg-panelCard hover:shadow-lg ${c.borderGlow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-fog group-hover:text-paper transition-colors">
                {c.label}
              </span>
              <Icon className={`h-4 w-4 ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="mt-2">
              <CountUp value={c.value} suffix={c.suffix} />
            </div>
            <p className="mt-1 text-[11px] text-fog/80 truncate font-mono">{c.subtext}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
