"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChatsCircle, Gauge, Lightning, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";
import type { ConversationLog } from "@/lib/types";
import { useT } from "./providers/AppProviders";
import CountUp from "./CountUp";
import { Meter, cx } from "./ui/primitives";

export interface Stats {
  total: number;
  handoffs: number;
  resolvedByAiPct: number;
  avgLatencyMs: number;
  pendingHandoffs?: number;
  totalLeads?: number;
}

const enter = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

/**
 * An asymmetric bento rather than four identical columns: the volume tile is
 * tall and carries the activity trace, the deflection tile is wide because its
 * meter needs the room.
 */
export default function StatsBar({
  stats,
  logs,
  onFilterClick,
}: {
  stats: Stats;
  logs: ConversationLog[];
  onFilterClick?: (filter: string) => void;
}) {
  const t = useT();

  // Twelve five-minute buckets of arrival volume.
  const spark = useMemo(() => {
    const buckets = new Array(12).fill(0);
    const now = Date.now();
    for (const log of logs) {
      const age = now - new Date(log.createdAt).getTime();
      const index = 11 - Math.floor(age / (5 * 60 * 1000));
      if (index >= 0 && index < 12) buckets[index] += 1;
    }
    return buckets;
  }, [logs]);

  const sparkMax = Math.max(1, ...spark);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="mx-auto grid w-full max-w-[86rem] grid-cols-1 gap-3 px-5 md:grid-cols-12 md:px-8"
    >
      {/* --- tall tile: volume + activity trace --- */}
      <motion.button
        type="button"
        variants={enter}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => onFilterClick?.("all")}
        className="spotlight group flex flex-col justify-between rounded-shell border border-line/70 bg-panelCard/40 p-1.5 text-left shadow-ambient transition-shadow duration-500 ease-physical hover:shadow-lifted md:col-span-4 md:row-span-2"
      >
        <div className="flex h-full flex-col justify-between rounded-core border border-line/60 bg-panel p-5 shadow-inset">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium text-fog">{t("stat.total")}</span>
            <ChatsCircle size={16} className="text-sky" />
          </div>

          <div className="mt-6">
            <CountUp value={stats.total} className="text-[3rem]" />
            <p className="mt-2 text-[0.7rem] text-fog">{t("stat.total.sub")}</p>
          </div>

          <div className="mt-6 flex h-12 items-end gap-1" aria-hidden="true">
            {spark.map((value, index) => (
              <span
                key={index}
                style={{ height: `${Math.max(6, (value / sparkMax) * 100)}%` }}
                className={cx(
                  "flex-1 rounded-t-[3px] transition-colors duration-500",
                  value > 0 ? "bg-signal/70" : "bg-line"
                )}
              />
            ))}
          </div>
        </div>
      </motion.button>

      {/* --- wide tile: deflection --- */}
      <motion.button
        type="button"
        variants={enter}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => onFilterClick?.("resolution")}
        className="spotlight rounded-shell border border-line/70 bg-panelCard/40 p-1.5 text-left shadow-ambient transition-shadow duration-500 ease-physical hover:shadow-lifted md:col-span-8"
      >
        <div className="rounded-core border border-line/60 bg-panel p-5 shadow-inset">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium text-fog">{t("stat.resolution")}</span>
            <Gauge size={16} className="text-mint" />
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <CountUp value={stats.resolvedByAiPct} suffix="%" />
            <p className="text-[0.7rem] text-fog">
              {t("stat.resolution.sub", { n: stats.pendingHandoffs ?? 0 })}
            </p>
          </div>
          <div className="mt-4">
            <Meter value={stats.resolvedByAiPct} tone="mint" />
          </div>
        </div>
      </motion.button>

      {/* --- contacts --- */}
      <StatTile
        variants={enter}
        label={t("stat.leads")}
        sub={t("stat.leads.sub")}
        value={stats.totalLeads ?? 0}
        icon={<UserCirclePlus size={16} className="text-signal" />}
        onClick={() => onFilterClick?.("leads")}
        className="md:col-span-4"
      />

      {/* --- latency --- */}
      <StatTile
        variants={enter}
        label={t("stat.latency")}
        sub={t("stat.latency.sub")}
        value={stats.avgLatencyMs}
        suffix="ms"
        icon={<Lightning size={16} className="text-violet" />}
        className="md:col-span-4"
      />
    </motion.div>
  );
}

function StatTile({
  label,
  sub,
  value,
  suffix,
  icon,
  onClick,
  className,
  variants,
}: {
  label: string;
  sub: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variants: any;
}) {
  return (
    <motion.button
      type="button"
      variants={variants}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cx(
        "spotlight rounded-shell border border-line/70 bg-panelCard/40 p-1.5 text-left shadow-ambient transition-shadow duration-500 ease-physical hover:shadow-lifted",
        !onClick && "cursor-default",
        className
      )}
    >
      <div className="rounded-core border border-line/60 bg-panel p-5 shadow-inset">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-fog">{label}</span>
          {icon}
        </div>
        <div className="mt-3">
          <CountUp value={value} suffix={suffix} />
        </div>
        <p className="mt-2 text-[0.7rem] leading-relaxed text-fog">{sub}</p>
      </div>
    </motion.button>
  );
}
