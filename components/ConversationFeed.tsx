"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChatCircleDots,
  Funnel,
  MagnifyingGlass,
  Robot,
  SealCheck,
  UserFocus,
  UsersThree,
  WarningDiamond,
} from "@phosphor-icons/react/dist/ssr";
import { roleForLoose } from "@/lib/relationships";
import type { TranslationKey } from "@/lib/i18n";
import type { ConversationLog, Sentiment } from "@/lib/types";
import { useT } from "./providers/AppProviders";
import SentimentDot from "./SentimentDot";
import { Chip, EmptyState, Select, Skeleton, cx } from "./ui/primitives";

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export default function ConversationFeed({
  logs,
  loading,
  onSelectLog,
  activeFilter = "all",
  emptyAction,
}: {
  logs: ConversationLog[];
  loading?: boolean;
  onSelectLog: (log: ConversationLog) => void;
  activeFilter?: string;
  emptyAction?: React.ReactNode;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState("all");
  const [route, setRoute] = useState(activeFilter);
  const [language, setLanguage] = useState("all");

  useEffect(() => setRoute(activeFilter), [activeFilter]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => l.detectedLanguage && set.add(l.detectedLanguage));
    return Array.from(set);
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const hit =
          log.messageText.toLowerCase().includes(q) ||
          log.reply.toLowerCase().includes(q) ||
          log.senderId.toLowerCase().includes(q) ||
          log.leadName?.toLowerCase().includes(q) ||
          log.intent?.toLowerCase().includes(q) ||
          log.detectedLanguage?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (sentiment !== "all" && log.sentiment !== sentiment) return false;
      if (route === "needsHuman" && (!log.needsHuman || log.isResolved)) return false;
      if (route === "resolved" && (!log.needsHuman || !log.isResolved)) return false;
      if (route === "botOnly" && log.needsHuman) return false;
      if (route === "hasLead" && !log.leadName && !log.leadPhone && !log.leadEmail) return false;
      if (language !== "all" && log.detectedLanguage !== language) return false;
      return true;
    });
  }, [logs, query, sentiment, route, language]);

  const filtersActive = Boolean(query.trim()) || sentiment !== "all" || route !== "all" || language !== "all";

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* --- filter rail --- */}
      <div className="flex flex-wrap items-end gap-3 rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient">
        <div className="flex w-full flex-wrap items-end gap-3 rounded-core border border-line/60 bg-panel p-3.5 shadow-inset">
          <div className="relative min-w-[15rem] flex-1">
            <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("live.search")}
              className="w-full rounded-full border border-line bg-panelCard py-2 pl-9 pr-4 text-xs text-paper placeholder-fog/70 transition-colors focus:border-signal focus:outline-none"
            />
          </div>

          <Select
            label=""
            value={sentiment}
            onChange={setSentiment}
            className="w-40"
            options={[
              { value: "all", label: t("live.filter.sentiment") },
              { value: "happy", label: t("sentiment.happy") },
              { value: "neutral", label: t("sentiment.neutral") },
              { value: "confused", label: t("sentiment.confused") },
              { value: "urgent", label: t("sentiment.urgent") },
              { value: "angry", label: t("sentiment.angry") },
            ]}
          />

          <Select
            label=""
            value={route}
            onChange={setRoute}
            className="w-48"
            options={[
              { value: "all", label: t("live.filter.route") },
              { value: "needsHuman", label: t("live.route.pending") },
              { value: "resolved", label: t("live.route.resolved") },
              { value: "botOnly", label: t("live.route.auto") },
              { value: "hasLead", label: t("live.route.lead") },
            ]}
          />

          {languages.length > 0 ? (
            <Select
              label=""
              value={language}
              onChange={setLanguage}
              className="w-44"
              options={[
                { value: "all", label: t("live.filter.language") },
                ...languages.map((l) => ({ value: l, label: l })),
              ]}
            />
          ) : null}
        </div>
      </div>

      {/* --- list --- */}
      {loading && logs.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5">
              <div className="rounded-core border border-line/60 bg-panel p-5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-3 h-4 w-4/5" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-4 h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-shell border border-dashed border-line bg-panelCard/30 p-1.5">
          <div className="rounded-core border border-line/50 bg-panel/60">
            <EmptyState
              icon={filtersActive ? <Funnel size={20} /> : <ChatCircleDots size={20} />}
              title={filtersActive ? t("live.empty.title") : t("live.empty.firstTitle")}
              body={filtersActive ? t("live.empty.body") : t("live.empty.firstBody")}
              action={filtersActive ? null : emptyAction}
            />
          </div>
        </div>
      ) : (
        <div className="scrollbar-thin flex max-h-[46rem] flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filtered.map((log, index) => (
              <ConversationCard
                key={log.id}
                log={log}
                index={index}
                onSelect={() => onSelectLog(log)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ConversationCard({
  log,
  index,
  onSelect,
}: {
  log: ConversationLog;
  index: number;
  onSelect: () => void;
}) {
  const t = useT();
  const hasLead = Boolean(log.leadName || log.leadPhone || log.leadEmail || log.leadCompany);
  // Roster match on whoever is writing, so a personal thread says who it is.
  const role = roleForLoose(log.leadName || log.senderId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.035, 0.28) }}
      onClick={onSelect}
      className="spotlight group cursor-pointer rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient transition-shadow duration-500 ease-physical hover:shadow-lifted"
    >
      <div className="rounded-core border border-line/60 bg-panel p-5 shadow-inset">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.7rem] text-fog">{log.senderId.slice(0, 18)}</span>
            <Chip>{log.detectedLanguage}</Chip>
            <SentimentDot sentiment={log.sentiment as Sentiment} />

            {log.needsHuman && !log.isResolved ? (
              <Chip tone="coral">
                <WarningDiamond size={11} weight="fill" />
                {t("live.badge.handoff")}
              </Chip>
            ) : null}
            {log.needsHuman && log.isResolved ? (
              <Chip tone="mint">
                <SealCheck size={11} weight="fill" />
                {t("live.badge.resolved")}
              </Chip>
            ) : null}
            {hasLead ? (
              <Chip tone="signal">
                <UserFocus size={11} weight="fill" />
                {t("live.badge.contact")}
              </Chip>
            ) : null}
            {role !== "unknown" ? (
              <Chip tone="violet">
                <UsersThree size={11} weight="fill" />
                {t(`role.${role}` as TranslationKey)}
              </Chip>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-fog">
            <time className="font-mono text-[0.7rem]" dateTime={log.createdAt}>
              {timeAgo(log.createdAt)}
            </time>
            <ArrowRight
              size={13}
              className="translate-x-0 opacity-0 transition-all duration-300 ease-physical group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </div>
        </div>

        <p className="mt-3.5 text-[0.9rem] font-medium leading-relaxed text-paper">
          {log.messageText}
        </p>

        <div className="mt-3 flex items-start gap-2.5 rounded-soft border-l-2 border-mint/60 bg-panelCard px-3.5 py-2.5">
          <Robot size={14} weight="fill" className="mt-0.5 shrink-0 text-mint" />
          <p className="line-clamp-2 text-xs leading-relaxed text-fog">{log.reply}</p>
        </div>

        {log.agentReply ? (
          <div className="mt-2 flex items-start gap-2.5 rounded-soft border-l-2 border-signal bg-signal/10 px-3.5 py-2">
            <UserFocus size={14} weight="fill" className="mt-0.5 shrink-0 text-signal" />
            <p className="line-clamp-1 text-xs text-signal">
              {t("live.agentPrefix")}: {log.agentReply}
            </p>
          </div>
        ) : null}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[0.7rem] text-fog">
          <span className="flex flex-wrap items-center gap-3">
            <span>
              {t("live.meta.intent")} <span className="text-paper">{log.intent}</span>
            </span>
            <span>
              {t("live.meta.latency")} <span className="text-paper">{log.latencyMs}ms</span>
            </span>
          </span>
          {log.leadName ? (
            <span className={cx("max-w-[16rem] truncate text-signal")}>
              {log.leadName}
              {log.leadPhone ? ` · ${log.leadPhone}` : ""}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
