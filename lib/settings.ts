import { db, initDb } from "./db";
import {
  AppSettings,
  CLEAR_SECRET,
  DEFAULT_SETTINGS,
  SECRET_FIELDS,
  SafeSettings,
  isPlatformId,
  maskSecret,
  mergeSettings,
} from "./settings-schema";

/**
 * Server-side settings store. One JSON row in libSQL, with environment
 * variables as the fallback for anyone who would rather keep secrets in
 * `.env.local` than in the database.
 */

const ROW_KEY = "app";
let cache: AppSettings | null = null;

async function ensureTable() {
  await initDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}

function fromEnv(): Partial<AppSettings> {
  const envKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || "";
  const providerId = process.env.GROQ_API_KEY
    ? ("groq" as const)
    : process.env.OPENAI_API_KEY
    ? ("openai" as const)
    : ("offline" as const);

  return {
    provider: {
      ...DEFAULT_SETTINGS.provider,
      id: providerId,
      apiKey: envKey,
      model:
        process.env.GROQ_MODEL ||
        (providerId === "openai" ? "gpt-4o-mini" : DEFAULT_SETTINGS.provider.model),
    },
    channels: {
      ...DEFAULT_SETTINGS.channels,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
      telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
      fbPageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || "",
      fbVerifyToken: process.env.FB_VERIFY_TOKEN || DEFAULT_SETTINGS.channels.fbVerifyToken,
      fbAppSecret: process.env.FB_APP_SECRET || "",
      igAccessToken: process.env.IG_ACCESS_TOKEN || "",
      waAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
      waPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      discordBotToken: process.env.DISCORD_BOT_TOKEN || "",
      discordPublicKey: process.env.DISCORD_PUBLIC_KEY || "",
      slackBotToken: process.env.SLACK_BOT_TOKEN || "",
      slackSigningSecret: process.env.SLACK_SIGNING_SECRET || "",
      webhookSecret: process.env.WEBHOOK_SECRET || "",
    },
  };
}

/** Full settings including secrets. Server use only — never send to a client. */
export async function getSettings(): Promise<AppSettings> {
  if (cache) return cache;

  const envBase = mergeSettings(DEFAULT_SETTINGS, fromEnv());

  try {
    await ensureTable();
    const res = await db.execute({
      sql: `SELECT value FROM app_settings WHERE key = ?`,
      args: [ROW_KEY],
    });
    if (res.rows.length > 0) {
      const stored = JSON.parse(String(res.rows[0].value)) as Partial<AppSettings>;
      cache = mergeSettings(envBase, stored);
      // A stored blank secret must not blank out a working environment value.
      cache.provider.apiKey = cache.provider.apiKey || envBase.provider.apiKey;
      cache.channels.telegramBotToken =
        cache.channels.telegramBotToken || envBase.channels.telegramBotToken;
      cache.channels.telegramChatId =
        cache.channels.telegramChatId || envBase.channels.telegramChatId;
      cache.channels.fbPageAccessToken =
        cache.channels.fbPageAccessToken || envBase.channels.fbPageAccessToken;
      for (const field of SECRET_FIELDS.channels) {
        cache.channels[field] = cache.channels[field] || envBase.channels[field];
      }
      return cache;
    }
  } catch (err) {
    console.error("Settings read failed, falling back to environment:", err);
  }

  cache = envBase;
  return cache;
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = mergeSettings(current, patch);

  // Secrets: "" means leave the stored value alone, CLEAR_SECRET wipes it.
  for (const field of SECRET_FIELDS.provider) {
    const incoming = patch.provider?.[field];
    if (incoming === undefined || incoming === "") {
      next.provider[field] = current.provider[field];
    } else if (incoming === CLEAR_SECRET) {
      next.provider[field] = "";
    }
  }
  for (const field of SECRET_FIELDS.channels) {
    const incoming = patch.channels?.[field];
    if (incoming === undefined || incoming === "") {
      next.channels[field] = current.channels[field];
    } else if (incoming === CLEAR_SECRET) {
      next.channels[field] = "";
    }
  }

  next.provider.temperature = clamp(Number(next.provider.temperature) || 0, 0, 2);
  next.provider.maxTokens = Math.round(clamp(Number(next.provider.maxTokens) || 900, 64, 8000));
  next.channels.enabledPlatforms = Array.from(
    new Set((next.channels.enabledPlatforms || []).filter(isPlatformId))
  );
  next.persona.escalationKeywords = (next.persona.escalationKeywords || [])
    .map((k) => String(k).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 24);

  await ensureTable();
  await db.execute({
    sql: `INSERT INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
    args: [ROW_KEY, JSON.stringify(next), new Date().toISOString()],
  });

  cache = next;
  return next;
}

/** Safe to hand to the browser: secret values become masked previews. */
export function redactSettings(settings: AppSettings): SafeSettings {
  const channels = { ...settings.channels };
  const secrets = { providerApiKey: maskSecret(settings.provider.apiKey) } as SafeSettings["secrets"];

  for (const field of SECRET_FIELDS.channels) {
    secrets[field] = maskSecret(settings.channels[field]);
    channels[field] = "";
  }

  return {
    ...settings,
    provider: { ...settings.provider, apiKey: "" },
    channels,
    secrets,
  };
}

export function invalidateSettingsCache() {
  cache = null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
