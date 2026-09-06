import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Password gate for the owner's private persona mood.
 *
 * The password lives in the environment, never in the database and never in
 * any response body. Passing it mints a short-lived signed cookie; every route
 * that can select or draft with a locked mood checks that cookie.
 *
 * Server-only — this file imports node:crypto and next/headers.
 */

export const UNLOCK_COOKIE = "bb_mood_unlock";
/** Twelve hours, so an unlocked desk re-locks itself by the next day. */
export const UNLOCK_TTL_SECONDS = 12 * 60 * 60;

/** Used when MOOD_PASSWORD is unset, so a fresh clone still runs. Change it. */
export const FALLBACK_PASSWORD = "pritam";

function password(): string {
  return process.env.MOOD_PASSWORD || FALLBACK_PASSWORD;
}

/** True when the deployment is still on the shipped default. */
export function usingFallbackPassword(): boolean {
  return !process.env.MOOD_PASSWORD;
}

function signingSecret(): string {
  // A dedicated secret is better, but deriving one from the password keeps the
  // gate working with a single environment variable set.
  return process.env.MOOD_LOCK_SECRET || `bhashabot:${password()}`;
}

function sign(expiresAt: number): string {
  return crypto.createHmac("sha256", signingSecret()).update(String(expiresAt)).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(candidate: string): boolean {
  if (!candidate) return false;
  // Hash both sides first so the compare is fixed-length whatever was typed.
  const h = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
  return safeEqual(h(candidate), h(password()));
}

export function mintToken(): { value: string; maxAge: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + UNLOCK_TTL_SECONDS;
  return { value: `${expiresAt}.${sign(expiresAt)}`, maxAge: UNLOCK_TTL_SECONDS };
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  const expiresAt = Number(expRaw);
  if (!expiresAt || !sig) return false;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, sign(expiresAt));
}

/** Whether the current request carries a valid unlock cookie. */
export function isUnlocked(): boolean {
  try {
    return verifyToken(cookies().get(UNLOCK_COOKIE)?.value);
  } catch {
    // Called outside a request scope (e.g. a background job): treat as locked.
    return false;
  }
}
