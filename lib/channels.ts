import crypto from "crypto";
import { getSettings } from "./settings";
import type { PlatformId } from "./settings-schema";

/**
 * One inbound shape for every platform, and one outbound function.
 * Everything here uses a free tier: Meta Graph (Messenger, Instagram,
 * WhatsApp Cloud), the Telegram Bot API, Discord interactions, Slack events,
 * or a plain JSON POST for anything else.
 */

export interface InboundMessage {
  platform: PlatformId;
  /** The person writing. */
  senderId: string;
  /** Name of the sender if available. */
  senderName?: string;
  /** The account that received it: Page id, phone number id, workspace id. */
  accountId: string;
  /** Where a reply has to be delivered: chat id, channel id, phone number. */
  threadId: string;
  text: string;
}

const GRAPH = "https://graph.facebook.com/v20.0";

/* =========================================================================
   Outbound
   ========================================================================= */

export async function sendPlatformReply(message: InboundMessage, text: string): Promise<boolean> {
  const { channels } = await getSettings();

  try {
    switch (message.platform) {
      case "messenger": {
        if (!channels.fbPageAccessToken) return false;
        return await postJson(
          `${GRAPH}/me/messages?access_token=${encodeURIComponent(channels.fbPageAccessToken)}`,
          { recipient: { id: message.senderId }, message: { text } }
        );
      }

      case "instagram": {
        // Instagram messaging rides the same Graph endpoint; a dedicated token
        // is optional, the Page token covers a linked professional account.
        const token = channels.igAccessToken || channels.fbPageAccessToken;
        if (!token) return false;
        return await postJson(`${GRAPH}/me/messages?access_token=${encodeURIComponent(token)}`, {
          recipient: { id: message.senderId },
          message: { text },
        });
      }

      case "whatsapp": {
        const phoneNumberId = message.accountId || channels.waPhoneNumberId;
        if (!channels.waAccessToken || !phoneNumberId) return false;
        return await postJson(
          `${GRAPH}/${phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: message.threadId || message.senderId,
            type: "text",
            text: { preview_url: false, body: text },
          },
          { Authorization: `Bearer ${channels.waAccessToken}` }
        );
      }

      case "telegram": {
        if (!channels.telegramBotToken) return false;
        return await postJson(`https://api.telegram.org/bot${channels.telegramBotToken}/sendMessage`, {
          chat_id: message.threadId || message.senderId,
          text,
        });
      }

      case "discord": {
        if (!channels.discordBotToken || !message.threadId) return false;
        return await postJson(
          `https://discord.com/api/v10/channels/${message.threadId}/messages`,
          { content: text },
          { Authorization: `Bot ${channels.discordBotToken}` }
        );
      }

      case "slack": {
        if (!channels.slackBotToken || !message.threadId) return false;
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${channels.slackBotToken}`,
          },
          body: JSON.stringify({ channel: message.threadId, text }),
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (!data.ok) console.error("Slack send failed:", data.error);
        return Boolean(data.ok);
      }

      // The generic webhook answers in its own HTTP response instead.
      case "web":
      default:
        return false;
    }
  } catch (err) {
    console.error(`${message.platform} send failed:`, err);
    return false;
  }
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("Channel send rejected:", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

/* =========================================================================
   Inbound parsing — every platform reduced to InboundMessage[]
   ========================================================================= */

export function parseInbound(platform: PlatformId, body: any): InboundMessage[] {
  switch (platform) {
    case "messenger":
    case "instagram":
      return parseMetaMessaging(platform, body);
    case "whatsapp":
      return parseWhatsApp(body);
    case "telegram":
      return parseTelegram(body);
    case "discord":
      return parseDiscord(body);
    case "slack":
      return parseSlack(body);
    case "web":
      return parseGeneric(body);
    default:
      return [];
  }
}

function parseMetaMessaging(platform: PlatformId, body: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of body?.entry || []) {
    for (const event of entry?.messaging || []) {
      const text = String(event?.message?.text || "").trim();
      // Echoes are our own replies coming back; delivery and read receipts
      // carry no text at all.
      if (!text || event?.message?.is_echo) continue;
      const senderId = String(event?.sender?.id || "unknown");
      out.push({
        platform,
        senderId,
        accountId: String(entry?.id || "unknown"),
        threadId: senderId,
        text,
      });
    }
  }
  return out;
}

function parseWhatsApp(body: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      const value = change?.value || {};
      const phoneNumberId = String(value?.metadata?.phone_number_id || "");
      for (const msg of value?.messages || []) {
        const text = String(msg?.text?.body || msg?.button?.text || "").trim();
        if (!text) continue;
        const from = String(msg?.from || "unknown");
        out.push({
          platform: "whatsapp",
          senderId: from,
          accountId: phoneNumberId,
          threadId: from,
          text,
        });
      }
    }
  }
  return out;
}

function parseTelegram(body: any): InboundMessage[] {
  const msg = body?.message || body?.edited_message || body?.channel_post;
  const text = String(msg?.text || "").trim();
  if (!text || msg?.from?.is_bot) return [];
  const senderName = [msg?.from?.first_name, msg?.from?.last_name].filter(Boolean).join(" ") || msg?.from?.username || "";
  return [
    {
      platform: "telegram",
      senderId: String(msg?.from?.id || msg?.chat?.id || "unknown"),
      senderName: senderName || undefined,
      accountId: String(msg?.chat?.id || "unknown"),
      threadId: String(msg?.chat?.id || ""),
      text,
    },
  ];
}

/**
 * Discord interactions: type 1 is the ping (handled by the route), type 2 is a
 * slash command, type 3 a component. A `text` or `message` option carries the
 * thing to answer.
 */
function parseDiscord(body: any): InboundMessage[] {
  if (body?.type !== 2) return [];
  const options = body?.data?.options || [];
  const option = options.find((o: any) => ["text", "message", "ask"].includes(o?.name)) || options[0];
  const text = String(option?.value || "").trim();
  if (!text) return [];
  const user = body?.member?.user || body?.user || {};
  return [
    {
      platform: "discord",
      senderId: String(user?.id || "unknown"),
      senderName: user?.global_name || user?.username || undefined,
      accountId: String(body?.guild_id || "dm"),
      threadId: String(body?.channel_id || ""),
      text,
    },
  ];
}

function parseSlack(body: any): InboundMessage[] {
  const event = body?.event || {};
  const text = String(event?.text || "").trim();
  // bot_id is set on anything the app itself posted, including our own replies.
  if (!text || event?.bot_id || event?.subtype) return [];
  if (event?.type !== "message" && event?.type !== "app_mention") return [];
  return [
    {
      platform: "slack",
      senderId: String(event?.user || "unknown"),
      senderName: event?.user || undefined,
      accountId: String(body?.team_id || "unknown"),
      threadId: String(event?.channel || ""),
      text,
    },
  ];
}

function parseGeneric(body: any): InboundMessage[] {
  const text = String(body?.text || body?.message || "").trim();
  if (!text) return [];
  const senderId = String(body?.senderId || body?.from || "web-visitor");
  const senderName = String(body?.senderName || body?.name || body?.fromName || "").trim();
  return [
    {
      platform: "web",
      senderId,
      senderName: senderName || undefined,
      accountId: String(body?.accountId || body?.source || "web"),
      threadId: String(body?.threadId || senderId),
      text,
    },
  ];
}

/* =========================================================================
   Signature verification
   ========================================================================= */

/** Meta signs the raw body with the app secret (Messenger, Instagram, WhatsApp). */
export function verifyMetaSignature(raw: string, header: string | null, appSecret: string): boolean {
  if (!appSecret) return true; // Nothing configured: the operator opted out.
  if (!header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
  return timingSafeEqual(expected, header);
}

/** Slack signs `v0:<timestamp>:<body>` and rejects anything older than five minutes. */
export function verifySlackSignature(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string
): boolean {
  if (!signingSecret) return true;
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected =
    "v0=" + crypto.createHmac("sha256", signingSecret).update(`v0:${timestamp}:${raw}`).digest("hex");
  return timingSafeEqual(expected, signature);
}

/**
 * Discord signs `<timestamp><body>` with Ed25519. The public key arrives as raw
 * hex, so it is wrapped in the fixed SPKI prefix Node needs to import it.
 */
export function verifyDiscordSignature(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  publicKeyHex: string
): boolean {
  if (!publicKeyHex) return true;
  if (!timestamp || !signature) return false;
  try {
    const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const key = crypto.createPublicKey({
      key: Buffer.concat([spkiPrefix, Buffer.from(publicKeyHex, "hex")]),
      format: "der",
      type: "spki",
    });
    return crypto.verify(
      null,
      Buffer.from(timestamp + raw),
      key,
      Buffer.from(signature, "hex")
    );
  } catch (err) {
    console.error("Discord signature check failed:", err);
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/* =========================================================================
   Enablement
   ========================================================================= */

export async function isPlatformEnabled(platform: PlatformId): Promise<boolean> {
  const { channels } = await getSettings();
  return (channels.enabledPlatforms || []).includes(platform);
}
