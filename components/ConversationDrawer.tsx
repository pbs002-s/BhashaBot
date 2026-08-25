"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  DollarSign,
  Building,
  Bot,
  UserCheck,
  Send,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import type { ConversationLog } from "@/lib/types";
import SentimentDot from "./SentimentDot";

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
  const [agentReplyText, setAgentReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  async function handleSendAgentReply(e: React.FormEvent) {
    e.preventDefault();
    if (!agentReplyText.trim() || !log) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/conversations/${log.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: agentReplyText.trim() }),
      });

      if (res.ok) {
        setAgentReplyText("");
        onUpdated?.();
      }
    } catch (err) {
      console.error("Failed to send agent reply:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleResolve() {
    if (!log) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/conversations/${log.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !log.isResolved }),
      });
      if (res.ok) {
        onUpdated?.();
      }
    } catch (err) {
      console.error("Failed to toggle resolve:", err);
    } finally {
      setResolving(false);
    }
  }

  function copyText(text: string, type: "phone" | "email") {
    navigator.clipboard.writeText(text);
    if (type === "phone") {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  }

  const hasLead =
    log.leadName || log.leadPhone || log.leadEmail || log.leadLocation || log.leadCompany;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="scrollbar-thin relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-panel shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-paper">Conversation Inspector</h3>
            <span className="rounded bg-line px-2 py-0.5 font-mono text-[10px] text-fog">
              #{log.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-fog transition-colors hover:bg-line hover:text-paper"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 p-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <SentimentDot sentiment={log.sentiment} />
            <span className="rounded-full border border-line bg-panelCard px-2.5 py-0.5 font-mono text-[11px] text-fog">
              {log.detectedLanguage} ({log.languageCode})
            </span>
            <span className="rounded-full border border-line bg-panelCard px-2.5 py-0.5 font-mono text-[11px] text-fog">
              intent: {log.intent}
            </span>
            <span className="rounded-full border border-line bg-panelCard px-2.5 py-0.5 font-mono text-[11px] text-fog">
              latency: {log.latencyMs}ms
            </span>
          </div>

          {/* Handoff Banner */}
          {log.needsHuman && (
            <div
              className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${
                log.isResolved
                  ? "border-mint/30 bg-mint/10 text-mint"
                  : "border-coral/40 bg-coral/10 text-coral"
              }`}
            >
              <div className="flex items-center gap-2">
                {log.isResolved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Human handoff marked as Resolved</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="h-4 w-4" />
                    <span className="font-medium">Pending Human Agent Attention</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleToggleResolve}
                disabled={resolving}
                className="rounded-lg border border-current px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {resolving ? "Updating…" : log.isResolved ? "Mark Unresolved" : "Mark Resolved"}
              </button>
            </div>
          )}

          {/* Customer Lead Profile Card */}
          {hasLead && (
            <div className="rounded-xl border border-line bg-panelCard p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-paper flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-signal" />
                  Captured Customer Details
                </span>
                {log.leadCompany && (
                  <span className="flex items-center gap-1 rounded bg-line px-2 py-0.5 text-[10px] text-fog">
                    <Building className="h-3 w-3" />
                    {log.leadCompany}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-fog block">Name</span>
                  <span className="font-medium text-paper">{log.leadName || "—"}</span>
                </div>
                <div>
                  <span className="text-[11px] text-fog block">Location</span>
                  <span className="font-medium text-paper">{log.leadLocation || "—"}</span>
                </div>
                <div>
                  <span className="text-[11px] text-fog block">Phone</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-paper">{log.leadPhone || "—"}</span>
                    {log.leadPhone && (
                      <button
                        onClick={() => copyText(log.leadPhone, "phone")}
                        className="text-fog hover:text-paper"
                      >
                        {copiedPhone ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-fog block">Email</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-paper truncate max-w-[130px]">{log.leadEmail || "—"}</span>
                    {log.leadEmail && (
                      <button
                        onClick={() => copyText(log.leadEmail, "email")}
                        className="text-fog hover:text-paper"
                      >
                        {copiedEmail ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>
                {log.leadInterest && (
                  <div>
                    <span className="text-[11px] text-fog block">Interest</span>
                    <span className="font-medium text-paper">{log.leadInterest}</span>
                  </div>
                )}
                {log.leadBudget && (
                  <div>
                    <span className="text-[11px] text-fog block">Budget</span>
                    <span className="font-medium text-paper">{log.leadBudget}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation Timeline */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-fog uppercase tracking-wider">
              Message Thread
            </span>

            {/* Customer Incoming Bubble */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-fog">
                <User className="h-3 w-3" />
                <span>Customer ({log.senderId.slice(0, 16)})</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-panelCard border border-line p-3.5 text-sm text-paper shadow-sm">
                {log.messageText}
              </div>
            </div>

            {/* AI Automated Reply Bubble */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-mint">
                <Bot className="h-3 w-3" />
                <span>AI Automated Reply</span>
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-mint/10 border border-mint/25 p-3.5 text-sm text-paper shadow-sm">
                {log.reply}
              </div>
            </div>

            {/* Human Agent Override Reply (if present) */}
            {log.agentReply && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 text-[11px] text-signal">
                  <UserCheck className="h-3 w-3" />
                  <span>Human Agent Response</span>
                  {log.agentRepliedAt && (
                    <span className="text-fog">
                      · {new Date(log.agentRepliedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-signal/10 border border-signal/30 p-3.5 text-sm text-paper shadow-sm">
                  {log.agentReply}
                </div>
              </div>
            )}
          </div>

          {/* Agent Reply Box */}
          <div className="mt-auto rounded-xl border border-line bg-panelCard p-4">
            <span className="mb-2 block text-xs font-semibold text-paper flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-signal" />
              Manual Agent Override / Direct Reply
            </span>
            <form onSubmit={handleSendAgentReply} className="flex flex-col gap-2.5">
              <textarea
                rows={3}
                value={agentReplyText}
                onChange={(e) => setAgentReplyText(e.target.value)}
                placeholder="Type your manual response to send back to the user and mark resolved..."
                className="w-full rounded-lg border border-line bg-panel p-2.5 text-xs text-paper placeholder-fog/60 focus:border-signal focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !agentReplyText.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-xs font-semibold text-ink transition-all hover:bg-signalLight disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Response & Mark Resolved</span>
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
