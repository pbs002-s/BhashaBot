"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { translate, type TranslationKey } from "@/lib/i18n";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type EngineStatus,
  type SafeSettings,
  type ThemePreference,
  type UiLocale,
} from "@/lib/settings-schema";

export const THEME_STORAGE_KEY = "bhashabot.theme";
export const LOCALE_STORAGE_KEY = "bhashabot.locale";
export const COLOR_STORAGE_KEY = "bhashabot.color";

export type AccentColor = "saffron" | "sage" | "cobalt" | "terracotta" | "dusk" | "mono";

export const ACCENT_COLORS: Array<{ id: AccentColor; label: string; swatch: string }> = [
  { id: "saffron", label: "Saffron", swatch: "#E9A04F" },
  { id: "sage", label: "Sage", swatch: "#6EC59B" },
  { id: "cobalt", label: "Cobalt", swatch: "#64B1E3" },
  { id: "terracotta", label: "Terracotta", swatch: "#EA7D6E" },
  { id: "dusk", label: "Dusk", swatch: "#B196E6" },
  { id: "mono", label: "Titanium", swatch: "#C7C3BD" },
];

/* =========================================================================
   Theme
   ========================================================================= */

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (next: ThemePreference) => void;
  cycle: () => void;
  color: AccentColor;
  setColor: (next: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") return "light" as const;
  const resolved = preference === "system" ? (systemPrefersDark() ? "dark" : "light") : preference;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

function applyColor(color: AccentColor) {
  if (typeof document === "undefined") return "saffron" as const;
  document.documentElement.dataset.color = color;
  return color;
}

/* =========================================================================
   Locale
   ========================================================================= */

interface LocaleContextValue {
  locale: UiLocale;
  setLocale: (next: UiLocale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/* =========================================================================
   Settings
   ========================================================================= */

interface SettingsContextValue {
  settings: SafeSettings;
  engine: EngineStatus;
  loading: boolean;
  saving: boolean;
  savedAt: number | null;
  error: string | null;
  /** Optimistic local update without a round trip. */
  patchLocal: (patch: Partial<AppSettings>) => void;
  /** Persists a patch and adopts whatever the server returns. */
  save: (patch: Partial<AppSettings>) => Promise<boolean>;
  reload: () => Promise<void>;
}

const emptySafe: SafeSettings = {
  ...DEFAULT_SETTINGS,
  secrets: {
    providerApiKey: "",
    telegramBotToken: "",
    fbPageAccessToken: "",
    fbAppSecret: "",
    igAccessToken: "",
    waAccessToken: "",
    discordBotToken: "",
    slackBotToken: "",
    slackSigningSecret: "",
    webhookSecret: "",
  },
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/* =========================================================================
   Provider
   ========================================================================= */

export default function AppProviders({ children }: { children: React.ReactNode }) {
  /* --- theme ---------------------------------------------------------- */
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
    const initial: ThemePreference =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setPreferenceState(initial);
    setResolved(applyTheme(initial));
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setResolved(applyTheme(next));
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const cycle = useCallback(() => {
    setPreferenceState((current) => {
      const order: ThemePreference[] = ["light", "dark", "system"];
      const next = order[(order.indexOf(current) + 1) % order.length];
      setResolved(applyTheme(next));
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  /* --- color ---------------------------------------------------------- */
  const [color, setColorState] = useState<AccentColor>("saffron");

  useEffect(() => {
    const stored = window.localStorage.getItem(COLOR_STORAGE_KEY) as AccentColor | null;
    const isValid = stored && ACCENT_COLORS.some((c) => c.id === stored);
    const initial: AccentColor = isValid ? (stored as AccentColor) : "saffron";
    setColorState(initial);
    applyColor(initial);
  }, []);

  const setColor = useCallback((next: AccentColor) => {
    setColorState(next);
    applyColor(next);
    window.localStorage.setItem(COLOR_STORAGE_KEY, next);
  }, []);

  /* --- locale --------------------------------------------------------- */
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as UiLocale | null;
    const initial: UiLocale = stored === "bn" || stored === "en" ? stored : "en";
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  /* --- settings ------------------------------------------------------- */
  const [settings, setSettings] = useState<SafeSettings>(emptySafe);
  const [engine, setEngine] = useState<EngineStatus>({
    provider: "Built-in rule engine",
    model: "bhasha-rules-v2",
    live: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydratedUi = useRef(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setSettings(data.settings);
      setEngine(data.engine);
      setError(null);

      // The server is the source of truth on first load only; after that the
      // local toggles win so a click never gets stomped by a refetch.
      if (!hydratedUi.current) {
        hydratedUi.current = true;
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        if (!storedTheme && data.settings?.ui?.theme) setPreference(data.settings.ui.theme);
        if (!storedLocale && data.settings?.ui?.locale) setLocale(data.settings.ui.locale);
      }
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [setLocale, setPreference]);

  useEffect(() => {
    reload();
  }, [reload]);

  const patchLocal = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({
      ...current,
      persona: { ...current.persona, ...(patch.persona || {}) },
      provider: { ...current.provider, ...(patch.provider || {}) },
      channels: { ...current.channels, ...(patch.channels || {}) },
      ui: { ...current.ui, ...(patch.ui || {}) },
    }));
  }, []);

  const save = useCallback(async (patch: Partial<AppSettings>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setSettings(data.settings);
      setEngine(data.engine);
      setSavedAt(Date.now());
      return true;
    } catch {
      setError("save");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  /* Mirror theme and locale into the persisted settings, quietly. */
  useEffect(() => {
    if (loading || !hydratedUi.current) return;
    if (settings.ui.theme === preference && settings.ui.locale === locale) return;
    const id = window.setTimeout(() => {
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui: { ...settings.ui, theme: preference, locale } }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setSettings(data.settings))
        .catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(id);
  }, [preference, locale, loading, settings.ui]);

  /* Motion and density are global switches, so they live on the root node. */
  useEffect(() => {
    document.documentElement.dataset.density = settings.ui.density;
    document.documentElement.style.scrollBehavior = settings.ui.reduceMotion ? "auto" : "smooth";
  }, [settings.ui.density, settings.ui.reduceMotion]);

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference, cycle, color, setColor }),
    [preference, resolved, setPreference, cycle, color, setColor]
  );
  const localeValue = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  const settingsValue = useMemo<SettingsContextValue>(
    () => ({ settings, engine, loading, saving, savedAt, error, patchLocal, save, reload }),
    [settings, engine, loading, saving, savedAt, error, patchLocal, save, reload]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <LocaleContext.Provider value={localeValue}>
        <SettingsContext.Provider value={settingsValue}>{children}</SettingsContext.Provider>
      </LocaleContext.Provider>
    </ThemeContext.Provider>
  );
}

/* =========================================================================
   Hooks
   ========================================================================= */

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside AppProviders");
  return ctx;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside AppProviders");
  return ctx;
}

export function useT() {
  return useLocale().t;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside AppProviders");
  return ctx;
}
