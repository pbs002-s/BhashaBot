"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowElbowDownLeft, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useLocale, useSettings, useTheme } from "./providers/AppProviders";
import { cx } from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";
import { MOODS, WORKSPACE_MODES } from "@/lib/settings-schema";
import type { NavTab } from "./StatusHeader";

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  onNavigate,
  onOpenStudio,
  onFireTest,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenStudio: () => void;
  onFireTest: () => void;
}) {
  const { t, locale, setLocale } = useLocale();
  const { setPreference } = useTheme();
  const { settings, patchLocal, save } = useSettings();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const persona = settings.persona;
    const setPersona = (patch: Partial<typeof persona>) => {
      const next = { ...persona, ...patch };
      patchLocal({ persona: next });
      save({ persona: next });
    };

    const navGroup = t("palette.group.navigate");
    const modeGroup = t("palette.group.mode");
    const moodGroup = t("palette.group.mood");
    const doGroup = t("palette.group.actions");

    return [
      ...(["live", "analytics", "leads", "knowledge", "settings"] as NavTab[]).map((tab) => ({
        id: `nav-${tab}`,
        group: navGroup,
        label: t(`nav.${tab === "analytics" ? "analytics" : tab}` as TranslationKey),
        run: () => onNavigate(tab),
      })),
      {
        id: "nav-moods",
        group: navGroup,
        label: t("nav.moods"),
        hint: t("moods.subtitle"),
        run: () => router.push("/moods"),
      },
      ...MOODS.map((m) => ({
        id: `mood-page-${m.id}`,
        group: navGroup,
        label: `${t("nav.moods")} · ${t(`settings.mood.${m.id}` as TranslationKey)}`,
        run: () => router.push(`/moods/${m.id}`),
      })),
      ...WORKSPACE_MODES.map((m) => ({
        id: `mode-${m.id}`,
        group: modeGroup,
        label: t(`settings.mode.${m.id}` as TranslationKey),
        hint: t(`settings.mode.${m.id}.desc` as TranslationKey),
        run: () => setPersona({ workspaceMode: m.id }),
      })),
      ...MOODS.map((m) => ({
        id: `mood-${m.id}`,
        group: moodGroup,
        label: t(`settings.mood.${m.id}` as TranslationKey),
        // A locked mood cannot be switched to from here; open its page instead.
        run: () => (m.locked ? router.push(`/moods/${m.id}`) : setPersona({ mood: m.id })),
      })),
      {
        id: "open-studio",
        group: doGroup,
        label: t("action.playground"),
        run: onOpenStudio,
      },
      {
        id: "fire-test",
        group: doGroup,
        label: t("action.fireTest"),
        run: onFireTest,
      },
      {
        id: "theme-light",
        group: doGroup,
        label: t("action.theme.light"),
        run: () => setPreference("light"),
      },
      {
        id: "theme-dark",
        group: doGroup,
        label: t("action.theme.dark"),
        run: () => setPreference("dark"),
      },
      {
        id: "theme-system",
        group: doGroup,
        label: t("action.theme.system"),
        run: () => setPreference("system"),
      },
      {
        id: "locale",
        group: doGroup,
        label: locale === "en" ? "বাংলা" : "English",
        hint: t("settings.uiLanguage.label"),
        run: () => setLocale(locale === "en" ? "bn" : "en"),
      },
      {
        id: "sound",
        group: doGroup,
        label: settings.ui.sound ? t("action.sound.off") : t("action.sound.on"),
        run: () => {
          const ui = { ...settings.ui, sound: !settings.ui.sound };
          patchLocal({ ui });
          save({ ui });
        },
      },
    ];
  }, [
    t,
    locale,
    setLocale,
    setPreference,
    settings,
    patchLocal,
    save,
    router,
    onNavigate,
    onOpenStudio,
    onFireTest,
  ]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(results.length - 1, c + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const picked = results[cursor];
        if (picked) {
          picked.run();
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, results, cursor, onClose]);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/70 px-4 pt-[12vh] backdrop-blur-md"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("action.command")}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-xl rounded-shell border border-line bg-panel/95 p-1.5 shadow-island backdrop-blur-2xl"
          >
            <div className="overflow-hidden rounded-core border border-line/60 bg-panel">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                <MagnifyingGlass size={16} className="shrink-0 text-fog" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("palette.placeholder")}
                  className="w-full bg-transparent text-sm text-paper placeholder-fog/70 focus:outline-none"
                />
                <kbd className="hidden shrink-0 rounded border border-line bg-panelCard px-1.5 py-0.5 font-mono text-[0.65rem] text-fog sm:block">
                  esc
                </kbd>
              </div>

              <div ref={listRef} className="scrollbar-thin max-h-[52vh] overflow-y-auto p-1.5">
                {results.length === 0 ? (
                  <p className="px-3 py-10 text-center text-xs text-fog">{t("palette.empty")}</p>
                ) : (
                  results.map((command, index) => {
                    const showGroup = command.group !== lastGroup;
                    lastGroup = command.group;
                    const active = index === cursor;
                    return (
                      <React.Fragment key={command.id}>
                        {showGroup ? (
                          <p className="px-3 pb-1 pt-3 text-micro font-semibold uppercase tracking-[0.18em] text-fog">
                            {command.group}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          data-active={active}
                          onMouseEnter={() => setCursor(index)}
                          onClick={() => {
                            command.run();
                            onClose();
                          }}
                          className={cx(
                            "flex w-full items-center justify-between gap-3 rounded-soft px-3 py-2 text-left transition-colors duration-150",
                            active ? "bg-panelCard" : "hover:bg-panelCard/60"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-paper">
                              {command.label}
                            </span>
                            {command.hint ? (
                              <span className="mt-0.5 block truncate text-[0.7rem] text-fog">
                                {command.hint}
                              </span>
                            ) : null}
                          </span>
                          {active ? (
                            <ArrowElbowDownLeft size={13} className="shrink-0 text-signal" />
                          ) : null}
                        </button>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
