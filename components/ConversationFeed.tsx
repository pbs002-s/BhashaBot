"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { ConversationLog } from "@/lib/types";
import SentimentDot from "./SentimentDot";

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export default function ConversationFeed({ logs }: { logs: ConversationLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-base text-paper">No messages yet</p>
        <p className="mt-1 max-w-xs text-sm text-fog">
          Connect a Facebook Page webhook, or press &ldquo;Send test message&rdquo; to see
          the AI respond live.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {logs.map((log) => (
          <motion.article
            key={log.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-xl border border-line bg-panel px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-fog">
                  {log.senderId.slice(0, 14)}
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-fog">
                  {log.detectedLanguage}
                </span>
                <SentimentDot sentiment={log.sentiment as any} />
                {log.needsHuman && (
                  <span className="rounded-full bg-coral/15 px-2 py-0.5 font-mono text-[10px] text-coral">
                    handoff
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-fog">{timeAgo(log.createdAt)}</span>
            </div>

            <p className="mt-2 text-sm text-paper">{log.messageText}</p>
            <p className="mt-1 border-l-2 border-mint/50 pl-2 text-sm text-fog">{log.reply}</p>

            <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px] text-fog">
              <span>intent: {log.intent}</span>
              <span>latency: {log.latencyMs}ms</span>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
