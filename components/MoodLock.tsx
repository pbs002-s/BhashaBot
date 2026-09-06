"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen } from "@phosphor-icons/react/dist/ssr";
import { useLocale } from "./providers/AppProviders";
import { Button, TextInput } from "./ui/primitives";

/**
 * Client side of the password gate on the owner's private persona mood.
 *
 * The password itself never reaches the browser: it is posted to
 * /api/moods/unlock, which answers with an httpOnly signed cookie. Everything
 * here only ever knows the boolean.
 */

export interface MoodLockState {
  unlocked: boolean;
  loading: boolean;
  usingDefaultPassword: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
}

export function useMoodLock(): MoodLockState {
  const [unlocked, setUnlocked] = useState(false);
  const [usingDefaultPassword, setUsingDefault] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetch("/api/moods/unlock")
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        setUnlocked(Boolean(d.unlocked));
        setUsingDefault(Boolean(d.usingDefaultPassword));
      })
      .catch(() => undefined)
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await fetch("/api/moods/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const ok = res.ok;
    if (ok) setUnlocked(true);
    return ok;
  }, []);

  const lock = useCallback(async () => {
    await fetch("/api/moods/unlock", { method: "DELETE" }).catch(() => undefined);
    setUnlocked(false);
  }, []);

  return { unlocked, loading, usingDefaultPassword, unlock, lock };
}

/** The panel shown in place of a locked mood's contents. */
export function MoodLockCard({
  accent,
  onUnlocked,
  compact,
}: {
  accent: string;
  onUnlocked?: () => void;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const { unlock, usingDefaultPassword } = useMoodLock();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit() {
    if (!password || busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await unlock(password);
    setBusy(false);
    setPassword("");
    if (ok) onUnlocked?.();
    else setFailed(true);
  }

  return (
    <div
      className="rounded-shell border p-6"
      style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0f` }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-paper">
        <Lock size={15} weight="fill" style={{ color: accent }} />
        {t("moods.locked")}
      </p>
      <p className="mt-2 max-w-md text-[0.78rem] leading-relaxed text-fog">
        {t("moods.lockedBody")}
      </p>

      <div className={compact ? "mt-4 flex flex-col gap-2" : "mt-4 flex max-w-sm flex-col gap-3"}>
        <TextInput
          label={t("moods.password")}
          type="password"
          autoComplete="current-password"
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={submit}
            disabled={busy || !password}
            leadingIcon={<LockOpen size={13} weight="fill" />}
          >
            {busy ? t("moods.unlocking") : t("moods.unlock")}
          </Button>
          {failed ? <span className="text-[0.72rem] text-coral">{t("moods.wrongPassword")}</span> : null}
        </div>
        {usingDefaultPassword ? (
          <p className="text-[0.68rem] leading-relaxed text-fog">{t("moods.defaultPassword")}</p>
        ) : null}
      </div>
    </div>
  );
}
