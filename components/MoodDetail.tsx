"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  House,
  Lock,
  LockOpen,
  PaperPlaneTilt,
  Quotes,
} from "@phosphor-icons/react/dist/ssr";
import AmbientBackdrop from "./AmbientBackdrop";
import MoodGlyph from "./MoodGlyph";
import { MoodLockCard, useMoodLock } from "./MoodLock";
import SiteFooter from "./SiteFooter";
import { useLocale, useSettings } from "./providers/AppProviders";
import { Button, TextArea, cx } from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";
import type { AiResult } from "@/lib/types";
import {
  MOODS,
  PLATFORMS,
  PRITAM_SUB_MOODS,
  moodMeta,
  platformMeta,
  subMoodMeta,
  workspaceModeMeta,
  type PritamSubMood,
  type ReplyMood,
} from "@/lib/settings-schema";

interface PersonaSummary {
  trained: boolean;
  threads: number;
  ownMessagesUsed: number;
  subMoods: Record<string, { observed: number; learned: boolean }>;
}

/** One page per mood: what it does, how it sounds, and a drafting box. */
export default function MoodDetail({ moodId }: { moodId: ReplyMood }) {
  const { t, locale } = useLocale();
  const { settings, save, saving, patchLocal } = useSettings();

  const mood = moodMeta(moodId);
  const active = settings.persona.mood === moodId;
  const others = MOODS.filter((m) => m.id !== moodId);

  const [text, setText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [failed, setFailed] = useState(false);

  // Locked moods stay closed until this browser has passed the mood password.
  const { unlocked, loading: lockLoading, lock } = useMoodLock();
  const gated = Boolean(mood.locked) && !unlocked;

  const [subMood, setSubMood] = useState<PritamSubMood>(settings.persona.subMood || "friendly");
  const [persona, setPersona] = useState<PersonaSummary | null>(null);

  useEffect(() => {
    if (!mood.subMoods || gated) return;
    let live = true;
    fetch("/api/persona")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d?.persona && setPersona(d.persona))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [mood.subMoods, gated]);

  // In a business, official or support inbox an intimate mood is deliberately
  // held back to a friendly register, so the page says so rather than pretending.
  const guarded = mood.intimate && !workspaceModeMeta(settings.persona.workspaceMode).allowsIntimateMoods;

  const enabled = (settings.channels.enabledPlatforms || []).length
    ? settings.channels.enabledPlatforms
    : PLATFORMS.map((p) => p.id);

  const activate = useCallback(async () => {
    const next = { ...settings.persona, mood: moodId, subMood };
    patchLocal({ persona: next });
    await save({ persona: next });
  }, [moodId, patchLocal, save, settings.persona, subMood]);

  async function draft() {
    if (!text.trim() || drafting) return;
    setDrafting(true);
    setFailed(false);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mood: moodId, subMood, saveToLogs: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.result) throw new Error("draft failed");
      setResult(data.result);
    } catch {
      setFailed(true);
      setResult(null);
    } finally {
      setDrafting(false);
    }
  }

  return (
    <>
      <AmbientBackdrop />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {/* ---- hero, tinted with this mood's own accent ---- */}
        <header className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-80 blur-3xl"
            style={{
              background: `radial-gradient(60% 60% at 30% 100%, ${mood.accent}38, transparent 70%)`,
            }}
          />
          <div className="relative mx-auto w-full max-w-[86rem] px-5 pt-10 md:px-8 lg:pt-14">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/moods"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
              >
                <ArrowLeft size={12} />
                {t("moods.back.moods")}
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
              >
                <House size={12} weight="fill" />
                {t("moods.back.desk")}
              </Link>
              {mood.locked && unlocked ? (
                <button
                  type="button"
                  onClick={lock}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
                >
                  <Lock size={12} weight="fill" />
                  {t("moods.lockAgain")}
                </button>
              ) : null}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-xl">
                <span
                  aria-hidden
                  className="flex h-14 w-14 items-center justify-center rounded-core"
                  style={{ backgroundColor: `${mood.accent}22`, color: mood.accent }}
                >
                  <MoodGlyph icon={mood.icon} size={26} />
                </span>
                <h1
                  className="mt-5 font-display text-[2.6rem] font-semibold leading-[0.95] tracking-[-0.035em] md:text-[3.4rem]"
                  style={{ color: mood.accent }}
                >
                  {t(`settings.mood.${mood.id}` as TranslationKey)}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">{mood.blurb[locale]}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {mood.bestFor.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-full border border-line bg-panelCard px-3 py-1.5 text-[0.72rem] text-fog"
                  >
                    {t("moods.bestFor")}: {t(`settings.mode.${mode}` as TranslationKey)}
                  </span>
                ))}

                {gated ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-[0.72rem] text-fog">
                    <Lock size={13} weight="fill" />
                    {t("moods.locked")}
                  </span>
                ) : active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/12 px-3 py-1.5 text-[0.72rem] text-mint">
                    <CheckCircle size={13} weight="fill" />
                    {t("moods.active")}
                  </span>
                ) : (
                  <Button variant="primary" onClick={activate} disabled={saving}>
                    {saving ? t("moods.setting") : t("moods.setActive")}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[86rem] flex-1 px-5 pb-20 pt-10 md:px-8">
          {gated ? (
            <div className="max-w-2xl">
              {lockLoading ? (
                <div className="h-52 animate-pulse rounded-shell border border-line bg-panelCard/40" />
              ) : (
                <MoodLockCard accent={mood.accent} />
              )}
              <Link
                href="/moods"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-fog underline-offset-4 transition-colors hover:text-paper hover:underline"
              >
                <ArrowLeft size={12} />
                {t("moods.back.options")}
              </Link>
            </div>
          ) : (
            <>
              {/* ---- sub-moods: the second dial under this mood ---- */}
              {mood.subMoods ? (
                <section className="mb-6 rounded-shell border border-line bg-panelCard/50 p-5 shadow-ambient">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-paper">
                        {t("moods.subMoods")}
                      </h2>
                      <p className="mt-1 text-[0.72rem] text-fog">{t("moods.subMoodHint")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/12 px-3 py-1.5 text-[0.7rem] text-mint">
                          <LockOpen size={12} weight="fill" />
                          {t("moods.unlocked")}
                        </span>
                      ) : null}
                      <Link
                        href="/moods"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[0.7rem] text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
                      >
                        <ArrowLeft size={12} />
                        {t("moods.back.options")}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {mood.subMoods.map((id) => {
                      const sub = subMoodMeta(id);
                      const on = subMood === id;
                      const learned = persona?.subMoods?.[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSubMood(id)}
                          title={sub.directive}
                          className={cx(
                            "flex flex-col items-start gap-1.5 rounded-card border p-3 text-left transition-all duration-300 ease-physical",
                            on
                              ? "border-signal/50 bg-signal/10"
                              : "border-line bg-panel hover:border-lineLight hover:bg-panelHover"
                          )}
                        >
                          <span aria-hidden style={{ color: sub.accent }}>
                            <MoodGlyph icon={sub.icon} size={16} />
                          </span>
                          <span className="text-[0.78rem] font-medium text-paper">
                            {t(`settings.subMood.${id}` as TranslationKey)}
                          </span>
                          <span className="text-[0.65rem] leading-snug text-fog">
                            {learned?.learned
                              ? t("moods.trainedSamples", { n: learned.observed })
                              : t("moods.trainedNone")}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-4 rounded-card border border-line bg-panel p-3 text-[0.72rem] leading-relaxed text-fog">
                    <span className="font-medium text-paper">
                      {t("settings.subMood.label")}:{" "}
                      {t(`settings.subMood.${subMood}` as TranslationKey)}
                    </span>{" "}
                    — {subMoodMeta(subMood).blurb[locale]}
                  </p>

                  <p className="mt-2 text-[0.68rem] text-fog">
                    {persona?.trained
                      ? t("moods.trainedOn", {
                          used: persona.ownMessagesUsed,
                          threads: persona.threads,
                        })
                      : t("moods.trainedNever")}
                  </p>
                </section>
              ) : null}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* ---- samples ---- */}
            <section className="flex flex-col gap-3 lg:col-span-7">
              <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-paper">
                {t("moods.sample")}
              </h2>

              {mood.samples.map((sample, i) => (
                <div
                  key={i}
                  className="rounded-shell border border-line bg-panelCard/50 p-5 shadow-ambient"
                >
                  <p className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                    {t("moods.incoming")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-paper">
                    {sample.incoming[locale]}
                  </p>

                  <p className="mt-5 text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                    {t("moods.outgoing")}
                  </p>
                  <p
                    className="mt-2 rounded-card border-l-2 p-3 text-sm leading-relaxed text-paper"
                    style={{ borderColor: mood.accent, backgroundColor: `${mood.accent}12` }}
                  >
                    {sample.reply[locale]}
                  </p>
                </div>
              ))}

              {/* ---- the prompt directive itself, no secrets kept ---- */}
              <div className="rounded-shell border border-line bg-panel p-5">
                <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                  <Quotes size={12} weight="fill" />
                  {t("moods.directive")}
                </p>
                <p className="mt-2 font-mono text-[0.72rem] leading-relaxed text-fog">
                  {mood.directive}
                </p>
              </div>

              {mood.intimate ? (
                <div
                  className="rounded-shell border p-5"
                  style={{ borderColor: `${mood.accent}55`, backgroundColor: `${mood.accent}0f` }}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold text-paper">
                    <Lock size={13} weight="fill" style={{ color: mood.accent }} />
                    {t("moods.intimate")}
                  </p>
                  <p className="mt-2 text-[0.75rem] leading-relaxed text-fog">
                    {t("moods.intimateBody")}
                  </p>
                  {guarded ? (
                    <p className="mt-3 rounded-card border border-line bg-panel p-3 text-[0.72rem] leading-relaxed text-fog">
                      {t("settings.mood.intimateHint")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            {/* ---- try it ---- */}
            <section className="flex flex-col gap-3 lg:col-span-5">
              <div className="rounded-shell border border-line bg-panelCard/50 p-5 shadow-ambient">
                <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-paper">
                  {t("moods.try")}
                </h2>
                <p className="mt-1 text-[0.72rem] text-fog">{t("moods.tryHint")}</p>

                <div className="mt-4 flex flex-col gap-3">
                  <TextArea
                    label={t("moods.incoming")}
                    rows={4}
                    value={text}
                    placeholder={t("moods.tryPlaceholder")}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    onClick={draft}
                    disabled={drafting || !text.trim()}
                    leadingIcon={<PaperPlaneTilt size={13} weight="fill" />}
                  >
                    {drafting ? t("moods.drafting") : t("moods.draft")}
                  </Button>
                </div>

                {failed ? (
                  <p className="mt-3 text-[0.72rem] text-coral">{t("error.loadFailed")}</p>
                ) : null}

                {result ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4"
                  >
                    <p className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                      {t("moods.result")}
                    </p>
                    <p
                      className="mt-2 whitespace-pre-wrap rounded-card border-l-2 p-3 text-sm leading-relaxed text-paper"
                      style={{ borderColor: mood.accent, backgroundColor: `${mood.accent}12` }}
                    >
                      {result.reply}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2 text-[0.68rem] text-fog">
                      <span className="rounded-full border border-line bg-panel px-2 py-0.5">
                        {result.detected_language}
                      </span>
                      <span className="rounded-full border border-line bg-panel px-2 py-0.5">
                        {t(`sentiment.${result.sentiment}` as TranslationKey)}
                      </span>
                      <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono">
                        {result.intent}
                      </span>
                    </p>
                  </motion.div>
                ) : null}
              </div>

              {/* ---- where this mood answers ---- */}
              <div className="rounded-shell border border-line bg-panel p-5">
                <p className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                  {t("moods.platforms")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {enabled.map((id) => (
                    <span
                      key={id}
                      className="rounded-full border border-line bg-panelCard px-2.5 py-1 text-[0.7rem] text-fog"
                    >
                      {platformMeta(id).label}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

            </>
          )}

          {/* ---- every other mood ---- */}
          <section className="mt-10">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-fog">
              {t("moods.other")}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {others.map((other) => (
                <Link
                  key={other.id}
                  href={`/moods/${other.id}`}
                  className={cx(
                    "flex items-center gap-2 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
                  )}
                >
                  <span aria-hidden style={{ color: other.accent }}>
                    <MoodGlyph icon={other.icon} size={13} />
                  </span>
                  {t(`settings.mood.${other.id}` as TranslationKey)}
                </Link>
              ))}
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
