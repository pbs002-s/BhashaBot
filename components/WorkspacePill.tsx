"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown, Check, Lock } from "@phosphor-icons/react/dist/ssr";
import MoodGlyph from "./MoodGlyph";
import { useMoodLock } from "./MoodLock";
import { useSettings, useT } from "./providers/AppProviders";
import { cx } from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";
import {
  MOODS,
  WORKSPACE_MODES,
  moodMeta,
  type ReplyMood,
  type WorkspaceMode,
} from "@/lib/settings-schema";

const SWATCH_TEXT: Record<string, string> = {
  signal: "text-signal",
  mint: "text-mint",
  sky: "text-sky",
  violet: "text-violet",
  coral: "text-coral",
  blush: "text-blush",
  honey: "text-honey",
};

/**
 * The one control that changes what every reply sounds like, so it lives in
 * the masthead rather than three clicks deep in Settings.
 */
export default function WorkspacePill() {
  const t = useT();
  const { settings, patchLocal, save } = useSettings();
  const router = useRouter();
  const { unlocked } = useMoodLock();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { workspaceMode, mood } = settings.persona;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(patch: { workspaceMode?: WorkspaceMode; mood?: ReplyMood }) {
    const next = { ...settings.persona, ...patch };
    patchLocal({ persona: next });
    save({ persona: next });
  }

  const activeMood = moodMeta(mood);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="group flex items-center gap-2.5 rounded-full border border-line bg-panelCard py-1.5 pl-3 pr-2 text-xs transition-all duration-300 ease-physical hover:border-lineLight hover:bg-panelHover"
      >
        <MoodGlyph
          icon={activeMood.icon}
          size={13}
          className={cx("shrink-0", SWATCH_TEXT[activeMood.swatch])}
        />
        <span className="font-medium text-paper">
          {t(`settings.mode.${workspaceMode}` as TranslationKey)}
        </span>
        <span className="text-fog">·</span>
        <span className="text-fog">{t(`settings.mood.${mood}` as TranslationKey)}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-line/70 transition-transform duration-300 ease-physical group-hover:translate-y-px">
          <CaretDown size={10} weight="bold" className="text-fog" />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] origin-top-right rounded-shell border border-line bg-panel/95 p-1.5 shadow-island backdrop-blur-xl"
          >
            <div className="rounded-core border border-line/60 bg-panel p-4">
              <p className="text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                {t("settings.mode.label")}
              </p>
              <div className="mt-2.5 flex flex-col gap-1">
                {WORKSPACE_MODES.map((m) => {
                  const active = m.id === workspaceMode;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => choose({ workspaceMode: m.id })}
                      className={cx(
                        "flex items-start gap-2.5 rounded-soft px-2.5 py-2 text-left transition-colors duration-200 ease-physical",
                        active ? "bg-panelCard" : "hover:bg-panelCard/70"
                      )}
                    >
                      <span className="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                        {active ? <Check size={12} weight="bold" className="text-signal" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-paper">
                          {t(`settings.mode.${m.id}` as TranslationKey)}
                        </span>
                        <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-fog">
                          {t(`settings.mode.${m.id}.desc` as TranslationKey)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 border-t border-line pt-3.5 text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                {t("settings.mood.label")}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {MOODS.map((m) => {
                  const active = m.id === mood;
                  const shut = Boolean(m.locked) && !unlocked;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        // Locked moods are picked on their own page, behind the password.
                        if (shut) {
                          setOpen(false);
                          router.push(`/moods/${m.id}`);
                          return;
                        }
                        choose({ mood: m.id });
                      }}
                      className={cx(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] transition-all duration-300 ease-physical",
                        active
                          ? "border-signal/40 bg-signal/12 text-paper"
                          : "border-line bg-panelCard text-fog hover:border-lineLight hover:text-paper"
                      )}
                    >
                      <MoodGlyph icon={m.icon} size={11} className={SWATCH_TEXT[m.swatch]} />
                      {t(`settings.mood.${m.id}` as TranslationKey)}
                      {shut ? <Lock size={10} weight="fill" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
