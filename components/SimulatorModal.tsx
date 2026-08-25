"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  Bot,
  AlertOctagon,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  DollarSign,
  Building,
  CheckCircle,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import type { AiResult } from "@/lib/types";
import SentimentDot from "./SentimentDot";

const PRESETS = [
  {
    title: "🇧🇩 Bengali Order & Lead",
    text: "আমি পালস ইয়ারবাড ২টা অর্ডার করতে চাই। আমার নাম তানভীর আহমেদ, মোবাইল: 01711223344, ঢাকা ধানমন্ডি।",
  },
  {
    title: "💬 Banglish Price Inquiry",
    text: "Hi! Bhasha Smart Watch er price koto? Ami Chattogram theke order korte chai, delivery fee koto?",
  },
  {
    title: "🚨 Banglish Urgent Refund",
    text: "Ami 3 din age order koresilam kintu ekhono delivery painai! Return & refund chai ASAP, khub kharap service!",
  },
  {
    title: "💼 English B2B Lead",
    text: "Hello! My name is Sarah Jenkins from TechNova Corp. We want to purchase 15 units of the 65W GaN Charger for our office. Budget is $250. Email: sarah@technovacorp.io",
  },
  {
    title: "🇮🇳 Hindi Query",
    text: "नमस्ते! क्या आपके पास स्मार्ट वॉच का ब्लैक कलर उपलब्ध है? इसकी कीमत कितनी है और डिलीवरी कब होगी?",
  },
  {
    title: "🇪🇸 Spanish Inquiry",
    text: "Hola, me gustaría saber si hacen envíos a España y cuál es la política de garantía de 7 días.",
  },
];

export default function SimulatorModal({
  isOpen,
  onClose,
  onSimulationSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSimulationSuccess?: () => void;
}) {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [senderId, setSenderId] = useState("sim-user-alex");
  const [saveToLogs, setSaveToLogs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleSimulate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          senderId: senderId.trim(),
          saveToLogs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        setLatencyMs(data.latencyMs);
        if (saveToLogs) {
          onSimulationSuccess?.();
        }
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  }

  function copyReply() {
    if (!result?.reply) return;
    navigator.clipboard.writeText(result.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/15 text-signal">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-paper">
                Multilingual AI Simulator & Playground
              </h2>
              <p className="text-xs text-fog">
                Test custom customer prompts across languages and inspect live NLP diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-fog transition-colors hover:bg-line hover:text-paper"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="scrollbar-thin grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          {/* Left Column: Inputs & Presets */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fog">
                Quick Scenario Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(p.text);
                    }}
                    className="rounded-md border border-line bg-panelCard px-2.5 py-1 text-left text-[11px] font-medium text-fog transition-colors hover:border-signal/50 hover:text-paper"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSimulate} className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-paper">
                  Customer Message (Any Language / Script)
                </label>
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type anything in Bengali (বাংলা), Banglish, Hindi, Spanish, French, English..."
                  className="w-full rounded-xl border border-line bg-panelCard p-3 text-sm text-paper placeholder-fog/60 focus:border-signal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-fog">
                    Mock Sender ID / Name
                  </label>
                  <input
                    type="text"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    className="w-full rounded-lg border border-line bg-panelCard px-3 py-1.5 font-mono text-xs text-paper focus:border-signal focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-fog">
                    <input
                      type="checkbox"
                      checked={saveToLogs}
                      onChange={(e) => setSaveToLogs(e.target.checked)}
                      className="rounded border-line bg-panelCard text-signal focus:ring-0"
                    />
                    <span>Record to live feed</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-body text-sm font-semibold text-ink transition-all hover:bg-signalLight active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    <span>Analyzing & Generating Response…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Run Multilingual Simulation</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: AI Diagnostics & Reply Preview */}
          <div className="flex flex-col gap-4 rounded-xl border border-line bg-panelCard p-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-semibold text-paper flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-mint" />
                Live AI Diagnostic Telemetry
              </span>
              {latencyMs !== null && (
                <span className="font-mono text-[11px] text-fog">
                  Latency: <strong className="text-paper">{latencyMs}ms</strong>
                </span>
              )}
            </div>

            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <Zap className="h-8 w-8 animate-spin text-signal" />
                <p className="mt-3 text-xs font-medium text-paper">Processing with LLM / NLP Engine…</p>
                <p className="mt-1 text-[11px] text-fog">Detecting script, emotional tone & extracting lead entities</p>
              </div>
            )}

            {!loading && !result && (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-fog">
                <Sparkles className="h-8 w-8 text-fog/40" />
                <p className="mt-2 text-xs">Run a simulation to view full NLP telemetry and generated response</p>
              </div>
            )}

            {!loading && result && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5"
              >
                {/* 1. Language & Sentiment Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs">
                    <span className="text-[11px] text-fog">Language:</span>
                    <span className="font-medium text-mint">{result.detected_language}</span>
                    <span className="rounded bg-line px-1 font-mono text-[10px] text-fog">
                      {result.language_code}
                    </span>
                  </div>

                  <SentimentDot sentiment={result.sentiment} />

                  <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs">
                    <span className="text-[11px] text-fog">Intent:</span>
                    <span className="font-mono text-[11px] text-paper">{result.intent}</span>
                  </div>
                </div>

                {/* 2. Routing Decision */}
                <div
                  className={`rounded-xl border p-3 text-xs ${
                    result.needs_human
                      ? "border-coral/40 bg-coral/10 text-coral"
                      : "border-mint/30 bg-mint/10 text-mint"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {result.needs_human ? (
                      <>
                        <AlertOctagon className="h-4 w-4" />
                        <span>Route: Escalated to Telegram Human Support</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Route: Automated AI Reply Sent</span>
                      </>
                    )}
                  </div>
                  {result.escalation_reason && (
                    <p className="mt-1 text-[11px] text-paper/80 font-normal">
                      Reason: {result.escalation_reason}
                    </p>
                  )}
                </div>

                {/* 3. Extracted Leads */}
                <div className="rounded-xl border border-line bg-panel p-3">
                  <span className="text-[11px] font-semibold text-fog uppercase tracking-wider block mb-2">
                    Extracted Lead Entities
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-fog">
                      <User className="h-3 w-3 text-signal" />
                      <span>Name:</span>
                      <strong className="text-paper truncate">{result.lead.name || "—"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-fog">
                      <Phone className="h-3 w-3 text-mint" />
                      <span>Phone:</span>
                      <strong className="text-paper truncate">{result.lead.phone || "—"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-fog">
                      <Mail className="h-3 w-3 text-sky" />
                      <span>Email:</span>
                      <strong className="text-paper truncate">{result.lead.email || "—"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-fog">
                      <MapPin className="h-3 w-3 text-coral" />
                      <span>Location:</span>
                      <strong className="text-paper truncate">{result.lead.location || "—"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-fog">
                      <Tag className="h-3 w-3 text-violet" />
                      <span>Interest:</span>
                      <strong className="text-paper truncate">{result.lead.interest || "—"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-fog">
                      <DollarSign className="h-3 w-3 text-signalLight" />
                      <span>Budget:</span>
                      <strong className="text-paper truncate">{result.lead.budget || "—"}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Generated Reply Bubble */}
                <div className="rounded-xl border border-line bg-panel p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-fog uppercase tracking-wider">
                      AI Generated Response
                    </span>
                    <button
                      type="button"
                      onClick={copyReply}
                      className="flex items-center gap-1 text-[11px] text-fog hover:text-paper"
                    >
                      {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="rounded-lg bg-panelCard border-l-2 border-mint p-3 text-xs leading-relaxed text-paper">
                    {result.reply}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
