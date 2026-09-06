"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, Lock, LockOpen } from "@phosphor-icons/react/dist/ssr";
import AmbientBackdrop from "./AmbientBackdrop";
import Logo from "./Logo";
import MoodGlyph from "./MoodGlyph";
import { useMoodLock } from "./MoodLock";
import SiteFooter from "./SiteFooter";
import { useLocale, useSettings } from "./providers/AppProviders";
import { cx } from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";
import { MOODS, PLATFORMS } from "@/lib/settings-schema";

/** The mood library: one card per mood, each linking to that mood's own page. */
export default function MoodIndex() {
  const { t, locale } = useLocale();
  const { settings } = useSettings();
  const activeMood = settings.persona.mood;
  const { unlocked } = useMoodLock();

  return (
    <>
      <AmbientBackdrop />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="mx-auto w-full max-w-[86rem] px-5 pt-10 md:px-8 lg:pt-14">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-fog transition-colors hover:text-paper"
            >
              <Logo size={22} />
              {t("app.name")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper"
            >
              <ArrowLeft size={12} />
              {t("moods.back.desk")}
            </Link>
          </div>

          <span className="mt-8 block text-micro font-semibold uppercase tracking-[0.24em] text-fog">
            {t("moods.eyebrow")}
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.035em] text-paper md:text-[3.2rem]">
            {t("moods.title")}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-fog">{t("moods.subtitle")}</p>

          <p className="mt-5 flex flex-wrap items-center gap-2 text-[0.72rem] text-fog">
            <span className="rounded-full border border-line bg-panelCard px-2.5 py-1">
              {t("moods.count", { n: MOODS.length })}
            </span>
            <span className="rounded-full border border-line bg-panelCard px-2.5 py-1">
              {t("moods.platforms")} · {PLATFORMS.length}
            </span>
          </p>
        </header>

        <main className="mx-auto w-full max-w-[86rem] flex-1 px-5 pb-20 pt-10 md:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {MOODS.map((mood, index) => {
              const active = mood.id === activeMood;
              return (
                <motion.div
                  key={mood.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.035, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/moods/${mood.id}`}
                    className={cx(
                      "group flex h-full flex-col rounded-shell border p-6 transition-all duration-300 ease-physical hover:-translate-y-0.5",
                      active
                        ? "border-signal/50 bg-signal/8 shadow-lifted"
                        : "border-line bg-panelCard/60 hover:border-lineLight hover:bg-panelHover"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        aria-hidden
                        className="flex h-10 w-10 items-center justify-center rounded-card"
                        style={{ backgroundColor: `${mood.accent}1f`, color: mood.accent }}
                      >
                        <MoodGlyph icon={mood.icon} size={18} />
                      </span>
                      {active ? (
                        <span className="rounded-full border border-signal/40 bg-signal/12 px-2.5 py-1 text-[0.65rem] font-medium text-signal">
                          {t("moods.active")}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-paper">
                      {t(`settings.mood.${mood.id}` as TranslationKey)}
                    </h2>
                    <p className="mt-2 flex-1 text-[0.78rem] leading-relaxed text-fog">
                      {mood.blurb[locale]}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {mood.bestFor.map((mode) => (
                          <span
                            key={mode}
                            className="rounded-full border border-line bg-panel px-2 py-0.5 text-[0.65rem] text-fog"
                          >
                            {t(`settings.mode.${mode}` as TranslationKey)}
                          </span>
                        ))}
                        {mood.locked ? (
                          <span
                            className={cx(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem]",
                              unlocked
                                ? "border-mint/40 bg-mint/10 text-mint"
                                : "border-line bg-panel text-fog"
                            )}
                          >
                            {unlocked ? (
                              <LockOpen size={9} weight="fill" />
                            ) : (
                              <Lock size={9} weight="fill" />
                            )}
                            {unlocked ? t("moods.unlocked") : t("moods.locked")}
                          </span>
                        ) : null}
                        {mood.intimate ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-2 py-0.5 text-[0.65rem] text-fog">
                            <Lock size={9} weight="fill" />
                            {t("moods.intimate")}
                          </span>
                        ) : null}
                      </div>
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-fog transition-transform duration-300 ease-physical group-hover:translate-x-0.5 group-hover:text-paper"
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <p className="mt-8 flex items-center gap-2 text-[0.72rem] text-fog">
            <Heart size={12} weight="fill" />
            {t("settings.mood.intimateHint")}
          </p>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
