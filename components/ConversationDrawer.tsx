"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUUpLeft,
  Clock,
  PaperPlaneTilt,
  Robot,
  SealCheck,
  UserFocus,
  WarningDiamond,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { ConversationLog } from "@/lib/types";
import { useT } from "./providers/AppProviders";
import SentimentDot from "./SentimentDot";
import { Button, Chip, CopyButton, cx } from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";

export default function ConversationDrawer({
  log,
  isOpen,
  onClose,
  onUpdated,
}: {
  log: ConversationLog | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const t = useT();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => setReplyText(""), [log?.id]);

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!replyText.trim() || !log) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${log.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        onUpdated?.();
      }
    } catch (err) {
      console.error("Agent reply failed:", err);
    } finally {
      setSending(false);
    }
  }

  async function toggleResolved() {
    if (!log) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/conversations/${log.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !log.isResolved }),
      });
      if (res.ok) onUpdated?.();
    } catch (err) {
      console.error("Resolve toggle failed:", err);
    } finally {
      setResolving(false);
    }
  }

  const hasLead = Boolean(
    log && (log.leadName || log.leadPhone || log.leadEmail || log.leadLocation || log.leadCompany)
  );

  return (
    <AnimatePresence>
      {isOpen && log ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex justify-end bg-ink/65 backdrop-blur-sm"
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("thread.title")}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
            className="scrollbar-thin flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-panel shadow-island"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel/95 px-6 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <h3 className="font-display text-sm font-semibold text-paper">
                  {t("thread.title")}
                </h3>
                <span className="rounded-full bg-panelCard px-2 py-0.5 font-mono text-[0.65rem] text-fog">
                  #{log.id}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("action.close")}
                className="rounded-full border border-line bg-panelCard p-2 text-fog transition-colors hover:text-paper"
              >
                <X size={14} weight="bold" />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <SentimentDot sentiment={log.sentiment} />
                <Chip>
                  {log.detectedLanguage} · {log.languageCode}
                </Chip>
                <Chip>{log.intent}</Chip>
                <Chip>{log.latencyMs}ms</Chip>
              </div>

              {log.needsHuman ? (
                <div
                  className={cx(
                    "flex flex-wrap items-center justify-between gap-3 rounded-card border p-4 text-xs",
                    log.isResolved
                      ? "border-mint/30 bg-mint/10 text-mint"
                      : "border-coral/40 bg-coral/10 text-coral"
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {log.isResolved ? (
                      <SealCheck size={15} weight="fill" />
                    ) : (
                      <WarningDiamond size={15} weight="fill" />
                    )}
                    {log.isResolved ? t("thread.resolvedBanner") : t("thread.pending")}
                  </span>
                  <button
                    type="button"
                    onClick={toggleResolved}
                    disabled={resolving}
                    className="flex items-center gap-1.5 rounded-full border border-current px-3 py-1.5 text-[0.72rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    {log.isResolved ? <ArrowUUpLeft size={12} /> : <SealCheck size={12} />}
                    {resolving
                      ? t("thread.updating")
                      : log.isResolved
                      ? t("thread.markUnresolved")
                      : t("thread.markResolved")}
                  </button>
                </div>
              ) : null}

              {hasLead ? (
                <section className="rounded-card border border-line bg-panelCard p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-paper">
                      <UserFocus size={14} weight="fill" className="text-signal" />
                      {t("thread.details")}
                    </span>
                    {log.leadPhone || log.leadEmail ? (
                      <CopyButton
                        value={log.leadPhone || log.leadEmail}
                        copyLabel={t("action.copy")}
                        doneLabel={t("action.copied")}
                      />
                    ) : null}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-xs">
                    {(
                      [
                        ["field.name", log.leadName],
                        ["field.location", log.leadLocation],
                        ["field.phone", log.leadPhone],
                        ["field.email", log.leadEmail],
                        ["field.interest", log.leadInterest],
                        ["field.budget", log.leadBudget],
                        ["field.company", log.leadCompany],
                      ] as Array<[TranslationKey, string]>
                    )
                      .filter(([, value]) => Boolean(value))
                      .map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-[0.7rem] text-fog">{t(key)}</dt>
                          <dd className="truncate font-medium text-paper">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </section>
              ) : null}

              <section className="flex flex-col gap-4">
                <span className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                  {t("thread.messages")}
                </span>

                <div className="flex flex-col items-start gap-1.5">
                  <span className="flex items-center gap-1.5 text-[0.7rem] text-fog">
                    <UserFocus size={11} />
                    {t("thread.from")} {log.senderId.slice(0, 18)}
                    <span aria-hidden="true">·</span>
                    <Clock size={11} />
                    <time dateTime={log.createdAt}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </time>
                  </span>
                  <p className="max-w-[88%] rounded-card rounded-tl-sm border border-line bg-panelCard p-4 text-sm leading-relaxed text-paper">
                    {log.messageText}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="flex items-center gap-1.5 text-[0.7rem] text-mint">
                    <Robot size={11} weight="fill" />
                    {t("thread.aiReply")}
                  </span>
                  <p className="max-w-[88%] whitespace-pre-line rounded-card rounded-tr-sm border border-mint/25 bg-mint/10 p-4 text-sm leading-relaxed text-paper">
                    {log.reply}
                  </p>
                </div>

                {log.agentReply ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1.5 text-[0.7rem] text-signal">
                      <UserFocus size={11} weight="fill" />
                      {t("thread.agentReply")}
                      {log.agentRepliedAt ? (
                        <time className="text-fog" dateTime={log.agentRepliedAt}>
                          · {new Date(log.agentRepliedAt).toLocaleTimeString()}
                        </time>
                      ) : null}
                    </span>
                    <p className="max-w-[88%] whitespace-pre-line rounded-card rounded-tr-sm border border-signal/30 bg-signal/10 p-4 text-sm leading-relaxed text-paper">
                      {log.agentReply}
                    </p>
                  </div>
                ) : null}
              </section>

              <form
                onSubmit={sendReply}
                className="mt-auto flex flex-col gap-3 rounded-card border border-line bg-panelCard p-5"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-paper">
                  <UserFocus size={14} weight="fill" className="text-signal" />
                  {t("thread.replyBox")}
                </span>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t("thread.replyPlaceholder")}
                  className="w-full resize-y rounded-soft border border-line bg-panel p-3 text-xs leading-relaxed text-paper placeholder-fog/70 focus:border-signal focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={sending || !replyText.trim()}
                  leadingIcon={<PaperPlaneTilt size={13} weight="fill" />}
                >
                  {sending ? t("action.saving") : t("thread.send")}
                </Button>
              </form>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
