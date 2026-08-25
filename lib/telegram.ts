// Free human-handoff alert via the Telegram Bot API.
// Create a bot with @BotFather (free) to get TELEGRAM_BOT_TOKEN,
// and message the bot once, then use https://api.telegram.org/bot<token>/getUpdates
// to find your TELEGRAM_CHAT_ID.
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
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[Telegram] Handoff alert skipped (keys not configured):", params.messageText);
    return;
  }

  const leadLine = params.leadName || params.leadPhone
    ? `\n👤 Customer: ${params.leadName || "Unnamed"} (${params.leadPhone || "No phone"})`
    : "";

  const reasonLine = params.escalationReason
    ? `\n⚠️ Reason: ${params.escalationReason}`
    : "";

  const text =
    `🚨 *HUMAN HANDOFF ALERT*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎭 *Sentiment:* ${params.sentiment.toUpperCase()}\n` +
    `🎯 *Intent:* ${params.intent}\n` +
    `🌐 *Language:* ${params.detectedLanguage}\n` +
    `🆔 *User PSID:* \`${params.senderId}\`${leadLine}${reasonLine}\n\n` +
    `💬 *Message:*\n"${params.messageText}"`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram alert failed:", err);
    }
  } catch (err) {
    console.error("Telegram alert request exception:", err);
  }
}
