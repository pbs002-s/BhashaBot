const { login } = require("ws3-fca");
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

// Search for appstate.json or .fb-appstate.json
const APPSTATE_PATHS = [
  path.join(process.cwd(), "appstate.json"),
  path.join(process.cwd(), ".fb-appstate.json"),
];

function getAppStatePath() {
  for (const p of APPSTATE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function startMessengerBot() {
  console.log("=== BhashaBot Facebook Messenger UserBot ===");
  console.log(`BhashaBot webhook target: ${BHASHABOT_URL}`);

  const appStateFile = getAppStatePath();
  if (!appStateFile) {
    console.log("[FB_NO_APPSTATE]");
    console.log("\n[Setup Required]: No 'appstate.json' file found in project root.");
    console.log("To connect your personal Facebook Messenger account:");
    console.log("1. In Chrome/Brave, log into your Facebook account (facebook.com).");
    console.log("2. Use a cookie exporter extension (e.g. 'cstate' or 'EditThisCookie') to export your cookies as JSON.");
    console.log("3. Save the exported JSON file as 'appstate.json' in this project's folder:");
    console.log(`   ${path.join(process.cwd(), "appstate.json")}`);
    console.log("4. Then start this script again.\n");
    process.exit(1);
  }

  console.log(`Using AppState: ${appStateFile}\n`);

  let appState;
  try {
    const raw = fs.readFileSync(appStateFile, "utf8");
    appState = JSON.parse(raw);
    if (!Array.isArray(appState)) {
      throw new Error("appstate.json must contain a JSON array of cookie objects.");
    }
  } catch (err) {
    console.error("[FB_ERROR]: Failed to read or parse appstate.json:", err.message);
    process.exit(1);
  }

  login({ appState }, (err, api) => {
    if (err) {
      console.error("[FB_ERROR]: Facebook login failed:", err.error || err.message || err);
      console.log("Please re-export a fresh appstate.json from your logged-in browser session.");
      process.exit(1);
    }

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      autoMarkDelivery: true,
      autoMarkRead: true,
    });

    const currentUserId = api.getCurrentUserID();
    console.log(`[FB_CONNECTED]:User ${currentUserId}`);

    api.getUserInfo(currentUserId, (userErr, info) => {
      const name = !userErr && info && info[currentUserId] ? info[currentUserId].name : null;
      if (name) {
        console.log(`[FB_CONNECTED]:${name}`);
        console.log(`\n[Connected] Facebook Messenger active for: ${name} (ID: ${currentUserId})`);
      } else {
        console.log(`\n[Connected] Facebook Messenger active for account ID: ${currentUserId}`);
      }
      console.log("Listening for incoming private Messenger chats...\n");
    });

    // Listen to incoming messages via MQTT
    api.listenMqtt(async (listenErr, event) => {
      if (listenErr) {
        console.error("[FB_LISTEN_ERROR]:", listenErr);
        return;
      }

      // Only handle regular incoming messages
      if (event.type !== "message") return;

      // Skip messages sent from ourselves
      if (event.senderID === currentUserId) return;

      // Skip group chats to keep 1-on-1 personal replies clean
      if (event.isGroup) return;

      const text = (event.body || "").trim();
      if (!text) return; // Skip stickers, files without text

      const senderId = String(event.senderID);

      // Attempt to retrieve sender's name
      let senderName = senderId;
      try {
        const userInfo = await new Promise((resolve) => {
          api.getUserInfo(senderId, (e, res) => resolve(!e && res ? res[senderId] : null));
        });
        if (userInfo && userInfo.name) {
          senderName = userInfo.name;
        }
      } catch {}

      console.log(`\n[Incoming Messenger from ${senderName} (${senderId})]: ${text}`);

      try {
        // Forward message to BhashaBot generic channel endpoint
        const res = await fetch(BHASHABOT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            senderId,
            senderName,
            platform: "messenger",
          }),
        });

        const data = await res.json();

        if (data.ok && data.results && data.results.length > 0) {
          const replyText = data.results[0].reply;
          if (replyText) {
            console.log(`[Replying to ${senderName}]: ${replyText}`);
            api.sendMessage(replyText, event.threadID);
          }
        } else {
          console.log("[Notice]: BhashaBot did not return a reply for this message.");
        }
      } catch (postErr) {
        console.error("[Error]: Could not reach BhashaBot. Is the Next.js server running?", postErr.message);
      }
    });
  });
}

startMessengerBot().catch((err) => {
  console.error("Fatal error starting Facebook Messenger UserBot:", err);
});
