# BhashaBot — multilingual reply desk

One inbox, every language, the tone you choose.

BhashaBot reads an incoming message in whatever language and script it arrives in — Bengali, Banglish, Hindi, Spanish, French, English — decides whether it can be answered or needs a person, drafts the reply in the voice you configured, and pulls out any contact details the sender shared along the way.

It is **not only for shops**. The same desk drafts replies for a private inbox, an office correspondence queue, a creator's DMs, or a technical support desk. What changes is one setting.

Built with Next.js 14, libSQL (SQLite / Turso), and whichever model provider you point it at — or none at all.

---

## What it does

### Five workspaces, one desk

The **Workspace** setting rewrites the system prompt, the routing rules and the contact-capture behaviour together:

| Workspace | What it is for | Behaviour |
| --- | --- | --- |
| **Business** | Shop or service desk | Grounded in your catalogue, captures contacts, pushes toward a confirmed order |
| **Personal** | Friends and family | Casual and human, no sales language, no contact capture at all |
| **Official** | Office, campus, government | Formal register, position → reason → next action, no emoji |
| **Creator** | Public page DMs | Short and personal, routes sponsorship enquiries to you |
| **Support** | Technical help desk | Numbered steps, one diagnostic question at a time |

### Twelve moods, twelve pages

Warm, **friendly**, professional, concise, empathetic, playful, persuasive, apologetic, assertive, **romantic**, **flirty** and the password-locked **Pritam** persona mood. The mood is orthogonal to the workspace, so an *official* inbox can still be *empathetic*. Reply length, emoji level, forced reply language, sender name, closing line and free-form standing instructions sit alongside it.

Every mood has its **own page** at `/moods/<mood>` — its accent colour, what it is built for, worked examples in English and Bangla, the exact directive the model is given, and a drafting box that runs a real message through that mood without touching your saved settings. The index lives at [`/moods`](/moods).

| Mood | Built for | Sounds like |
| --- | --- | --- |
| Warm | Business, Creator, Support | Friendly, unhurried, ends on an open door |
| Friendly | Personal, Creator, Support | A person, not a desk: short lines, first names |
| Professional | Official, Business | Neutral register, complete sentences |
| Concise | Support, Business | Answer first, nothing after it |
| Empathetic | Support, Personal | Names the feeling before the fix |
| Playful | Creator, Personal | Light, never at the reader's expense |
| Persuasive | Business, Creator | One benefit, one reason, one ask |
| Apologetic | Support, Business | Owns it once, then the remedy |
| Assertive | Official, Business | Position first, no hedging |
| Romantic | Personal | Sincere affection for someone already close |
| Flirty | Personal | Playful and charming, knows when to stop |
| Pritam 🔒 | Personal | The account owner's own voice, learned from his chats |

**Romantic and flirty are written for a personal inbox.** Both carry a standing guard in the prompt: never explicit, never about someone's body, and the tone is dropped the moment the other side is not reciprocating or reads as a minor, a stranger or someone in distress. In a business, official or support workspace they are automatically held to a friendly, professional register instead.

Mode and mood are both switchable from the masthead pill, any mood page, or the command palette without opening Settings.


### The Pritam mood — a trained, password-locked voice

`/moods/pritam` is different from the other eleven. It does not describe a register in the abstract;
it reproduces the account owner's own way of writing, measured from his exported personal chats.

**Training.** Drop the chat exports (one JSON per thread, Meta's export shape:
`{ participants, threadName, messages: [{ senderName, text, timestamp, type }] }`) into `demo-messages/`
and run:

```bash
npm run train:persona          # node scripts/train-persona.mjs
```

The trainer keeps only the owner's own messages, drops media, links and anything with a six-digit run
(phone numbers, OTPs), and writes `lib/persona/pritam-style.json`:

- **Measured style** — average and median reply length, emoji rate, question rate, and the Bengali /
  Banglish / mixed split, plus the openers and phrase pairs he actually uses.
- **Sub-mood examples** — real (incoming, reply) pairs labelled by a bilingual cue lexicon, capped at two
  per counterpart so one chatty thread cannot define a whole mood.
- **Relationship examples** — the same, grouped by who is on the other end.

Neither the corpus nor the trained file is committed: both are in `.gitignore`, and a schema-shaped
`pritam-style.stub.json` stands in until the trainer has been run on that machine.

**Sub-moods.** Friendly, flirty, romantic, angry, sad and caring. The sub-mood only changes the register —
never the facts, and never the safety rules. It is picked on the mood page or in Settings → Voice, and is
saved as `persona.subMood`.

**Who is on the other end.** `lib/relationships.ts` holds the roster: mom, girlfriend, female friend,
friend, family. A thread that matches it gets that register in the prompt and a badge in the live feed,
and the trainer uses the same roster to label the corpus. Romantic cues only count as romantic toward a
partner; toward anyone else they are folded into *caring*.

**The lock.** The mood, its sub-moods and its drafting box sit behind a password. Set `MOOD_PASSWORD` in
`.env.local` (the shipped default is `pritam` — change it). Passing it mints a signed, httpOnly cookie
that lasts twelve hours; `/api/settings`, `/api/simulate` and `/api/persona` all reject a locked mood
without it, so the gate is not merely a hidden button in the UI.

**Limits.** The persona block carries a standing guard of its own: no insults about family, body or
religion, no threats, nothing sexual, no pushing a tone the other side has stepped away from, and the
persona is dropped entirely for a stranger, a minor or someone in real distress.

### Bring your own key — free ones suggested for you

Settings → Model accepts **Groq, Google AI Studio (Gemini), Cerebras, Mistral, Together, Hugging Face, OpenRouter, OpenAI, Anthropic, or any OpenAI-compatible endpoint**, with the model, temperature and token ceiling exposed. A **Free API keys** panel sits underneath it listing every provider you can start on today without a payment card, what its free allowance actually is, and a direct link to the page that issues the key:

| Provider | Cost to start | Get a key |
| --- | --- | --- |
| Groq | Free key, no card — fastest of the free options | <https://console.groq.com/keys> |
| Google AI Studio (Gemini) | Free daily quota, strongest free option for Bangla | <https://aistudio.google.com/apikey> |
| Cerebras | Free developer key, daily token allowance | <https://cloud.cerebras.ai> |
| Mistral | Free experiment tier after a phone check | <https://console.mistral.ai/api-keys> |
| OpenRouter | Every model id ending in `:free` | <https://openrouter.ai/keys> |
| Together AI | Signup credit plus the `-Free` models | <https://api.together.ai/settings/api-keys> |
| Hugging Face | Monthly free inference credits | <https://huggingface.co/settings/tokens> |
| Custom endpoint | Ollama / LM Studio / llama.cpp — free for ever, local | — |

**Scan available models**: paste a key and press *Scan available models* — the desk asks that provider which models the key can actually reach, drops the ones that cannot hold a conversation (embeddings, speech, moderation), and fills the model picker with the rest. The key is used for that one request and is not saved by it, so a scan works before you ever press Save.

Keys are written to your own database and never returned to the browser afterwards — the panel only shows a masked preview. A **Test connection** button fires a real request so a wrong key fails there rather than in front of a customer.

With no key at all, the built-in multilingual rule engine answers instead. It understands Bengali script, Banglish, Hindi, Spanish and English, and it is also the automatic fallback whenever a model call fails.

### Light and dark, English and Bangla

A three-way appearance control (Daylight / Nightfall / Match system) and a full English ⇄ বাংলা interface translation, both persisted per browser and mirrored into your settings row. Bengali typography gets its own treatment — the Latin tracking utilities are neutralised so conjuncts stay intact.

### The rest

- **Reply studio** (`⌘K` → *Reply studio*): draft against any message in any mode before it goes near a customer, with per-draft overrides that do not touch your saved settings.
- **Command palette** (`⌘K` / `Ctrl+K`): jump between pages, switch workspace, set mood, flip the theme, fire a test message.
- **Live feed**: search, mood filter, routing filter, language filter; every card opens a thread inspector where you can reply yourself and mark the handoff handled.
- **Contacts**: names, numbers, emails, locations, budgets and interests extracted from conversation, exportable as CSV or JSON.
- **Insights**: deflection rate, pending handoffs, latency, sentiment spectrum, language reach and intent breakdown.
- **Knowledge**: the facts the assistant is allowed to state. It will not invent anything missing from it.
- **Platforms**: Messenger, Instagram DM, WhatsApp Cloud, Telegram, Discord, Slack and a generic JSON webhook — every one of them on a free tier, each with a signature check and an on/off switch.

### Every platform, free

One pipeline answers on all of them. Each platform has a card in **Settings → Platforms** with its webhook URL, its credentials, its setup steps and a link to the official docs.

| Platform | Endpoint | What it costs | Delivery |
| --- | --- | --- | --- |
| Facebook Messenger | `/api/channels/messenger` | Free on the Meta Graph API | Reply sent back automatically |
| Instagram DM | `/api/channels/instagram` | Free; reuses the Page token | Reply sent back automatically |
| WhatsApp Cloud API | `/api/channels/whatsapp` | Meta's free test number and monthly allowance | Reply sent back automatically |
| Telegram | `/api/channels/telegram` | Completely free, one message to @BotFather | Reply sent back automatically |
| Discord | `/api/channels/discord` | Free; Ed25519-verified interactions endpoint | Answered in the interaction |
| Slack | `/api/channels/slack` | Free on any workspace, signed Events API | Reply posted to the channel |
| Anything else | `/api/channels/web` | Free by definition | Reply returned in the HTTP response |

Meta platforms are verified with `X-Hub-Signature-256`, Slack with its signing secret, Discord with the application public key, and the generic webhook with an optional `x-bhasha-secret` header. A platform that is switched off in Settings refuses inbound posts outright.

```bash
# The generic webhook, usable from a site widget, Zapier, n8n, Viber or LINE
curl -X POST https://your-deployment/api/channels/web \
  -H "Content-Type: application/json" \
  -H "x-bhasha-secret: your-secret" \
  -d '{"text":"দাম কত?","senderId":"visitor-1"}'
```

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Nothing needs configuring — a local SQLite file and the rule engine take over. Press **Send a test message** to watch a real message run through the whole pipeline.

Then open **Settings** and pick what the inbox is for.

### Configuration

Everything is configurable from the Settings page and stored in the database. Environment variables remain supported as a fallback for anyone who would rather keep secrets in `.env.local`:

```env
# Database — leave blank for a local file at ./local.db
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Model provider (Settings → Model wins when a key is stored there)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=

# Meta Messenger
FB_PAGE_ACCESS_TOKEN=
FB_VERIFY_TOKEN=my-verify-token
FB_APP_SECRET=

# Telegram handoff alerts
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## Design notes

The interface is built to a warm-neutral single-accent system rather than the usual dashboard defaults:

- **One colour family.** Warm greys throughout, a single saffron accent, and status hues held below 80% saturation. Every colour is a CSS custom property holding a bare `R G B` triplet, so the same Tailwind class resolves correctly in both themes without a duplicated class name anywhere in the JSX.
- **Nested enclosures.** Cards are a shell plus a core with concentric radii, so surfaces read as machined rather than pasted on.
- **A floating island nav**, detached from the top edge, instead of an edge-to-edge sticky bar.
- **An asymmetric bento** for the metrics — the volume tile is tall and carries the activity trace, the deflection tile is wide because its meter needs the room.
- **Fixed ambient layers.** Grain and radial blooms are `position: fixed` and `pointer-events: none`, so scrolling never repaints them.
- **Motion with mass.** Spring-adjacent cubic-béziers, staggered entry, `transform` and `opacity` only. A **Reduce motion** switch and `prefers-reduced-motion` both stop it.

---

## Tech stack

- **Framework** — Next.js 14 (App Router, React 18, TypeScript)
- **Styling** — Tailwind CSS with CSS-variable colour tokens, class-based dark mode
- **Type** — Outfit (display), Plus Jakarta Sans (body), Hind Siliguri (Bangla), JetBrains Mono (data)
- **Icons** — Phosphor
- **Motion** — Framer Motion
- **Database** — libSQL (SQLite locally, Turso in production)
- **Models** — Groq, Gemini, Cerebras, Mistral, Together, Hugging Face, OpenRouter, OpenAI, Anthropic, any OpenAI-compatible endpoint, or the offline rule engine
- **Platforms** — Meta Graph API (Messenger, Instagram, WhatsApp), Telegram Bot API, Discord interactions, Slack Events API, generic JSON webhook

---

## Project layout

```
BhashaBot/
├── app/
│   ├── api/
│   │   ├── conversations/[id]/reply/    # Manual agent reply
│   │   ├── conversations/[id]/resolve/  # Toggle handoff status
│   │   ├── knowledge/                   # Business profile and FAQs
│   │   ├── leads/export/                # CSV / JSON export
│   │   ├── logs/                        # Feed, stats and analytics
│   │   ├── channels/[platform]/         # One inbound pipeline for every platform
│   │   ├── messenger/                   # Legacy Meta webhook, kept working
│   │   ├── seed/                        # Realistic multilingual test traffic
│   │   ├── settings/                    # Read and write settings (secrets redacted)
│   │   ├── settings/test/               # Live provider and Telegram connection tests
│   │   └── simulate/                    # Reply studio endpoint, accepts overrides
│   ├── globals.css                      # Light and dark tokens, ambient layers
│   ├── layout.tsx                       # Fonts, providers, no-flash theme bootstrap
│   ├── not-found.tsx                    # Branded 404
│   ├── api/moods/unlock/                # Password gate for the locked persona mood
│   ├── api/persona/                     # Trained-voice statistics (locked)
│   ├── moods/                           # Mood index and one page per mood
│   ├── page.tsx                         # The desk
│   ├── privacy/ · terms/                # What is stored and under what terms
│   └── icon.svg                         # Favicon
├── scripts/
│   └── train-persona.mjs                # Builds the trained voice from demo-messages/
├── components/
│   ├── providers/AppProviders.tsx       # Theme, locale and settings contexts
│   ├── ui/primitives.tsx                # Bezel, buttons, fields, meters, empty states
│   ├── AmbientBackdrop.tsx              # Fixed grain and radial blooms
│   ├── AnalyticsPanel.tsx               # Sentiment, language and intent breakdowns
│   ├── CommandPalette.tsx               # ⌘K navigation and mode switching
│   ├── ConversationDrawer.tsx           # Thread inspector and manual reply
│   ├── ConversationFeed.tsx             # Live stream, filters and search
│   ├── CountUp.tsx                      # Tabular number animation
│   ├── DemoButton.tsx                   # One realistic test message
│   ├── KnowledgePanel.tsx               # What the desk is allowed to state
│   ├── LeadsPanel.tsx                   # Contact rail and full CRM table
│   ├── MoodDetail.tsx                   # A single mood's page, sub-moods and lock
│   ├── MoodLock.tsx                     # Password gate hook and card
│   ├── MoodIndex.tsx                    # The mood library
│   ├── ReplyStudio.tsx                  # Draft with per-draft mode overrides
│   ├── SentimentDot.tsx                 # Mood badges
│   ├── SettingsPanel.tsx                # Workspace, voice, model, free keys, platforms
│   ├── SiteFooter.tsx                   # Shared footer and credit
│   ├── StatsBar.tsx                     # Asymmetric metric bento
│   ├── StatusHeader.tsx                 # Masthead and floating island nav
│   └── WorkspacePill.tsx                # Mode and mood switcher
└── lib/
    ├── ai.ts                            # Prompt assembly, providers, offline engine
    ├── channels.ts                       # Inbound parsing, outbound sending, signatures
    ├── db.ts                            # libSQL client, queries and analytics
    ├── i18n.ts                          # English and Bangla dictionaries
    ├── knowledge.ts                     # Business facts and prompt context
    ├── messenger.ts                     # Meta Graph API client
    ├── settings-schema.ts               # Settings contract, modes, moods, platforms
    ├── settings.ts                      # Server store, env fallback, redaction
    ├── telegram.ts                      # Handoff alerts
    └── types.ts                         # Shared types
```

---

## Credit

Built by **Pritam Biswas** — <https://github.com/pbs002-s>
