"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Broadcast,
  ChartBar,
  Check,
  CirclesThreePlus,
  Command,
  MagnifyingGlass,
  Heart,
  Notebook,
  PenNib,
  SlidersHorizontal,
  SpeakerSimpleNone,
  SpeakerSimpleHigh,
  Terminal,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { useLocale, useSettings, useTheme } from "./providers/AppProviders";
import Logo from "./Logo";
import ThemeColorMenu from "./ThemeColorMenu";
import WorkspacePill from "./WorkspacePill";
import { Button, cx } from "./ui/primitives";
import { LOCALE_LABEL } from "@/lib/i18n";
import type { ThemePreference, UiLocale } from "@/lib/settings-schema";

export type NavTab = "live" | "analytics" | "leads" | "knowledge" | "settings";

const TABS: Array<{ id: NavTab; icon: React.ComponentType<any>; key: string }> = [
  { id: "live", icon: Broadcast, key: "nav.live" },
  { id: "analytics", icon: ChartBar, key: "nav.analytics" },
  { id: "leads", icon: UsersThree, key: "nav.leads" },
  { id: "knowledge", icon: Notebook, key: "nav.knowledge" },
  { id: "settings", icon: SlidersHorizontal, key: "nav.settings" },
];

export default function StatusHeader({
  activeTab,
  onTabChange,
  onOpenStudio,
  onOpenPalette,
}: {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenStudio: () => void;
  onOpenPalette: () => void;
}) {
  const { t, locale, setLocale } = useLocale();
  const { settings, engine, patchLocal, save } = useSettings();

  function toggleSound() {
    const ui = { ...settings.ui, sound: !settings.ui.sound };
    patchLocal({ ui });
    save({ ui });
  }

  return (
    <>
      {/* ---- Masthead: deliberately left-weighted, not a centred banner ---- */}
      <header className="mx-auto w-full max-w-[86rem] px-5 pt-10 md:px-8 lg:pt-14">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.24em] text-fog">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-mint" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
              </span>
              {t("app.eyebrow")}
            </span>

            <h1 className="mt-3 flex items-center gap-3 font-display text-[2.6rem] font-semibold leading-[0.95] tracking-[-0.035em] text-paper md:text-[3.4rem]">
              <Link href="/" title="Back to overview" className="group inline-flex items-center gap-3 transition-opacity hover:opacity-90">
                <Logo size={40} className="shrink-0 rounded-card shadow-ambient transition-transform duration-300 ease-physical group-hover:scale-105 md:h-12 md:w-12" />
                <span>{t("app.name")}</span>
              </Link>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">{t("app.tagline")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <EngineChip live={engine.live} provider={engine.provider} model={engine.model} />
            <WorkspacePill />
            <ThemeColorMenu />
            <LocaleSwitch locale={locale} onChange={setLocale} label={t("action.language")} />

            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={settings.ui.sound}
              title={settings.ui.sound ? t("action.sound.on") : t("action.sound.off")}
              className={cx(
                "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ease-physical active:scale-95",
                settings.ui.sound
                  ? "border-mint/40 bg-mint/12 text-mint"
                  : "border-line bg-panelCard text-fog hover:border-lineLight hover:text-paper"
              )}
            >
              {settings.ui.sound ? (
                <SpeakerSimpleHigh size={14} />
              ) : (
                <SpeakerSimpleNone size={14} />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenPalette}
              className="hidden items-center gap-2 rounded-full border border-line bg-panelCard py-1.5 pl-3 pr-2 text-xs text-fog transition-all duration-300 ease-physical hover:border-lineLight hover:text-paper sm:flex"
            >
              <MagnifyingGlass size={13} />
              <span>{t("action.command")}</span>
              <kbd className="flex items-center gap-0.5 rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.65rem] text-fog">
                <Command size={9} />K
              </kbd>
            </button>

            <Button
              variant="primary"
              onClick={onOpenStudio}
              leadingIcon={<PenNib size={14} weight="fill" />}
              trailingIcon={<CirclesThreePlus size={12} weight="bold" />}
            >
              {t("action.playground")}
            </Button>
          </div>
        </div>
      </header>

      {/* ---- Floating island navigation, detached from the top edge ---- */}
      <div className="sticky top-4 z-30 mx-auto mt-8 w-max max-w-[calc(100vw-2rem)] px-2">
        <nav
          aria-label={t("app.name")}
          className="glass-island scrollbar-thin flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line p-1.5 shadow-island"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-300 ease-physical",
                  active ? "text-paper" : "text-fog hover:text-paper"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-island-active"
                    transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 rounded-full bg-panelCard shadow-ambient"
                  />
                ) : null}
                <Icon
                  size={14}
                  weight={active ? "fill" : "regular"}
                  className={cx("relative z-10", active ? "text-signal" : "")}
                />
                <span className="relative z-10 whitespace-nowrap">
                  {t(tab.key as Parameters<typeof t>[0])}
                </span>
              </button>
            );
          })}

          {/* The mood library is a route of its own, not a tab of this page. */}
          <Link
            href="/moods"
            className="relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-fog transition-colors duration-300 ease-physical hover:text-paper"
          >
            <Heart size={14} className="relative z-10" />
            <span className="relative z-10 whitespace-nowrap">{t("nav.moods")}</span>
          </Link>

          {/* Background bot userbot servers page */}
          <Link
            href="/servers"
            className="relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-fog transition-colors duration-300 ease-physical hover:text-paper"
          >
            <Terminal size={14} className="relative z-10 text-signal" />
            <span className="relative z-10 whitespace-nowrap">{t("nav.servers")}</span>
          </Link>
        </nav>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------- */

function EngineChip({ live, provider, model }: { live: boolean; provider: string; model: string }) {
  const { t } = useLocale();
  return (
    <span
      title={live ? `${provider} · ${model}` : undefined}
      className={cx(
        "hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.7rem] md:inline-flex",
        live ? "border-mint/30 bg-mint/10 text-mint" : "border-line bg-panelCard text-fog"
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", live ? "bg-mint" : "bg-fog")} />
      {live ? model : t("engine.offline")}
    </span>
  );
}

function LocaleSwitch({
  locale,
  onChange,
  label,
}: {
  locale: UiLocale;
  onChange: (next: UiLocale) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-full border border-line bg-panelCard p-1"
    >
      {(["en", "bn"] as UiLocale[]).map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(code)}
            className={cx(
              "rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-all duration-300 ease-physical",
              code === "bn" && "font-bangla",
              active ? "bg-panel text-paper shadow-ambient" : "text-fog hover:text-paper"
            )}
          >
            {code === "en" ? "EN" : LOCALE_LABEL.bn}
          </button>
        );
      })}
    </div>
  );
}


