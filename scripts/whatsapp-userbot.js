const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const path = require("path");
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
const AUTH_DIR = path.join(process.cwd(), ".whatsapp-session");

let activeSocket = null;
let isReconnecting = false;

async function startWhatsAppBot() {
  if (isReconnecting) return;
  isReconnecting = true;

  console.log("=== BhashaBot WhatsApp UserBot ===");
  console.log(`BhashaBot webhook target: ${BHASHABOT_URL}`);
  console.log(`Session directory: ${AUTH_DIR}\n`);

  if (activeSocket) {
    try {
      activeSocket.ev.removeAllListeners();
      activeSocket.end();
    } catch {}
    activeSocket = null;
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.windows("Desktop"),
    syncFullHistory: false,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });

  activeSocket = sock;
  isReconnecting = false;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`[WA_QR_DATA]:${qr}`);
      console.log("\n[Scan QR Code] Open WhatsApp on your phone -> Linked Devices -> Link a Device:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced; // 440

      console.log(`Connection closed (code ${statusCode || "unknown"}).`);

      if (isReplaced) {
        console.log(
          "\n[Connection Conflict (code 440)]: Another WhatsApp Web session or terminal instance connected with this session."
        );
        console.log("To prevent reconnect loops, this instance has stopped. Ensure only ONE bot/web instance is running.\n");
        process.exit(0);
      } else if (isLoggedOut) {
        console.log(
          "\n[Session Expired (code 401)]: Logged out from WhatsApp. Remove .whatsapp-session folder to scan a fresh QR code.\n"
        );
        process.exit(0);
      } else {
        console.log("Reconnecting in 5 seconds...");
        setTimeout(() => {
          startWhatsAppBot().catch((err) => console.error("Reconnect error:", err));
        }, 5000);
      }
    } else if (connection === "open") {
      const userJid = sock.user?.id || "";
      const phone = userJid.split(":")[0] || userJid.split("@")[0];
      console.log(`[WA_CONNECTED]:${phone}`);
      console.log(`\n[Connected] WhatsApp bot active for phone: +${phone}`);
      console.log("Listening for incoming private messages...\n");
    }
  });

  // Listen for incoming messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      // Don't reply to our own messages
      if (msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid || "";

      // Only reply to private 1-on-1 chats (skip groups, status broadcast, newsletter channels)
      if (remoteJid.endsWith("@g.us") || remoteJid.includes("@broadcast") || remoteJid.endsWith("@newsletter")) {
        continue;
      }

      // Extract text from standard message, extended text, or media captions
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

      const cleanText = text.trim();
      if (!cleanText) continue;

      const senderId = remoteJid.split("@")[0];
      const senderName = msg.pushName || senderId;

      console.log(`\n[Incoming WhatsApp from ${senderName} (+${senderId})]: ${cleanText}`);

      try {
        // Forward to BhashaBot Generic Webhook
        const res = await fetch(BHASHABOT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            senderId: senderId,
            senderName: senderName,
            platform: "whatsapp",
          }),
        });

        const data = await res.json();

        if (data.ok && data.results && data.results.length > 0) {
          const replyText = data.results[0].reply;
          if (replyText) {
            console.log(`[Replying to ${senderName}]: ${replyText}`);
            // Send reply back to WhatsApp chat
            await sock.sendMessage(remoteJid, { text: replyText });
          }
        } else {
          console.log("[Notice]: BhashaBot did not generate a reply for this message.");
        }
      } catch (err) {
        console.error("[Error]: Could not reach BhashaBot. Is the Next.js server running?", err.message);
      }
    }
  });
}

startWhatsAppBot().catch((err) => {
  console.error("Fatal error starting WhatsApp UserBot:", err);
});
