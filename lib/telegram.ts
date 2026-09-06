import { getSettings } from "./settings";

/**
 * Free human-handoff alerting over the Telegram Bot API.
 * Create a bot with @BotFather, message it once, then read the chat id from
 * https://api.telegram.org/bot<token>/getUpdates. Both values can be pasted
 * into Settings → Channels instead of the environment.
 */
export async function alertHumanHandoff(params: {
  sentiment: string;
  intent: string;
  senderId: string;
  pageId: string;
  messageText: string;
  detectedLanguage: string;
  escalationReason?: string;
  leadName?: string;
  leadPhone?: string;
}) {
  const { channels } = await getSettings();
  const token = channels.telegramBotToken;
  const chatId = channels.telegramChatId;

  if (!token || !chatId) {
    console.log("[Telegram] Alert skipped, no bot configured:", params.messageText.slice(0, 80));
    return { ok: false, reason: "not_configured" as const };
  }

  const leadLine =
    params.leadName || params.leadPhone
      ? `\nFrom: ${params.leadName || "name not given"} (${params.leadPhone || "no number"})`
      : "";
  const reasonLine = params.escalationReason ? `\nWhy: ${params.escalationReason}` : "";

  const text =
    `<b>Someone needs a person</b>\n` +
    `Mood: ${params.sentiment}\n` +
    `Intent: ${params.intent}\n` +
    `Language: ${params.detectedLanguage}\n` +
    `Sender: <code>${params.senderId}</code>${leadLine}${reasonLine}\n\n` +
    `Message:\n"${params.messageText}"`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram alert failed:", err);
      return { ok: false, reason: "rejected" as const, detail: err.slice(0, 200) };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("Telegram alert request failed:", err);
    return { ok: false, reason: "network" as const };
  }
}
