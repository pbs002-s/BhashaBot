# Setup Guide — Signal Room

This walks through **every connection**, in the order to do them, from "just
run it on my laptop" all the way to "a real Facebook Page replying live."
Each stage works on its own — you can stop after any stage and still have a
working app.

Total cost: **$0**. No credit card is required for any of these services.

---

## Stage 0 — Run it with nothing connected

The app is designed to work with zero setup, using a built-in rule-based
reply engine and a local file database. Do this first to confirm everything
runs before connecting anything real.

**Requirements:** [Node.js](https://nodejs.org) version 18 or higher installed.

```bash
cd ai-messenger-dashboard
npm install
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000**. You'll see the dashboard with 0 conversations.

Click **"Send test message"**. This fires a fake Facebook message straight
into your own webhook (`/api/messenger`) and it should appear in the feed
within a second or two, with a language tag, sentiment dot, and a reply.

If that works, the core app is healthy. Everything below is optional — each
section upgrades one piece.

**Troubleshooting:**
| Problem | Fix |
|---|---|
| `npm install` fails | Confirm `node -v` is 18+ |
| Blank page / port in use | Another app is on port 3000 — run `npm run dev -- -p 3001` |
| Nothing appears after clicking the button | Open browser dev tools → Network tab, check the `/api/seed` and `/api/logs` calls for errors |

---

## Stage 1 — Connect a real AI (Groq, free)

Right now replies come from a simple keyword fallback. Connect Groq to get
real multilingual AI replies (open-source Llama 3 models, generous free
tier, no card needed).

1. Go to **https://console.groq.com** and sign up (email or Google login).
2. Go to **API Keys** (left sidebar) → **Create API Key**.
3. Copy the key — it starts with `gsk_...`.
4. Open `.env.local` in the project and set:
   ```
   GROQ_API_KEY=gsk_your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
5. Restart the dev server (`Ctrl+C`, then `npm run dev`).
6. Click **"Send test message"** again — the reply text should now sound
   noticeably more natural and context-aware than before.

**How to tell it's working:** check your terminal — if the key is wrong or
missing, you'll see `AI generation failed, falling back:` in the logs and
replies stay generic. No error in the terminal + more natural replies =
connected correctly.

**Which model to pick:** `llama-3.3-70b-versatile` is the most capable and
still free; `llama-3.1-8b-instant` is faster/cheaper on Groq's limits if you
expect high volume. Both are open-source Llama models.

---

## Stage 2 — Connect human-handoff alerts (Telegram, free)

When the AI decides a conversation needs a human (angry customer, refund,
payment failure, etc.), it can ping you on Telegram instead of replying.

1. Open Telegram, search for **@BotFather**, start a chat.
2. Send `/newbot`, give it a name and a username (must end in `bot`, e.g.
   `signalroom_alerts_bot`).
3. BotFather replies with a token like `123456789:ABCdefGhIJKlmNoPQRstuVwxYZ`.
   This is your `TELEGRAM_BOT_TOKEN`.
4. **Important:** open a chat with your new bot and send it any message
   (e.g. "hi") — Telegram bots can't message you until you've messaged them
   first.
5. In your browser, visit:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   Replace `<YOUR_TOKEN>` with the token from step 3. In the JSON response,
   find `"chat":{"id":123456789,...}` — that number is your
   `TELEGRAM_CHAT_ID`.
6. Set both in `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRstuVwxYZ
   TELEGRAM_CHAT_ID=123456789
   ```
7. Restart the dev server. Click **"Send test message"** a few times — the
   sample pool includes an angry "refund NOW" message. When it comes up,
   check Telegram — you should get a 🚨 alert message within a second.

**Troubleshooting:** if nothing arrives, re-check step 4 (you must message
the bot first) and confirm the chat ID has no extra characters.

---

## Stage 3 — Persistent database for production (Turso, free)

Skip this stage if you're only running locally — the local SQLite file
(`local.db`) is enough. This stage matters only once you deploy, because
hosts like Vercel wipe the local filesystem between requests.

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
2. Sign up (free, no card):
   ```bash
   turso auth signup
   ```
3. Create a database:
   ```bash
   turso db create signal-room
   ```
4. Get the connection URL:
   ```bash
   turso db show signal-room --url
   ```
   → this is your `TURSO_DATABASE_URL` (looks like
   `libsql://signal-room-yourname.turso.io`).
5. Create an auth token:
   ```bash
   turso db tokens create signal-room
   ```
   → this is your `TURSO_AUTH_TOKEN`.
6. Add both to `.env.local` (for local testing against the cloud DB) and,
   later, to your host's environment variables:
   ```
   TURSO_DATABASE_URL=libsql://signal-room-yourname.turso.io
   TURSO_AUTH_TOKEN=eyJhbGciOi...
   ```

The app's database code (`lib/db.ts`) doesn't change at all — the same
libSQL client talks to a local file or to Turso depending on which
variables are set.

---

## Stage 4 — Deploy it (Vercel, free)

1. Push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Signal Room dashboard"
   git branch -M main
   git remote add origin https://github.com/<you>/signal-room.git
   git push -u origin main
   ```
2. Go to **https://vercel.com**, sign up with GitHub (free).
3. **New Project** → import your `signal-room` repo → Vercel auto-detects
   Next.js → click **Deploy**.
4. Once deployed, go to **Settings → Environment Variables** and add every
   key you've collected so far:
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (Stage 3 — required in
     production, or data won't persist between requests)
   - `GROQ_API_KEY`, `GROQ_MODEL` (Stage 1)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (Stage 2)
5. Go to **Deployments** → click the **⋯** menu on the latest deploy →
   **Redeploy** (so it picks up the new environment variables).
6. Visit your live URL (e.g. `https://signal-room.vercel.app`) and confirm
   **"Send test message"** still works there.

*(Render.com and Railway have equivalent free tiers if you'd rather not use
Vercel — same environment variables, build command `npm run build`, start
command `npm run start`.)*

---

## Stage 5 — Connect a real Facebook Page (optional)

Only do this once Stage 4 is live — Meta needs a public HTTPS URL to send
webhooks to; `localhost` won't work here.

1. Go to **https://developers.facebook.com** → **My Apps** → **Create App**
   → choose **"Other"** → **"Business"** as the type → name it anything.
2. In the app dashboard, find **Messenger** in the products list → **Set Up**.
3. Under **Messenger → Settings → Access Tokens**, connect (or create) a
   Facebook Page you manage, and **Generate Token**. Copy it — this is your
   `FB_PAGE_ACCESS_TOKEN`.
4. Still under **Messenger → Settings**, scroll to **Webhooks** →
   **Add Callback URL**:
   - Callback URL: `https://<your-vercel-url>/api/messenger`
   - Verify Token: any string you choose, e.g. `my-verify-token` — just
     make sure it matches `FB_VERIFY_TOKEN`
   - Click **Verify and Save**. If this fails, double-check the deployed
     app is live and the verify token matches exactly.
5. Under **Webhook fields**, subscribe to `messages` (and optionally
   `messaging_postbacks`).
6. Back in Vercel, add:
   ```
   FB_PAGE_ACCESS_TOKEN=EAAG...
   FB_VERIFY_TOKEN=my-verify-token
   ```
   and redeploy.
7. Message your Facebook Page from a personal account. It should appear
   in the live dashboard within a couple seconds, and you should receive
   an actual reply on Messenger.

**Note:** while your app is in Facebook's "Development" mode, only accounts
listed as testers/admins on the app can message the Page. Full public access
requires Meta's App Review — normal for any Messenger bot, free either way.

---

## Full checklist

| # | Connect | Required for | Cost |
|---|---|---|---|
| 0 | Nothing | Local demo | Free |
| 1 | Groq API key | Real AI replies | Free |
| 2 | Telegram bot | Human-handoff alerts | Free |
| 3 | Turso database | Data surviving on a live server | Free |
| 4 | Vercel + GitHub | A public URL | Free |
| 5 | Meta developer app + Page | Real Facebook Messenger traffic | Free |

You can stop at any row and have a working system — each stage only adds
capability, nothing later depends on skipping ahead.
