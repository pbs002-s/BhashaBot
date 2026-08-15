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
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // silently skip if not configured

  const text =
    `🚨 Human handoff needed\n` +
    `Sentiment: ${params.sentiment}\n` +
    `Intent: ${params.intent}\n` +
    `User PSID: ${params.senderId}\n` +
    `Page: ${params.pageId}\n` +
    `Message: ${params.messageText}\n` +
    `Detected language: ${params.detectedLanguage}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((err) => console.error("Telegram alert failed:", err));
}
