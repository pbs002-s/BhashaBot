const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");

// Load .env.local if available
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] || "").trim();
    }
  }
}

// BhashaBot Webhook URL (must be running locally or use your public URL)
const BHASHABOT_URL = process.env.BHASHABOT_URL || "http://localhost:3000/api/channels/web";

async function main() {
  console.log("=== BhashaBot Telegram UserBot ===");
  
  // Get API credentials from env or ask
  const apiIdStr = process.env.TELEGRAM_API_ID || await input.text("Enter your API ID (from my.telegram.org): ");
  const apiHash = process.env.TELEGRAM_API_HASH || await input.text("Enter your API Hash (from my.telegram.org): ");
  const apiId = parseInt(apiIdStr);

  // Check for saved session
  let sessionString = "";
  if (fs.existsSync(".userbot-session")) {
    sessionString = fs.readFileSync(".userbot-session", "utf-8");
  }

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Enter your phone number (e.g. +1234567890): "),
    password: async () => await input.text("Enter your 2FA password (if you have one): "),
    phoneCode: async () => await input.text("Enter the login code you received on Telegram: "),
    onError: (err) => console.log(err),
  });

  console.log("You should now be connected.");
  fs.writeFileSync(".userbot-session", client.session.save());
  console.log("Session saved. You won't need to log in again.\n");

  const me = await client.getMe();
  console.log(`[TG_CONNECTED]:${me.firstName}`);
  console.log(`Listening for messages as ${me.firstName}...`);

  // Listen to new incoming messages
  client.addEventHandler(async (event) => {
    const message = event.message;

    // We only want to reply to PRIVATE chats (friends), not groups or channels
    if (!message.isPrivate) return;

    // Don't reply to our own outgoing messages
    if (message.out) return;

    const sender = await message.getSender();
    const senderFullName = [sender.firstName, sender.lastName].filter(Boolean).join(" ");
    const senderName = senderFullName || sender.username || sender.id.toString();
    const text = message.text;

    if (!text) return; // Skip stickers, images without captions, etc.

    console.log(`\n[Incoming from ${senderName}]: ${text}`);

    try {
      // Send the message to BhashaBot's Generic Webhook
      const response = await fetch(BHASHABOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          senderId: sender.id.toString(),
          senderName: senderName,
        }),
      });

      const data = await response.json();
      
      if (data.ok && data.results && data.results.length > 0) {
        const replyText = data.results[0].reply;
        if (replyText) {
          console.log(`[Replying]: ${replyText}`);
          // Send the reply back to the friend
          await client.sendMessage(message.chatId, { message: replyText });
        }
      } else {
        console.log("[Error]: BhashaBot did not return a valid reply.");
      }
    } catch (err) {
      console.error("[Error]: Could not reach BhashaBot. Is the server running?", err.message);
    }

  }, new NewMessage({}));
}

main();
