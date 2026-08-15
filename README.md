# Signal Room — AI Messenger Auto-Reply Dashboard

A full-stack rebuild of the *AI Messenger Auto Reply* automation (originally an
n8n workflow) as a standalone Next.js app: a live webhook that answers
Facebook Messenger messages with an AI reply in the sender's own language,
flags conversations for human handoff, captures leads, and streams
everything into an animated live dashboard.

Every piece runs on a free tier / open-source project — nothing here requires
a paid plan.

## What it does

1. **Webhook** (`/api/messenger`) receives Messenger events, extracts the
   text, and acknowledges Meta's platform instantly.
2. **AI reply engine** (`lib/ai.ts`) detects the user's language, drafts a
   reply in that language, scores sentiment, extracts lead details, and
   decides if a human is needed — via Groq's free API (open-source Llama 3
   models). No key configured → an offline rule-based fallback keeps the demo
   fully working.
3. **Human handoff** sends a Telegram alert (free Bot API) instead of an
   auto-reply whenever the AI is unsure or the customer is upset.
4. **Storage** (`lib/db.ts`) logs every conversation to SQLite (via the
   open-source libSQL client) — a local file while developing, or a free
   [Turso](https://turso.tech) database once deployed.
5. **Dashboard** (`app/page.tsx`) polls the log every 3s and animates new
   messages, sentiment, captured leads, and live stats in with Framer Motion
   (restrained, transform/opacity-only motion, per the Emil Kowalski motion
   discipline: quick 140–220ms transitions, small staggers, reduced-motion
   respected).

## Tech stack (all free & open source)

| Layer      | Choice                                    | License / cost |
|------------|--------------------------------------------|-----------------|
| Framework  | Next.js 14 (App Router)                    | MIT, free |
| UI motion  | Framer Motion                              | MIT, free |
| Styling    | Tailwind CSS                               | MIT, free |
| Fonts      | Space Grotesk / Inter / JetBrains Mono, self-hosted via `@fontsource` | OFL, free, no external calls |
| Database   | libSQL (SQLite) — local file or free Turso tier | Open source, free tier |
| AI model   | Groq API serving Llama 3.x                 | Free tier, no card required |
| Handoff    | Telegram Bot API                           | Free |
| Channel    | Facebook Messenger (Meta Graph API)        | Free developer app |
| Hosting    | Vercel (or Render/Railway) free tier        | Free tier |

## Project structure

```
app/
  page.tsx                 dashboard UI
  layout.tsx                fonts + global shell
  api/messenger/route.ts    Meta webhook (GET verify / POST receive)
  api/logs/route.ts         dashboard data feed
  api/seed/route.ts         fires a fake message for live demos
lib/
  ai.ts        Groq call + offline fallback responder
  db.ts        libSQL schema + queries
  telegram.ts  human-handoff alert
  messenger.ts sends the reply back to the user
components/    animated dashboard pieces (Framer Motion)
```

## Run it locally

Requirements: Node.js 18+.

```bash
npm install
cp .env.example .env.local     # fill in whichever keys you have — all optional
npm run dev
```

Open http://localhost:3000. Click **"Send test message"** to fire a fake
Messenger event straight into the webhook and watch it animate into the
feed — no Facebook Page needed to see the app work.

### Free API keys (all optional — the app degrades gracefully without them)

| Service | Why | Get a free key |
|---|---|---|
| Groq | Real AI replies (Llama 3) instead of the rule-based fallback | https://console.groq.com/keys |
| Turso | Persistent database in production | https://turso.tech |
| Telegram Bot | Human-handoff alerts | Message **@BotFather** on Telegram |
| Meta for Developers | Connect a real Facebook Page | https://developers.facebook.com |

## Deployment workflow (free hosting)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Signal Room dashboard"
git branch -M main
git remote add origin https://github.com/<you>/signal-room.git
git push -u origin main
```

### 2. Create a free Turso database (persistent storage)
Vercel's filesystem is read-only/ephemeral in production, so swap the local
SQLite file for a free Turso (libSQL) database — same client code, zero
changes needed.

```bash
# one-time CLI setup (free, no credit card)
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create signal-room
turso db show signal-room --url          # -> TURSO_DATABASE_URL
turso db tokens create signal-room       # -> TURSO_AUTH_TOKEN
```

### 3. Deploy to Vercel (free tier)
1. Go to https://vercel.com → **New Project** → import the GitHub repo.
2. Framework preset: Next.js (auto-detected).
3. Add environment variables under **Settings → Environment Variables**:
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `GROQ_API_KEY`, `GROQ_MODEL` (optional)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (optional)
   - `FB_PAGE_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`, `FB_APP_SECRET` (optional)
4. Click **Deploy**. You'll get a URL like `https://signal-room.vercel.app`.

*(Render.com or Railway's free tiers work the same way — build command
`npm run build`, start command `npm run start`.)*

### 4. Connect a real Facebook Page (optional)
1. Create a free app at https://developers.facebook.com → add the
   **Messenger** product.
2. Under **Messenger → Settings → Webhooks**, subscribe your Page and set:
   - Callback URL: `https://<your-vercel-url>/api/messenger`
   - Verify token: same value as `FB_VERIFY_TOKEN`
3. Generate a Page access token and set it as `FB_PAGE_ACCESS_TOKEN` in
   Vercel, then redeploy.
4. Message the Page — replies and logs now flow through the live dashboard.

### 5. Set up the Telegram handoff bot (optional)
1. Message **@BotFather** → `/newbot` → copy the token into
   `TELEGRAM_BOT_TOKEN`.
2. Send your new bot any message, then open
   `https://api.telegram.org/bot<token>/getUpdates` and copy the numeric
   `chat.id` into `TELEGRAM_CHAT_ID`.

## Notes

- All motion follows a single restrained language: 140–220ms transitions,
  transform/opacity only, small staggers, and a `prefers-reduced-motion`
  fallback in `globals.css`.
- The AI system prompt, human-handoff rules, and lead-capture schema mirror
  the original n8n workflow (`AI_Messenger_Auto_Reply.json`) one-for-one, so
  behavior is a drop-in match — just running as ordinary application code
  instead of inside n8n.
