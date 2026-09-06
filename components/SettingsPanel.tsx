"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowSquareOut,
  Broadcast,
  CheckCircle,
  CirclesThreePlus,
  FloppyDisk,
  Gift,
  Heart,
  ListMagnifyingGlass,
  Lock,
  LockOpen,
  Palette,
  PlugsConnected,
  ShieldCheck,
  Waveform,
} from "@phosphor-icons/react/dist/ssr";
import MoodGlyph from "./MoodGlyph";
import { MoodLockCard, useMoodLock } from "./MoodLock";
import { useLocale, useSettings, useTheme } from "./providers/AppProviders";
import {
  Button,
  Chip,
  CopyButton,
  SecretInput,
  SectionHead,
  Segmented,
  Select,
  Slider,
  TextArea,
  TextInput,
  Toggle,
  cx,
} from "./ui/primitives";
import type { TranslationKey } from "@/lib/i18n";
import {
  CLEAR_SECRET,
  FREE_PROVIDERS,
  MOODS,
  PLATFORMS,
  PROVIDERS,
  SECRET_FIELDS,
  WORKSPACE_MODES,
  moodMeta,
  providerMeta,
  subMoodMeta,
  type AiProviderId,
  type AppSettings,
  type ChannelSecretField,
  type ChannelSettings,
  type Density,
  type EmojiLevel,
  type PlatformId,
  type PlatformMeta,
  type ProviderTier,
  type ReplyLanguage,
  type ReplyLength,
  type ReplyMood,
  type ThemePreference,
  type UiLocale,
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

const TIER_TONE: Record<ProviderTier, "mint" | "sky" | "neutral" | "coral"> = {
  builtin: "neutral",
  free: "mint",
  trial: "sky",
  paid: "coral",
};

const TIER_KEY: Record<ProviderTier, TranslationKey> = {
  builtin: "settings.tier.builtin",
  free: "settings.tier.free",
  trial: "settings.tier.trial",
  paid: "settings.tier.paid",
};

interface TestState {
  status: "idle" | "running" | "ok" | "fail";
  message?: string;
}

interface ScanState {
  status: "idle" | "running" | "ok" | "fail";
  models: string[];
  total: number;
  error?: string;
}

const NO_SCAN: ScanState = { status: "idle", models: [], total: 0 };

export default function SettingsPanel() {
  const { t, locale, setLocale } = useLocale();
  const { preference, setPreference } = useTheme();
  const { settings, engine, saving, save, patchLocal } = useSettings();

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [keyInput, setKeyInput] = useState("");
  /** One entry per channel secret, keyed by its field name. */
  const [channelSecrets, setChannelSecrets] = useState<Partial<Record<ChannelSecretField, string>>>({});
  const [clearedSecrets, setClearedSecrets] = useState<Record<string, boolean>>({});
  const [origin, setOrigin] = useState("");
  const [providerTest, setProviderTest] = useState<TestState>({ status: "idle" });
  const [telegramTest, setTelegramTest] = useState<TestState>({ status: "idle" });
  const [scan, setScan] = useState<ScanState>(NO_SCAN);
  const [justSaved, setJustSaved] = useState(false);
  const moodLock = useMoodLock();
  const [showLock, setShowLock] = useState(false);
  const activeMoodMeta = moodMeta(draft.persona.mood);

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => setOrigin(window.location.origin), []);

  const meta = providerMeta(draft.provider.id);

  /** Scanned ids win; the catalogue is the fallback. The model in use is always
      present so a saved value never silently disappears from the picker. */
  const modelOptions = useMemo(() => {
    const base = scan.status === "ok" && scan.models.length ? scan.models : meta.models;
    if (!base.length) return [];
    return base.includes(draft.provider.model) ? base : [draft.provider.model, ...base];
  }, [scan, meta.models, draft.provider.model]);

  const dirty = useMemo(
    () =>
      JSON.stringify(draft) !== JSON.stringify(settings) ||
      Boolean(keyInput) ||
      Object.values(channelSecrets).some(Boolean) ||
      Object.values(clearedSecrets).some(Boolean),
    [draft, settings, keyInput, channelSecrets, clearedSecrets]
  );

  const setPersona = (patch: Partial<AppSettings["persona"]>) =>
    setDraft((d) => ({ ...d, persona: { ...d.persona, ...patch } }));
  const setProvider = (patch: Partial<AppSettings["provider"]>) =>
    setDraft((d) => ({ ...d, provider: { ...d.provider, ...patch } }));
  const setChannels = (patch: Partial<AppSettings["channels"]>) =>
    setDraft((d) => ({ ...d, channels: { ...d.channels, ...patch } }));
  const setUi = (patch: Partial<AppSettings["ui"]>) =>
    setDraft((d) => ({ ...d, ui: { ...d.ui, ...patch } }));

  function togglePlatform(id: PlatformId, on: boolean) {
    const current = draft.channels.enabledPlatforms || [];
    setChannels({
      enabledPlatforms: on ? Array.from(new Set([...current, id])) : current.filter((p) => p !== id),
    });
  }

  async function handleSave() {
    const channels: ChannelSettings = { ...draft.channels };
    for (const field of SECRET_FIELDS.channels) {
      channels[field] = clearedSecrets[field] ? CLEAR_SECRET : channelSecrets[field] || "";
    }

    const payload: Partial<AppSettings> = {
      persona: draft.persona,
      provider: {
        ...draft.provider,
        apiKey: clearedSecrets.apiKey ? CLEAR_SECRET : keyInput,
      },
      channels,
      ui: draft.ui,
    };

    const ok = await save(payload);
    if (ok) {
      setKeyInput("");
      setChannelSecrets({});
      setClearedSecrets({});
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2400);
    }
  }

  /** Asks the provider which models this key reaches, before the key is saved. */
  async function runScan() {
    setScan({ ...NO_SCAN, status: "running" });
    try {
      const res = await fetch("/api/settings/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: draft.provider.id,
          apiKey: keyInput,
          baseUrl: draft.provider.baseUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setScan({ status: "ok", models: data.models || [], total: data.total || 0 });
      } else {
        setScan({ ...NO_SCAN, status: "fail", error: data.error || "unknown" });
      }
    } catch {
      setScan({ ...NO_SCAN, status: "fail", error: "network" });
    }
  }

  async function runTest(target: "provider" | "telegram") {
    const setState = target === "provider" ? setProviderTest : setTelegramTest;
    setState({ status: "running" });
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({
          status: "ok",
          message:
            target === "provider"
              ? t("settings.test.ok", { model: data.model, ms: data.latencyMs })
              : undefined,
        });
      } else {
        setState({ status: "fail", message: t("settings.test.fail", { error: data.error || "unknown" }) });
      }
    } catch {
      setState({ status: "fail", message: t("settings.test.fail", { error: "network" }) });
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      {/* ---------------- workspace ---------------- */}
      <Panel>
        <SectionHead
          title={t("settings.section.workspace")}
          hint={t("settings.section.workspace.hint")}
          icon={<CirclesThreePlus size={17} />}
        />
        <div className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {WORKSPACE_MODES.map((mode) => {
              const active = draft.persona.workspaceMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    setPersona({ workspaceMode: mode.id as WorkspaceMode, mood: mode.defaultMood })
                  }
                  aria-pressed={active}
                  className={cx(
                    "rounded-card border p-4 text-left transition-all duration-300 ease-physical",
                    active
                      ? "border-signal/50 bg-signal/8 shadow-ambient"
                      : "border-line bg-panelCard hover:border-lineLight hover:bg-panelHover"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-paper">
                      {t(`settings.mode.${mode.id}` as TranslationKey)}
                    </span>
                    {active ? <CheckCircle size={14} weight="fill" className="text-signal" /> : null}
                  </div>
                  <p className="mt-1.5 text-[0.72rem] leading-relaxed text-fog">
                    {t(`settings.mode.${mode.id}.desc` as TranslationKey)}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Toggle
              label={t("settings.captureLeads.label")}
              checked={draft.persona.captureLeads}
              onChange={(captureLeads) => setPersona({ captureLeads })}
            />
            <Toggle
              label={t("settings.autoEscalate.label")}
              checked={draft.persona.autoEscalate}
              onChange={(autoEscalate) => setPersona({ autoEscalate })}
            />
          </div>

          <TextInput
            label={t("settings.escalationKeywords.label")}
            value={draft.persona.escalationKeywords.join(", ")}
            onChange={(e) =>
              setPersona({ escalationKeywords: e.target.value.split(",").map((k) => k.trim()) })
            }
            disabled={!draft.persona.autoEscalate}
          />
        </div>
      </Panel>

      {/* ---------------- voice ---------------- */}
      <Panel>
        <SectionHead
          title={t("settings.section.voice")}
          hint={t("settings.section.voice.hint")}
          icon={<Waveform size={17} />}
          actions={
            <Link
              href="/moods"
              className="inline-flex items-center gap-1.5 text-[0.72rem] text-signal underline-offset-4 hover:underline"
            >
              <Heart size={12} weight="fill" />
              {t("settings.mood.explore")}
            </Link>
          }
        />
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-medium text-fog">{t("settings.mood.label")}</span>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((mood) => {
                const active = draft.persona.mood === mood.id;
                const shut = Boolean(mood.locked) && !moodLock.unlocked;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => {
                      // A locked mood asks for the password before it can be picked.
                      if (shut) {
                        setShowLock(true);
                        return;
                      }
                      setPersona({ mood: mood.id as ReplyMood });
                    }}
                    aria-pressed={active}
                    title={mood.directive}
                    className={cx(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300 ease-physical",
                      active
                        ? "border-signal/45 bg-signal/12 text-paper"
                        : "border-line bg-panelCard text-fog hover:border-lineLight hover:text-paper"
                    )}
                  >
                    <MoodGlyph
                      icon={mood.icon}
                      size={13}
                      className={cx(SWATCH_TEXT[mood.swatch])}
                    />
                    {t(`settings.mood.${mood.id}` as TranslationKey)}
                    {mood.locked ? (
                      shut ? (
                        <Lock size={11} weight="fill" />
                      ) : (
                        <LockOpen size={11} weight="fill" className="text-mint" />
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* ---- password gate for the owner's private persona mood ---- */}
            {showLock && !moodLock.unlocked ? (
              <div className="mt-1">
                <MoodLockCard accent="#8A63D2" compact onUnlocked={() => setShowLock(false)} />
                <button
                  type="button"
                  onClick={() => setShowLock(false)}
                  className="mt-2 inline-flex items-center gap-1.5 text-[0.72rem] text-fog underline-offset-4 hover:text-paper hover:underline"
                >
                  <ArrowLeft size={12} />
                  {t("moods.back.options")}
                </button>
              </div>
            ) : null}

            {/* ---- sub-moods, shown only for a mood that declares them ---- */}
            {activeMoodMeta.subMoods && !(activeMoodMeta.locked && !moodLock.unlocked) ? (
              <div className="mt-1 rounded-card border border-line bg-panel p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[0.7rem] font-medium text-fog">
                    {t("settings.subMood.label")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/moods/${activeMoodMeta.id}`}
                      className="text-[0.68rem] text-signal underline-offset-4 hover:underline"
                    >
                      {t("moods.open")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => moodLock.lock()}
                      className="inline-flex items-center gap-1 text-[0.68rem] text-fog underline-offset-4 hover:text-paper hover:underline"
                    >
                      <Lock size={10} weight="fill" />
                      {t("moods.lockAgain")}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeMoodMeta.subMoods.map((id) => {
                    const sub = subMoodMeta(id);
                    const on = (draft.persona.subMood || "friendly") === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPersona({ subMood: id })}
                        aria-pressed={on}
                        title={sub.directive}
                        className={cx(
                          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300 ease-physical",
                          on
                            ? "border-signal/45 bg-signal/12 text-paper"
                            : "border-line bg-panelCard text-fog hover:border-lineLight hover:text-paper"
                        )}
                      >
                        <span aria-hidden style={{ color: sub.accent }}>
                          <MoodGlyph icon={sub.icon} size={13} />
                        </span>
                        {t(`settings.subMood.${id}` as TranslationKey)}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.68rem] leading-relaxed text-fog/80">
                  {t("settings.subMood.hint")}
                </p>
              </div>
            ) : null}
            <p className="text-[0.7rem] leading-relaxed text-fog/80">
              {t("settings.mood.intimateHint")}{" "}
              <Link href={`/moods/${draft.persona.mood}`} className="text-signal underline-offset-4 hover:underline">
                {t("moods.open")}
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <Segmented<ReplyLength>
              label={t("settings.length.label")}
              value={draft.persona.replyLength}
              onChange={(replyLength) => setPersona({ replyLength })}
              options={[
                { value: "short", label: t("settings.length.short") },
                { value: "medium", label: t("settings.length.medium") },
                { value: "detailed", label: t("settings.length.detailed") },
              ]}
            />
            <Segmented<EmojiLevel>
              label={t("settings.emoji.label")}
              value={draft.persona.emojiLevel}
              onChange={(emojiLevel) => setPersona({ emojiLevel })}
              options={[
                { value: "none", label: t("settings.emoji.none") },
                { value: "light", label: t("settings.emoji.light") },
                { value: "expressive", label: t("settings.emoji.expressive") },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Select<ReplyLanguage>
              label={t("settings.replyLanguage.label")}
              value={draft.persona.replyLanguage}
              onChange={(replyLanguage) => setPersona({ replyLanguage })}
              options={(
                ["auto", "en", "bn", "bn-Latn", "hi", "es", "ar", "fr"] as ReplyLanguage[]
              ).map((code) => ({
                value: code,
                label: t(`settings.replyLanguage.${code}` as TranslationKey),
              }))}
            />
            <TextInput
              label={t("settings.senderName.label")}
              hint={t("settings.senderName.hint")}
              value={draft.persona.senderName}
              onChange={(e) => setPersona({ senderName: e.target.value })}
            />
            <TextInput
              label={t("settings.signature.label")}
              hint={t("settings.signature.hint")}
              value={draft.persona.signature}
              onChange={(e) => setPersona({ signature: e.target.value })}
            />
          </div>

          <TextArea
            label={t("settings.custom.label")}
            hint={t("settings.custom.hint")}
            rows={3}
            value={draft.persona.customInstructions}
            onChange={(e) => setPersona({ customInstructions: e.target.value })}
          />
        </div>
      </Panel>

      {/* ---------------- model ---------------- */}
      <Panel>
        <SectionHead
          title={t("settings.section.model")}
          hint={t("settings.section.model.hint")}
          icon={<PlugsConnected size={17} />}
          actions={
            <Chip tone={engine.live ? "mint" : "neutral"}>
              {engine.live ? engine.model : t("engine.offline")}
            </Chip>
          }
        />
        <div className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Select<AiProviderId>
              label={t("settings.provider.label")}
              value={draft.provider.id}
              onChange={(id) => {
                const next = providerMeta(id);
                setProvider({
                  id,
                  model: next.models[0] || draft.provider.model,
                  baseUrl: id === "custom" ? draft.provider.baseUrl : "",
                });
                setProviderTest({ status: "idle" });
                setScan(NO_SCAN);
              }}
              options={PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
            />

            {modelOptions.length > 0 ? (
              <Select
                label={t("settings.model.label")}
                hint={scan.status === "ok" ? t("settings.models.discovered") : undefined}
                value={draft.provider.model}
                onChange={(model) => setProvider({ model })}
                options={modelOptions.map((m) => ({ value: m, label: m }))}
              />
            ) : (
              <TextInput
                label={t("settings.model.custom")}
                value={draft.provider.model}
                onChange={(e) => setProvider({ model: e.target.value })}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={TIER_TONE[meta.tier]}>{t(TIER_KEY[meta.tier])}</Chip>
            <p className="text-[0.72rem] leading-relaxed text-fog">{meta.note[locale]}</p>
          </div>

          {meta.dialect !== "none" ? (
            <>
              <SecretInput
                label={t("settings.apiKey.label")}
                placeholder={meta.keyPrefixHint}
                value={keyInput}
                onChange={setKeyInput}
                storedPreview={clearedSecrets.apiKey ? "" : settings.secrets.providerApiKey}
                storedLabel={t("settings.apiKey.stored")}
                emptyLabel={t("settings.apiKey.none")}
                clearLabel={t("action.clear")}
                onClear={() => setClearedSecrets((c) => ({ ...c, apiKey: true }))}
              />

              {meta.keyUrl ? (
                <a
                  href={meta.keyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex w-max items-center gap-1.5 text-[0.72rem] text-signal underline-offset-4 hover:underline"
                >
                  {t("settings.apiKey.get")}
                  <ArrowSquareOut size={12} />
                </a>
              ) : null}

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={runScan}
                    disabled={scan.status === "running"}
                    leadingIcon={<ListMagnifyingGlass size={13} />}
                  >
                    {scan.status === "running"
                      ? t("settings.models.scanning")
                      : t("settings.models.scan")}
                  </Button>

                  {scan.status === "ok" ? (
                    <Chip tone="mint">
                      {t("settings.models.found", { n: scan.models.length, total: scan.total })}
                    </Chip>
                  ) : null}

                  {scan.status === "fail" ? (
                    <span className="text-[0.72rem] text-coral">
                      {t("settings.models.failed", { error: scan.error || "unknown" })}
                    </span>
                  ) : null}
                </div>

                <p className="text-[0.7rem] leading-relaxed text-fog/80">
                  {scan.status === "ok" && !scan.models.includes(draft.provider.model)
                    ? t("settings.models.missing")
                    : t("settings.models.hint")}
                </p>
              </div>

              {draft.provider.id === "custom" ? (
                <TextInput
                  label={t("settings.baseUrl.label")}
                  placeholder="https://your-gateway.example.com/v1/chat/completions"
                  value={draft.provider.baseUrl}
                  onChange={(e) => setProvider({ baseUrl: e.target.value })}
                />
              ) : null}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Slider
                  label={t("settings.temperature.label")}
                  hint={t("settings.temperature.hint")}
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={draft.provider.temperature}
                  onChange={(temperature) => setProvider({ temperature })}
                  format={(v) => v.toFixed(2)}
                />
                <Slider
                  label={t("settings.maxTokens.label")}
                  min={128}
                  max={4000}
                  step={64}
                  value={draft.provider.maxTokens}
                  onChange={(maxTokens) => setProvider({ maxTokens })}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => runTest("provider")}
                  disabled={providerTest.status === "running"}
                  leadingIcon={<ShieldCheck size={13} />}
                >
                  {providerTest.status === "running" ? t("action.testing") : t("action.test")}
                </Button>
                <TestResult state={providerTest} />
              </div>
            </>
          ) : null}
        </div>
      </Panel>

      {/* ---------------- free keys ---------------- */}
      <Panel>
        <SectionHead
          title={t("settings.freeKeys")}
          hint={t("settings.freeKeys.hint")}
          icon={<Gift size={17} />}
        />
        <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 xl:grid-cols-3">
          {FREE_PROVIDERS.map((provider) => {
            const selected = draft.provider.id === provider.id;
            return (
              <div
                key={provider.id}
                className={cx(
                  "flex flex-col rounded-card border p-4",
                  selected ? "border-signal/45 bg-signal/8" : "border-line bg-panelCard"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-paper">{provider.label}</span>
                  <Chip tone={TIER_TONE[provider.tier]}>{t(TIER_KEY[provider.tier])}</Chip>
                </div>

                <p className="mt-2 flex-1 text-[0.72rem] leading-relaxed text-fog">
                  {provider.note[locale]}
                </p>

                {provider.models[0] ? (
                  <p className="mt-2 font-mono text-[0.65rem] text-fog/80">{provider.models[0]}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => {
                      setProvider({
                        id: provider.id,
                        model: provider.models[0] || draft.provider.model,
                        baseUrl: "",
                      });
                      setProviderTest({ status: "idle" });
                    }}
                    disabled={selected}
                  >
                    {selected ? t("moods.active") : t("settings.freeKeys.use")}
                  </Button>
                  {provider.keyUrl ? (
                    <a
                      href={provider.keyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-[0.72rem] text-signal underline-offset-4 hover:underline"
                    >
                      {t("settings.freeKeys.get")}
                      <ArrowSquareOut size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ---------------- platforms ---------------- */}
      <Panel>
        <SectionHead
          title={t("settings.section.platforms")}
          hint={t("settings.section.platforms.hint")}
          icon={<Broadcast size={17} />}
        />
        <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              origin={origin}
              enabled={(draft.channels.enabledPlatforms || []).includes(platform.id)}
              onToggle={(on) => togglePlatform(platform.id, on)}
              channels={draft.channels}
              onChannelChange={setChannels}
              secretInputs={channelSecrets}
              onSecretChange={(field, value) =>
                setChannelSecrets((current) => ({ ...current, [field]: value }))
              }
              storedSecrets={settings.secrets}
              clearedSecrets={clearedSecrets}
              onClearSecret={(field) => setClearedSecrets((c) => ({ ...c, [field]: true }))}
              telegramTest={telegramTest}
              onTelegramTest={() => runTest("telegram")}
            />
          ))}
        </div>
      </Panel>

      {/* ---------------- appearance ---------------- */}
      <Panel>
        <SectionHead
          title={t("settings.section.appearance")}
          hint={t("settings.section.appearance.hint")}
          icon={<Palette size={17} />}
        />
        <div className="flex flex-wrap gap-6 p-6">
          <Segmented<ThemePreference>
            label={t("action.theme")}
            value={preference}
            onChange={setPreference}
            options={[
              { value: "light", label: t("action.theme.light") },
              { value: "dark", label: t("action.theme.dark") },
              { value: "system", label: t("action.theme.system") },
            ]}
          />
          <Segmented<UiLocale>
            label={t("settings.uiLanguage.label")}
            value={locale}
            onChange={setLocale}
            options={[
              { value: "en", label: "English" },
              { value: "bn", label: "বাংলা" },
            ]}
          />
          <Segmented<Density>
            label={t("settings.density.label")}
            value={draft.ui.density}
            onChange={(density) => {
              setUi({ density });
              patchLocal({ ui: { ...settings.ui, density } });
            }}
            options={[
              { value: "comfortable", label: t("settings.density.comfortable") },
              { value: "compact", label: t("settings.density.compact") },
            ]}
          />
          <div className="flex min-w-[16rem] flex-1 flex-col gap-3">
            <Toggle
              label={t("settings.reduceMotion.label")}
              checked={draft.ui.reduceMotion}
              onChange={(reduceMotion) => {
                setUi({ reduceMotion });
                patchLocal({ ui: { ...settings.ui, reduceMotion } });
              }}
            />
            <Toggle
              label={t("settings.sound.label")}
              checked={draft.ui.sound}
              onChange={(sound) => setUi({ sound })}
            />
          </div>
        </div>
      </Panel>

      {/* ---------------- save bar ---------------- */}
      <AnimatePresence>
        {dirty || justSaved ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-6 z-40 mx-auto w-max max-w-[calc(100vw-2rem)] px-2"
          >
            <div className="glass-island flex items-center gap-4 rounded-full border border-line px-5 py-2.5 shadow-island">
              <span className="text-xs text-fog">
                {justSaved ? t("action.saved") : t("settings.title")}
              </span>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || !dirty}
                leadingIcon={
                  justSaved ? <CheckCircle size={13} weight="fill" /> : <FloppyDisk size={13} />
                }
              >
                {saving ? t("action.saving") : t("action.save")}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/** One card per platform: switch, webhook URL, credentials, setup steps. */
function PlatformCard({
  platform,
  origin,
  enabled,
  onToggle,
  channels,
  onChannelChange,
  secretInputs,
  onSecretChange,
  storedSecrets,
  clearedSecrets,
  onClearSecret,
  telegramTest,
  onTelegramTest,
}: {
  platform: PlatformMeta;
  origin: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  channels: ChannelSettings;
  onChannelChange: (patch: Partial<ChannelSettings>) => void;
  secretInputs: Partial<Record<ChannelSecretField, string>>;
  onSecretChange: (field: ChannelSecretField, value: string) => void;
  storedSecrets: Record<string, string>;
  clearedSecrets: Record<string, boolean>;
  onClearSecret: (field: ChannelSecretField) => void;
  telegramTest: TestState;
  onTelegramTest: () => void;
}) {
  const { t, locale } = useLocale();
  const url = `${origin || ""}${platform.path}`;

  return (
    <div
      className={cx(
        "flex flex-col gap-4 rounded-card border p-5",
        enabled ? "border-signal/35 bg-signal/[0.06]" : "border-line bg-panelCard"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-paper">{platform.label}</span>
            <Chip tone={enabled ? "mint" : "neutral"}>
              {enabled ? t("settings.platform.enabled") : t("settings.platform.disabled")}
            </Chip>
          </div>
          <p className="mt-1.5 text-[0.72rem] leading-relaxed text-fog">{platform.note[locale]}</p>
        </div>
      </div>

      <Toggle label={t("settings.platform.enable")} checked={enabled} onChange={onToggle} />

      <div className="flex flex-col gap-1.5">
        <span className="text-[0.7rem] font-medium text-fog">{t("settings.platform.url")}</span>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="w-full rounded-soft border border-line bg-panel px-3 py-2 font-mono text-[0.7rem] text-paper focus:outline-none"
          />
          <CopyButton value={url} copyLabel={t("action.copy")} doneLabel={t("action.copied")} />
        </div>
        <p className="text-[0.68rem] text-fog/80">
          {platform.canSend ? t("settings.platform.canSend") : t("settings.platform.receiveOnly")}
        </p>
      </div>

      {platform.fields.map((field) => {
        const key = field.key as ChannelSecretField;
        if (field.secret) {
          return (
            <SecretInput
              key={String(field.key)}
              label={field.label}
              placeholder={field.placeholder}
              value={secretInputs[key] || ""}
              onChange={(value) => onSecretChange(key, value)}
              storedPreview={clearedSecrets[key] ? "" : storedSecrets[key] || ""}
              storedLabel={t("settings.apiKey.stored")}
              emptyLabel={t("field.none")}
              clearLabel={t("action.clear")}
              onClear={() => onClearSecret(key)}
            />
          );
        }
        return (
          <TextInput
            key={String(field.key)}
            label={field.label}
            placeholder={field.placeholder}
            value={String(channels[field.key] ?? "")}
            onChange={(e) => onChannelChange({ [field.key]: e.target.value } as Partial<ChannelSettings>)}
          />
        );
      })}

      {platform.id === "telegram" ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onTelegramTest}
            disabled={telegramTest.status === "running"}
            leadingIcon={<Broadcast size={13} />}
          >
            {telegramTest.status === "running" ? t("action.testing") : t("settings.telegram.send")}
          </Button>
          <TestResult state={telegramTest} />
        </div>
      ) : null}

      <details className="rounded-soft border border-line bg-panel p-3">
        <summary className="cursor-pointer text-[0.72rem] font-medium text-paper">
          {t("settings.platform.steps")}
        </summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-4 text-[0.7rem] leading-relaxed text-fog">
          {platform.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {platform.docsUrl ? (
          <a
            href={platform.docsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] text-signal underline-offset-4 hover:underline"
          >
            {t("settings.platform.docs")}
            <ArrowSquareOut size={11} />
          </a>
        ) : null}
      </details>
    </div>
  );
}

function TestResult({ state }: { state: TestState }) {
  if (state.status === "idle" || state.status === "running") return null;
  return (
    <span className={cx("text-[0.72rem]", state.status === "ok" ? "text-mint" : "text-coral")}>
      {state.message || (state.status === "ok" ? "OK" : "Failed")}
    </span>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cx("rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient", className)}
    >
      <div className="rounded-core border border-line/60 bg-panel shadow-inset">{children}</div>
    </section>
  );
}
