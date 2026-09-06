"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Copy,
  PaperPlaneTilt,
  Robot,
  SealCheck,
  Sparkle,
  WarningDiamond,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { AiResult } from "@/lib/types";
import { useMoodLock } from "./MoodLock";
import { useSettings, useT } from "./providers/AppProviders";
import SentimentDot from "./SentimentDot";
import { Button, Chip, Segmented, Skeleton, cx } from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";
import {
  MOODS,
  WORKSPACE_MODES,
  type ReplyLength,
  type ReplyMood,
  type WorkspaceMode,
} from "@/lib/settings-schema";

/** Scenario seeds, grouped by what the inbox is for. */
const PRESETS: Record<string, Array<{ title: string; text: string }>> = {
  business: [
    {
      title: "Bengali order",
      text: "আমি পালস ইয়ারবাড ২টা অর্ডার করতে চাই। আমার নাম তানভীর আহমেদ, মোবাইল 01711223344, ধানমন্ডি ২৭, ঢাকা।",
    },
    {
      title: "Banglish price",
      text: "Bhasha Smart Watch er price koto? Ami Chattogram theke order korte chai, delivery fee koto?",
    },
    {
      title: "Angry refund",
      text: "Ami 3 din age order koresilam kintu ekhono delivery painai! Return & refund chai ASAP, khub kharap service!",
    },
    {
      title: "B2B enquiry",
      text: "My name is Farida Rahman at Meridian Labs. We need 15 units of the 65W GaN Charger, budget around $250. Reach me at farida.rahman@meridianlabs.io",
    },
  ],
  personal: [
    {
      title: "Friend checking in",
      text: "Onek din kotha hoy na! Kemon acho? Ei weekend e free acho? Coffee khete pari.",
    },
    {
      title: "Family news",
      text: "আম্মু বলল তুমি নাকি নতুন চাকরিতে জয়েন করেছ। খুব ভালো খবর! কবে আসবে বাড়িতে?",
    },
    {
      title: "Awkward decline",
      text: "Hey, can you cover my shift on Saturday? I know it is short notice but I am really stuck.",
    },
  ],
  official: [
    {
      title: "Leave application reply",
      text: "Respected Sir, I have applied for three days of casual leave from the 14th. Kindly inform me of the status of my application.",
    },
    {
      title: "Bengali notice query",
      text: "মহোদয়, গত ১০ তারিখে প্রেরিত আবেদনের প্রেক্ষিতে এখনো কোনো সিদ্ধান্ত জানানো হয়নি। বিষয়টি জানালে বাধিত হব।",
    },
    {
      title: "Vendor follow-up",
      text: "We have not received the signed purchase order for tender ref. 2026/PR/318. Please confirm the current status.",
    },
  ],
  creator: [
    { title: "Fan message", text: "Bhai apnar last video ta osadharon chilo! Next e kobe video ashbe?" },
    {
      title: "Sponsorship",
      text: "Hi! I run partnerships at Kestrel Audio. We would love to sponsor a video. What are your rates? Reply to nabila@kestrelaudio.com",
    },
    { title: "Hostile comment", text: "This channel has gone downhill. Total waste of time now." },
  ],
  support: [
    {
      title: "App crash",
      text: "The app crashes every time I open the reports tab. Android 14, version 3.2.1. I already reinstalled it.",
    },
    {
      title: "Login loop",
      text: "Login korle abar login page e fire ashe. Password thik ache, onno browser eo same problem.",
    },
    {
      title: "Data missing",
      text: "গতকালের সব রিপোর্ট ডাউনলোড করতে গিয়ে দেখি ফাইল খালি আসছে। আগে ঠিক ছিল।",
    },
  ],
};

export default function ReplyStudio({
  isOpen,
  onClose,
  onDrafted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDrafted?: () => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const { unlocked: moodUnlocked } = useMoodLock();

  const [mode, setMode] = useState<WorkspaceMode>(settings.persona.workspaceMode);
  const [mood, setMood] = useState<ReplyMood>(settings.persona.mood);
  const [length, setLength] = useState<ReplyLength>(settings.persona.replyLength);
  const [text, setText] = useState("");
  const [senderId, setSenderId] = useState("studio-visitor");
  const [record, setRecord] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(settings.persona.workspaceMode);
    setMood(settings.persona.mood);
    setLength(settings.persona.replyLength);
    setText((current) => current || PRESETS[settings.persona.workspaceMode]?.[0]?.text || "");
  }, [isOpen, settings.persona]);

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

  async function draft(event?: React.FormEvent) {
    event?.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          senderId: senderId.trim(),
          saveToLogs: record,
          workspaceMode: mode,
          mood,
          replyLength: length,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        setLatencyMs(data.latencyMs);
        if (record) onDrafted?.();
      }
    } catch (err) {
      console.error("Draft failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const presets = PRESETS[mode] || PRESETS.business;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-md"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("studio.title")}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
            className="flex max-h-[92dvh] w-full max-w-5xl flex-col rounded-shell border border-line bg-panel/95 p-1.5 shadow-island backdrop-blur-2xl"
          >
            <div className="flex min-h-0 flex-col rounded-core border border-line/60 bg-panel">
              {/* header */}
              <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                <div>
                  <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-paper">
                    {t("studio.title")}
                  </h2>
                  <p className="mt-1 text-xs text-fog">{t("studio.subtitle")}</p>
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

              <div className="scrollbar-thin grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-2">
                {/* ------------- compose ------------- */}
                <form onSubmit={draft} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3 rounded-card border border-line bg-panelCard p-4">
                    <span className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                      {t("studio.override")}
                    </span>
                    <Segmented<WorkspaceMode>
                      size="xs"
                      value={mode}
                      onChange={(next) => {
                        setMode(next);
                        const fallback = WORKSPACE_MODES.find((m) => m.id === next);
                        if (fallback) setMood(fallback.defaultMood);
                      }}
                      options={WORKSPACE_MODES.map((m) => ({
                        value: m.id,
                        label: t(`settings.mode.${m.id}` as TranslationKey),
                        hint: t(`settings.mode.${m.id}.desc` as TranslationKey),
                      }))}
                    />
                    <Segmented<ReplyMood>
                      size="xs"
                      value={mood}
                      onChange={setMood}
                      options={MOODS.filter((m) => !m.locked || moodUnlocked).map((m) => ({
                        value: m.id,
                        label: t(`settings.mood.${m.id}` as TranslationKey),
                      }))}
                    />
                    <Segmented<ReplyLength>
                      size="xs"
                      value={length}
                      onChange={setLength}
                      options={[
                        { value: "short", label: t("settings.length.short") },
                        { value: "medium", label: t("settings.length.medium") },
                        { value: "detailed", label: t("settings.length.detailed") },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[0.7rem] font-medium text-fog">{t("studio.presets")}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map((preset) => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => setText(preset.text)}
                          className="rounded-full border border-line bg-panelCard px-3 py-1.5 text-[0.72rem] text-fog transition-all duration-300 ease-physical hover:border-signal/40 hover:text-paper"
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studio-input" className="text-[0.7rem] font-medium text-fog">
                      {t("studio.input.label")}
                    </label>
                    <textarea
                      id="studio-input"
                      rows={5}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t("studio.input.placeholder")}
                      className="w-full resize-y rounded-card border border-line bg-panelCard p-4 text-sm leading-relaxed text-paper placeholder-fog/70 transition-colors focus:border-signal focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
                      <label htmlFor="studio-sender" className="text-[0.7rem] font-medium text-fog">
                        {t("studio.sender.label")}
                      </label>
                      <input
                        id="studio-sender"
                        value={senderId}
                        onChange={(e) => setSenderId(e.target.value)}
                        className="w-full rounded-soft border border-line bg-panelCard px-3 py-2 font-mono text-xs text-paper focus:border-signal focus:outline-none"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs text-fog">
                      <input
                        type="checkbox"
                        checked={record}
                        onChange={(e) => setRecord(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-line bg-panelCard"
                      />
                      {t("studio.record.label")}
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={loading || !text.trim()}
                    leadingIcon={<PaperPlaneTilt size={15} weight="fill" />}
                    trailingIcon={<ArrowRight size={13} weight="bold" />}
                  >
                    {loading ? t("studio.running") : t("studio.run")}
                  </Button>
                </form>

                {/* ------------- telemetry ------------- */}
                <div className="flex flex-col gap-4 rounded-card border border-line bg-panelCard p-5">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-paper">
                      <Robot size={15} weight="fill" className="text-mint" />
                      {t("studio.telemetry")}
                    </span>
                    {latencyMs !== null && !loading ? (
                      <span className="font-mono text-[0.7rem] text-fog">
                        {t("studio.latency")} {latencyMs}ms
                      </span>
                    ) : null}
                  </div>

                  {loading ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-medium text-paper">{t("studio.thinking")}</p>
                      <p className="text-[0.72rem] text-fog">{t("studio.thinkingSub")}</p>
                      <Skeleton className="mt-2 h-6 w-2/3" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : !result ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                      <Sparkle size={22} className="text-fog/60" />
                      <p className="max-w-xs text-xs leading-relaxed text-fog">{t("studio.idle")}</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip>
                          {t("studio.language")}:{" "}
                          <span className="text-paper">{result.detected_language}</span>
                        </Chip>
                        <SentimentDot sentiment={result.sentiment} />
                        <Chip>
                          {t("studio.intent")}:{" "}
                          <span className="font-mono text-paper">{result.intent}</span>
                        </Chip>
                      </div>

                      <div
                        className={cx(
                          "rounded-card border p-4 text-xs",
                          result.needs_human
                            ? "border-coral/40 bg-coral/10 text-coral"
                            : "border-mint/30 bg-mint/10 text-mint"
                        )}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          {result.needs_human ? (
                            <WarningDiamond size={14} weight="fill" />
                          ) : (
                            <SealCheck size={14} weight="fill" />
                          )}
                          {result.needs_human ? t("studio.route.human") : t("studio.route.auto")}
                        </span>
                        {result.escalation_reason ? (
                          <p className="mt-1.5 text-[0.72rem] text-paper/80">
                            {t("studio.reason")}: {result.escalation_reason}
                          </p>
                        ) : null}
                      </div>

                      {Object.values(result.lead).some(Boolean) ? (
                        <div className="rounded-card border border-line bg-panel p-4">
                          <span className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                            {t("studio.extracted")}
                          </span>
                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[0.72rem]">
                            {(
                              [
                                ["field.name", result.lead.name],
                                ["field.phone", result.lead.phone],
                                ["field.email", result.lead.email],
                                ["field.location", result.lead.location],
                                ["field.interest", result.lead.interest],
                                ["field.budget", result.lead.budget],
                              ] as Array<[TranslationKey, string]>
                            ).map(([key, value]) => (
                              <div key={key} className="min-w-0">
                                <dt className="text-fog">{t(key)}</dt>
                                <dd className="truncate font-medium text-paper">
                                  {value || t("field.none")}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ) : null}

                      <div className="rounded-card border border-line bg-panel p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                            {t("studio.reply")}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(result.reply);
                              setCopied(true);
                              window.setTimeout(() => setCopied(false), 1800);
                            }}
                            className="flex items-center gap-1.5 text-[0.72rem] text-fog transition-colors hover:text-paper"
                          >
                            {copied ? (
                              <CheckCircle size={12} weight="fill" className="text-mint" />
                            ) : (
                              <Copy size={12} />
                            )}
                            {copied ? t("action.copied") : t("action.copy")}
                          </button>
                        </div>
                        <p className="mt-3 whitespace-pre-line rounded-soft border-l-2 border-mint bg-panelCard p-4 text-[0.82rem] leading-relaxed text-paper">
                          {result.reply}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
