"use client";
import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ConversationLog, Sentiment } from "@/lib/types";
import SentimentDot from "./SentimentDot";
import {
  Search,
  AlertOctagon,
  CheckCircle2,
  User,
  Filter,
  Bot,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default function ConversationFeed({
  logs,
  onSelectLog,
  activeFilter = "all",
}: {
  logs: ConversationLog[];
  onSelectLog: (log: ConversationLog) => void;
  activeFilter?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [handoffFilter, setHandoffFilter] = useState<string>(activeFilter);
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  // Extract unique languages present in logs
  const languages = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.detectedLanguage) set.add(l.detectedLanguage);
    });
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.messageText.toLowerCase().includes(q) ||
          log.reply.toLowerCase().includes(q) ||
          log.senderId.toLowerCase().includes(q) ||
          log.leadName?.toLowerCase().includes(q) ||
          log.intent?.toLowerCase().includes(q) ||
          log.detectedLanguage?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Sentiment Filter
      if (sentimentFilter !== "all" && log.sentiment !== sentimentFilter) {
        return false;
      }

      // 3. Handoff Filter
      if (handoffFilter === "needsHuman" && (!log.needsHuman || log.isResolved)) {
        return false;
      }
      if (handoffFilter === "resolved" && (!log.needsHuman || !log.isResolved)) {
        return false;
      }
      if (handoffFilter === "botOnly" && log.needsHuman) {
        return false;
      }
      if (handoffFilter === "hasLead" && !log.leadName && !log.leadPhone && !log.leadEmail) {
        return false;
      }

      // 4. Language Filter
      if (languageFilter !== "all" && log.detectedLanguage !== languageFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, sentimentFilter, handoffFilter, languageFilter]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line bg-panel p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-fog" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, text, leads, or intents…"
            className="w-full rounded-lg border border-line bg-panelCard pl-9 pr-3 py-1.5 text-xs text-paper placeholder-fog/60 focus:border-signal focus:outline-none"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="rounded-lg border border-line bg-panelCard px-2.5 py-1.5 text-xs text-fog focus:border-signal focus:outline-none"
          >
            <option value="all">All Sentiments</option>
            <option value="happy">Happy</option>
            <option value="neutral">Neutral</option>
            <option value="confused">Confused</option>
            <option value="urgent">Urgent</option>
            <option value="angry">Angry</option>
          </select>

          <select
            value={handoffFilter}
            onChange={(e) => setHandoffFilter(e.target.value)}
            className="rounded-lg border border-line bg-panelCard px-2.5 py-1.5 text-xs text-fog focus:border-signal focus:outline-none"
          >
            <option value="all">All Routes</option>
            <option value="needsHuman">Pending Handoff</option>
            <option value="resolved">Resolved Handoff</option>
            <option value="botOnly">AI Auto-Reply</option>
            <option value="hasLead">Has Lead Contact</option>
          </select>

          {languages.length > 0 && (
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="rounded-lg border border-line bg-panelCard px-2.5 py-1.5 text-xs text-fog focus:border-signal focus:outline-none"
            >
              <option value="all">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Conversation List */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-panel/50 px-6 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-line text-fog">
            <Filter className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-sm font-semibold text-paper">No conversations match criteria</p>
          <p className="mt-1 max-w-xs text-xs text-fog">
            Try adjusting your search terms, clear active filters, or fire a test event.
          </p>
        </div>
      ) : (
        <div className="scrollbar-thin flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1 max-h-[750px]">
          <AnimatePresence initial={false}>
            {filteredLogs.map((log) => {
              const hasLead =
                log.leadName || log.leadPhone || log.leadEmail || log.leadCompany;

              return (
                <motion.article
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => onSelectLog(log)}
                  className="group cursor-pointer rounded-xl border border-line bg-panel p-4 transition-all duration-200 hover:border-lineLight hover:bg-panelCard hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-medium text-paper">
                        {log.senderId.slice(0, 16)}
                      </span>

                      <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[10px] text-fog">
                        {log.detectedLanguage}
                      </span>

                      <SentimentDot sentiment={log.sentiment as Sentiment} />

                      {log.needsHuman && !log.isResolved && (
                        <span className="flex items-center gap-1 rounded-full border border-coral/30 bg-coral/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-coral animate-pulse-dot">
                          <AlertOctagon className="h-3 w-3" />
                          Needs Handoff
                        </span>
                      )}

                      {log.needsHuman && log.isResolved && (
                        <span className="flex items-center gap-1 rounded-full border border-mint/30 bg-mint/15 px-2 py-0.5 font-mono text-[10px] text-mint">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved
                        </span>
                      )}

                      {hasLead && (
                        <span className="flex items-center gap-1 rounded-full border border-signal/30 bg-signal/15 px-2 py-0.5 font-mono text-[10px] text-signal">
                          <User className="h-3 w-3" />
                          Lead
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-fog">{timeAgo(log.createdAt)}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-fog opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>

                  {/* Customer message text */}
                  <div className="mt-2.5">
                    <p className="text-sm font-medium text-paper leading-snug">{log.messageText}</p>
                  </div>

                  {/* AI response snippet */}
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-panel/60 border-l-2 border-mint/70 px-3 py-2 text-xs text-fog">
                    <Bot className="h-3.5 w-3.5 text-mint shrink-0 mt-0.5" />
                    <p className="line-clamp-2 text-fog">{log.reply}</p>
                  </div>

                  {/* Agent manual reply if any */}
                  {log.agentReply && (
                    <div className="mt-1.5 flex items-start gap-2 rounded-lg bg-signal/10 border-l-2 border-signal px-3 py-1.5 text-xs text-signal">
                      <UserCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p className="line-clamp-1">Agent: {log.agentReply}</p>
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-fog">
                    <div className="flex items-center gap-3">
                      <span>intent: <strong className="text-paper/80 font-normal">{log.intent}</strong></span>
                      <span>latency: <strong className="text-paper/80 font-normal">{log.latencyMs}ms</strong></span>
                    </div>
                    {log.leadName && (
                      <span className="text-signal truncate max-w-[200px]">
                        👤 {log.leadName} {log.leadPhone ? `(${log.leadPhone})` : ""}
                      </span>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
