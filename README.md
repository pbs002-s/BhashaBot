# BhashaBot — Multilingual AI Auto-Reply & Agent Command Center

A full-stack, enterprise-grade multilingual customer support and agent handoff command center built with **Next.js 14**, **libSQL (SQLite/Turso)**, and **Groq / OpenAI (Llama 3.3)**.

BhashaBot automatically detects any customer language (Bengali, Banglish, Hindi, Spanish, French, English, etc.), grounds responses in customizable business knowledge, classifies sentiment & intents, extracts qualified lead entities, and triggers instant human handoff alerts to Telegram.

---

## 🌟 Key Features

1. **Multilingual AI Reply Engine (`lib/ai.ts`)**:
   - Understands native scripts and romanized variations (e.g. Banglish, Hinglish).
   - Generates contextual, friendly responses in the customer's exact language.
   - Built-in smart offline multilingual NLP fallback for 100% reliability without API keys.

2. **Interactive Live Testing Simulator (`SimulatorModal.tsx`)**:
   - Test custom messages in any language with real-time NLP diagnostic telemetry (Language, Script, Sentiment Gauge, Intent, Lead Extraction Pills, Routing Outcome).
   - Instant presets for Bengali orders, Banglish refund escalations, Hindi queries, B2B lead capture, and Spanish inquiries.

3. **Business Profile & Knowledge Base Grounding (`lib/knowledge.ts`)**:
   - Dynamically injects store catalog, pricing tiers, delivery coverage across 64 districts, payment methods (bKash/Nagad/COD/Cards), and return/warranty policies.

4. **Human Agent Override & Conversation Inspector (`ConversationDrawer.tsx`)**:
   - Inspect full conversation thread details and customer lead cards.
   - Type manual agent replies directly from the dashboard to resolve escalations and push replies to Messenger.

5. **Leads CRM Hub with 1-Click Export (`LeadsPanel.tsx`, `/api/leads/export`)**:
   - Auto-extracts Name, Phone, Email, Location, Company, Budget, and Interest.
   - 1-click **Export to CSV or JSON** for instant CRM import.

6. **Rich Visual Analytics & Intelligence (`AnalyticsPanel.tsx`)**:
   - Customer sentiment emotional spectrum (Happy, Neutral, Confused, Angry, Urgent).
   - Multilingual reach distribution and categorized inquiry intents.
   - AI deflection rate and latency metrics.

7. **Security & Webhook Hardening (`app/api/messenger/route.ts`)**:
   - HMAC SHA-256 (`X-Hub-Signature-256`) signature validation with `FB_APP_SECRET`.
   - Telegram Bot API integration for instant handoff alerts.

---

## 🚀 Quick Start

### 1. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Click **"AI Test Playground"** to test custom messages across any language.
- Click **"Fire Test Event"** to simulate live inbound traffic.
- Explore the **Analytics & Trends**, **Leads CRM**, and **Knowledge Base** tabs.

### 2. Environment Variables (`.env.local`)

All environment variables are optional. The system works completely out-of-the-box in local development with SQLite and the built-in multilingual rule engine:

```env
# Optional: Real AI Model via Groq (Free tier Llama 3.3) or OpenAI
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=

# Optional: Persistent Cloud DB via Turso (free tier: https://turso.tech)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Optional: Real Facebook Messenger Webhook
FB_PAGE_ACCESS_TOKEN=
FB_VERIFY_TOKEN=my-verify-token
FB_APP_SECRET=

# Optional: Telegram Alerts for Human Escalations
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS, Cyber Dark Glassmorphic Design
- **Motion**: Framer Motion
- **Icons**: Lucide React
- **Database**: libSQL (SQLite / Turso)
- **AI Models**: Groq (Llama 3.3 70B), OpenAI, + Offline Multilingual NLP Engine
- **Channels**: Facebook Messenger (Graph API), Telegram Bot API

---

## 📦 Project Architecture

```
BhashaBot/
├── app/
│   ├── api/
│   │   ├── conversations/[id]/reply/   # Agent manual override & resolve
│   │   ├── conversations/[id]/resolve/ # Toggle handoff status
│   │   ├── leads/export/               # CSV / JSON export
│   │   ├── knowledge/                  # Business Profile & FAQs CRUD
│   │   ├── simulate/                   # Live AI testing playground endpoint
│   │   ├── logs/                       # Conversation feed & analytics API
│   │   ├── messenger/                  # Meta Webhook (GET verify / POST events)
│   │   └── seed/                       # Realistic multilingual demo traffic generator
│   ├── globals.css                     # Dark cyber tokens & scrollbar styles
│   ├── layout.tsx                      # Root shell & typography
│   └── page.tsx                        # Master Command Center Coordinator
├── components/
│   ├── AnalyticsPanel.tsx              # Sentiment, language & intent charts
│   ├── ConversationDrawer.tsx          # Thread inspector & manual human reply box
│   ├── ConversationFeed.tsx            # Live stream with multi-filters & search
│   ├── CountUp.tsx                     # Numerical animation counter
│   ├── DemoButton.tsx                  # Realistic event trigger
│   ├── KnowledgePanel.tsx              # Business profile & FAQ editor
│   ├── LeadsPanel.tsx                  # Leads CRM table & export hub
│   ├── SentimentDot.tsx                # Emotional status badges
│   ├── SimulatorModal.tsx              # Multilingual chat playground & diagnostics
│   ├── StatsBar.tsx                    # Quick KPI summary metrics
│   ├── StatusHeader.tsx                # Navigation tabs & audio chime toggle
│   └── WebhookSettingsPanel.tsx        # Webhook & security inspector
└── lib/
    ├── ai.ts                           # Multilingual AI engine & smart fallback
    ├── db.ts                           # SQLite / Turso client & analytics queries
    ├── knowledge.ts                    # Business facts & prompt context builder
    ├── messenger.ts                    # Facebook Graph API client
    ├── telegram.ts                     # Markdown handoff alerts
    └── types.ts                        # TypeScript interfaces & types
```
