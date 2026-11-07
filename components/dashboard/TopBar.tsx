"use client";

import { MagnifyingGlass, SpeakerSimpleHigh, SpeakerSimpleNone } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useSettings } from "../providers/AppProviders";
import ThemeColorMenu from "../ThemeColorMenu";
import WorkspacePill from "../WorkspacePill";
import { cx } from "../ui/primitives";
import { LOCALE_LABEL } from "@/lib/i18n";
import type { UiLocale } from "@/lib/settings-schema";

const ROUND = "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-fog shadow-ambient transition-colors duration-300 ease-physical hover:text-paper";

export default function TopBar({ title, onOpenPalette }: { title: string; onOpenPalette: () => void }) {
  const { t, locale, setLocale } = useLocale();
  const { settings, engine, patchLocal, save } = useSettings();

  const today = new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function toggleSound() {
    const ui = { ...settings.ui, sound: !settings.ui.sound };
    patchLocal({ ui });
    save({ ui });
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-paper">{title}</h1>
        <p className="mt-0.5 text-xs text-fog" suppressHydrationWarning>
          {today}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          title={engine.live ? `${engine.provider} · ${engine.model}` : undefined}
          className={cx(
            "hidden items-center gap-2 rounded-full border px-3 py-2 font-mono text-[0.7rem] md:inline-flex",
            engine.live ? "border-mint/30 bg-mint/10 text-mint" : "border-line bg-panel text-fog"
          )}
        >
          <span className={cx("h-1.5 w-1.5 rounded-full", engine.live ? "animate-pulse-dot bg-mint" : "bg-fog")} />
          {engine.live ? engine.model : t("engine.offline")}
        </span>
        <WorkspacePill />
        <ThemeColorMenu />

        <div role="radiogroup" aria-label={t("action.language")} className="flex items-center rounded-full border border-line bg-panel p-1">
          {(["en", "bn"] as UiLocale[]).map((code) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={code === locale}
              onClick={() => setLocale(code)}
              className={cx(
                "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-colors",
                code === "bn" && "font-bangla",
                code === locale ? "bg-signal text-onSignal" : "text-fog hover:text-paper"
              )}
            >
              {code === "en" ? "EN" : LOCALE_LABEL.bn}
            </button>
          ))}
        </div>

        <button type="button" onClick={onOpenPalette} aria-label={t("action.command")} className={ROUND}>
          <MagnifyingGlass size={16} />
        </button>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={settings.ui.sound}
          aria-label={settings.ui.sound ? t("action.sound.on") : t("action.sound.off")}
          className={cx(ROUND, settings.ui.sound && "text-mint")}
        >
          {settings.ui.sound ? <SpeakerSimpleHigh size={16} /> : <SpeakerSimpleNone size={16} />}
        </button>
      </div>
    </header>
  );
}
