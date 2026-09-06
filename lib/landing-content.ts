import { MOODS, PLATFORMS, PROVIDERS, WORKSPACE_MODES } from "./settings-schema";
import type { ReplyMood, WorkspaceMode } from "./settings-schema";

/**
 * Copy for the marketing route only. Structure (mood ids, accents, glyphs,
 * counts) is read from the real schema so the page cannot drift out of sync
 * with the desk; the prose is written here because the schema blurbs are
 * product-surface strings, not landing strings.
 */

export const COUNTS = {
  moods: MOODS.length,
  workspaces: WORKSPACE_MODES.length,
  platforms: PLATFORMS.length,
  freeProviders: PROVIDERS.filter((p) => p.tier === "free" || p.tier === "trial").length,
};

/* ---------------------------------------------------------------- ticker */

export type TickerKind = "script" | "channel" | "model";

export const TICKER: { label: string; kind: TickerKind }[] = [
  { label: "বাংলা", kind: "script" },
  { label: "Banglish", kind: "script" },
  { label: "English", kind: "script" },
  { label: "हिन्दी", kind: "script" },
  { label: "Español", kind: "script" },
  { label: "Français", kind: "script" },
  { label: "العربية", kind: "script" },
  { label: "WhatsApp", kind: "channel" },
  { label: "Telegram", kind: "channel" },
  { label: "Messenger", kind: "channel" },
  { label: "Instagram", kind: "channel" },
  { label: "Discord", kind: "channel" },
  { label: "Slack", kind: "channel" },
  { label: "Web widget", kind: "channel" },
  { label: "Groq", kind: "model" },
  { label: "Gemini", kind: "model" },
  { label: "Cerebras", kind: "model" },
  { label: "Mistral", kind: "model" },
  { label: "Together", kind: "model" },
  { label: "OpenRouter", kind: "model" },
  { label: "Ollama (local)", kind: "model" },
];

/* ------------------------------------------------------------ hero panel */

/** Three arrivals the hero panel cycles through, one per script family. */
export const HERO_THREAD: {
  incoming: string;
  gloss: string;
  reply: string;
  read: { script: string; language: string; sentiment: string; intent: string; ms: number };
}[] = [
  {
    incoming: "Bhai black color ta ache? Sylhet e pathaben?",
    gloss: "Romanised Bengali, typed on a phone keyboard",
    reply: "Ha bhai, black ta ache. Sylhet e 2-4 diner moddhe pouche jay, cash on delivery o cholbe.",
    read: {
      script: "Latin",
      language: "bn-Latn",
      sentiment: "neutral",
      intent: "stock + delivery",
      ms: 640,
    },
  },
  {
    incoming: "তিন দিন ধরে অপেক্ষা করছি, কেউ উত্তর দেয়নি।",
    gloss: "Bengali script, an angry customer",
    reply: "তিন দিন কোনো উত্তর না পাওয়া সত্যিই বিরক্তিকর, দুঃখিত। আপনার বিষয়টি এখন আমার সামনেই খোলা আছে।",
    read: {
      script: "Bengali",
      language: "bn",
      sentiment: "negative",
      intent: "complaint",
      ms: 710,
    },
  },
  {
    incoming: "¿Hacen envíos internacionales?",
    gloss: "Spanish, a first-time buyer",
    reply: "Sí, enviamos fuera del país. Dime tu ciudad y te confirmo el coste exacto y los días.",
    read: {
      script: "Latin",
      language: "es",
      sentiment: "positive",
      intent: "shipping",
      ms: 590,
    },
  },
];

/* ------------------------------------------------------- workspace story */

export interface WorkspaceStory {
  id: WorkspaceMode;
  name: string;
  headline: string;
  body: string;
  incoming: string;
  reply: string;
  /** What the desk does with the thread once the reply is out. */
  outcome: string;
  defaultMood: ReplyMood;
}

export const WORKSPACE_STORY: WorkspaceStory[] = [
  {
    id: "business",
    name: "Business",
    headline: "Grounded in your catalogue, never in a guess.",
    body: "Price, stock, delivery and payment come out of the business profile you filled in. Anything missing from it becomes a question back to the customer, not an invention.",
    incoming: "Black ta 2 piece nile discount hobe?",
    reply: "2 piece nile per piece 1,150 taka, mane total 2,300. Address ta dilei confirm kore dicchi.",
    outcome: "Lead captured, phone pending",
    defaultMood: "warm",
  },
  {
    id: "personal",
    name: "Personal",
    headline: "A person answering, not a company.",
    body: "Contractions, first names, one thought per line. No products, no policies, no sign-off that reads like a receipt. When the message carries a feeling, the feeling gets answered first.",
    incoming: "আজ রাতে ফ্রি আছো?",
    reply: "নয়টার পরে থাকব। ফ্রি হলে ফোন দিও, ঠিক করে নেব।",
    outcome: "Nothing logged as a lead",
    defaultMood: "playful",
  },
  {
    id: "official",
    name: "Official",
    headline: "Position, reason, next action. No emoji.",
    body: "Formal register for offices, institutions and academic mail. Complete sentences, an explicit reference to the subject, and আপনি throughout when the thread is in Bengali.",
    incoming: "আমার আবেদন কবে দেখা হবে?",
    reply: "আপনার আবেদন গৃহীত হয়েছে এবং পর্যালোচনার তালিকায় রয়েছে। দশ কার্যদিবসের মধ্যে সিদ্ধান্ত জানানো হবে।",
    outcome: "Filed, no follow-up scheduled",
    defaultMood: "professional",
  },
  {
    id: "creator",
    name: "Creator",
    headline: "Short, warm, and it routes the money mail.",
    body: "Praise gets a brief thank you rather than a paragraph. Hostility gets deflected without engagement. A sponsorship enquiry gets a contact captured and a human flagged.",
    incoming: "We would love to sponsor your next video. Who handles brand deals?",
    reply: "Thank you, genuinely. Brand deals go through one person: drop your email here and you will hear back tomorrow.",
    outcome: "Handoff flagged, email captured",
    defaultMood: "playful",
  },
  {
    id: "support",
    name: "Support",
    headline: "Numbered steps, one diagnostic at a time.",
    body: "It opens by naming the problem it understood, then gives steps the sender can act on now. It asks for exactly one missing detail, and never guesses at a cause it cannot check.",
    incoming: "The widget stopped replying on my site since morning.",
    reply: "So replies stopped this morning while the widget still loads. 1. Open the desk and check the provider light. 2. Send a test from the widget. Which provider key is set?",
    outcome: "Thread kept open for the answer",
    defaultMood: "empathetic",
  },
];

/* ------------------------------------------------------------------ reels */

export type ReelMode = "accumulate" | "swap";
export type Lane = "whatsapp" | "telegram" | "messenger";

export interface ReelLine {
  role: "in" | "out" | "note";
  text: string;
  sub?: string;
  lane?: Lane;
}

export interface ReelStep {
  pill: string;
  ms: number;
  lines: ReelLine[];
  stats?: { label: string; value: string }[];
}

export interface Reel {
  id: string;
  title: string;
  kicker: string;
  mode: ReelMode;
  /** Narrow phone frame, or the wide desk frame. */
  frame: "phone" | "desk";
  steps: ReelStep[];
  footnote?: string;
}

export const REELS: Reel[] = [
  {
    id: "banglish",
    title: "Banglish to order",
    kicker: "One customer, one keyboard, no language picker.",
    mode: "accumulate",
    frame: "phone",
    steps: [
      {
        pill: "Arrives",
        ms: 2600,
        lines: [
          {
            role: "in",
            text: "Bhai black color ta hobe? Sylhet delivery koto?",
            sub: "WhatsApp",
          },
        ],
      },
      {
        pill: "Reads",
        ms: 2400,
        lines: [
          {
            role: "note",
            text: "script Latin · language bn-Latn · sentiment neutral",
            sub: "Two intents in one line: colour availability, delivery cost.",
          },
        ],
      },
      {
        pill: "Looks up",
        ms: 2400,
        lines: [
          {
            role: "note",
            text: "catalogue: black in stock, zone Sylhet, 2-4 days, COD on",
            sub: "Every figure in the reply comes from the business profile.",
          },
        ],
      },
      {
        pill: "Replies",
        ms: 3600,
        lines: [
          {
            role: "out",
            text: "Ha bhai, black ta ache. Sylhet e delivery 90 taka, 2-4 din lage, cash on delivery o cholbe. Phone number ta dile ami order ta confirm kore dicchi.",
            sub: "Answered in the script it arrived in, not in Bengali script",
          },
        ],
      },
      {
        pill: "Keeps",
        ms: 3000,
        lines: [
          {
            role: "note",
            text: "lead saved · city Sylhet · phone awaiting reply · no human needed",
          },
        ],
      },
    ],
  },
  {
    id: "tone",
    title: "The tone shifter",
    kicker: "Same question, four registers. Click a pill to pin one.",
    mode: "swap",
    frame: "phone",
    steps: [
      {
        pill: "Professional",
        ms: 3400,
        lines: [
          { role: "in", text: "Order ta ekhono ashe ni. Ki obostha?" },
          {
            role: "out",
            text: "Your order is in transit and is scheduled for delivery tomorrow. The courier will call the number on the order before arriving.",
          },
        ],
      },
      {
        pill: "Friendly",
        ms: 3400,
        lines: [
          { role: "in", text: "Order ta ekhono ashe ni. Ki obostha?" },
          {
            role: "out",
            text: "Eta rastay ache, kalke pouche jabe. Courier age phone dibe, tension nio na.",
          },
        ],
      },
      {
        pill: "Concise",
        ms: 3400,
        lines: [
          { role: "in", text: "Order ta ekhono ashe ni. Ki obostha?" },
          { role: "out", text: "Kalke delivery. Courier call dibe." },
        ],
      },
      {
        pill: "Pritam",
        ms: 3800,
        lines: [
          { role: "in", text: "Order ta ekhono ashe ni. Ki obostha?" },
          {
            role: "out",
            text: "Ashteche ashteche, kal peye jabe 😄 taratari lagle bolo, ami dekhtesi.",
            sub: "Password-locked mood, written in the owner's measured voice",
          },
        ],
      },
    ],
  },
  {
    id: "sync",
    title: "Three apps, one desk",
    kicker: "Session connectors and cloud webhooks land in the same feed.",
    mode: "accumulate",
    frame: "desk",
    steps: [
      {
        pill: "WhatsApp",
        ms: 2200,
        lines: [
          {
            role: "in",
            lane: "whatsapp",
            text: "Dada, ei product ta ki available?",
            sub: "Baileys session, paired by QR",
          },
        ],
      },
      {
        pill: "Telegram",
        ms: 2200,
        lines: [
          {
            role: "in",
            lane: "telegram",
            text: "Price list ta pathan please",
            sub: "MTProto userbot, logged in",
          },
        ],
      },
      {
        pill: "Messenger",
        ms: 2200,
        lines: [
          {
            role: "in",
            lane: "messenger",
            text: "Do you ship to Chattogram?",
            sub: "Page webhook, verified",
          },
        ],
      },
      {
        pill: "Merges",
        ms: 3200,
        lines: [
          {
            role: "note",
            text: "three threads, one feed, one mood, one lead table",
            sub: "The desk does not care which app the message came from.",
          },
        ],
      },
      {
        pill: "Answers",
        ms: 3600,
        lines: [
          { role: "out", lane: "whatsapp", text: "Ha available ache, kon size ta lagbe?" },
          { role: "out", lane: "telegram", text: "Price list ta pathacchi, ek minute." },
          {
            role: "out",
            lane: "messenger",
            text: "Yes, Chattogram is covered. Two days, cash on delivery.",
          },
        ],
      },
    ],
  },
  {
    id: "persona",
    title: "Training the persona",
    kicker: "Exported chats in, a measured voice out.",
    mode: "accumulate",
    frame: "desk",
    footnote: "Figures from one sample corpus. Your own run writes its own numbers.",
    steps: [
      {
        pill: "Ingest",
        ms: 2800,
        lines: [
          {
            role: "note",
            text: "node scripts/train-persona.mjs",
            sub: "Reads Meta JSON exports from disk. The chats never leave the machine.",
          },
        ],
      },
      {
        pill: "Separate",
        ms: 3000,
        lines: [
          {
            role: "note",
            text: "own messages split from theirs, then bucketed by relationship",
            sub: "Partner, friend, female friend, family, mother, unlabelled.",
          },
        ],
        stats: [
          { label: "threads", value: "128" },
          { label: "messages", value: "41,905" },
          { label: "own replies used", value: "6,430" },
        ],
      },
      {
        pill: "Measure",
        ms: 3400,
        lines: [
          {
            role: "note",
            text: "length, emoji rate, question rate, script split",
            sub: "No style is invented here. Everything is counted.",
          },
        ],
        stats: [
          { label: "median words", value: "12" },
          { label: "banglish", value: "64%" },
          { label: "emoji per reply", value: "0.4" },
          { label: "questions back", value: "38%" },
        ],
      },
      {
        pill: "Sign",
        ms: 3600,
        lines: [
          {
            role: "out",
            text: "Ha kheyeci, tumi kheyeco?",
            sub: "Written in the trained voice, then held behind the mood password.",
          },
        ],
      },
    ],
  },
];

/* --------------------------------------------------------------- persona */

export const GUARDRAILS: string[] = [
  "Intimate registers unlock only inside the personal workspace.",
  "The partner register never fires for a name on the friend roster.",
  "A pull-back in the thread drops the tone on the very next reply.",
  "The trained style file stays on disk and out of git.",
];

/* -------------------------------------------------------------- channels */

export const CONNECTORS: { group: string; rows: { name: string; how: string }[] }[] = [
  {
    group: "Session connectors",
    rows: [
      { name: "WhatsApp", how: "Baileys web session, paired by QR" },
      { name: "Telegram", how: "MTProto login through GramJS" },
      { name: "Messenger", how: "ws3-fca appstate session" },
    ],
  },
  {
    group: "Cloud webhooks",
    rows: [
      { name: "Messenger and Instagram", how: "Meta Graph API, signature checked" },
      { name: "WhatsApp Cloud", how: "Free test number and monthly allowance" },
      { name: "Telegram bot", how: "One message to BotFather" },
      { name: "Discord and Slack", how: "Signed interactions and events" },
      { name: "Web widget", how: "POST JSON, read the reply straight back" },
    ],
  },
];

export const BYOK: { name: string; how: string }[] = [
  { name: "Groq", how: "Free key, no card, fastest of the free tier" },
  { name: "Google AI Studio", how: "Free daily quota, strongest on Bangla" },
  { name: "Cerebras", how: "Free key, no card" },
  { name: "Mistral", how: "Free experiment tier" },
  { name: "Together", how: "Free starter credit" },
  { name: "OpenRouter", how: "Any model id ending in :free costs nothing" },
  { name: "Ollama or LM Studio", how: "A local model, no key and no network" },
];

/* ---------------------------------------------------------------- credits */

export const STACK: { name: string; role: string; url: string }[] = [
  { name: "Next.js 14", role: "App Router, server components", url: "https://nextjs.org" },
  { name: "LibSQL / Turso", role: "Conversation and lead store", url: "https://turso.tech" },
  { name: "Tailwind CSS", role: "Token-driven styling", url: "https://tailwindcss.com" },
  { name: "Framer Motion", role: "Every transition on this page", url: "https://motion.dev" },
  { name: "Phosphor Icons", role: "One icon family throughout", url: "https://phosphoricons.com" },
  {
    name: "@whiskeysockets/baileys",
    role: "WhatsApp session",
    url: "https://github.com/WhiskeySockets/Baileys",
  },
  { name: "telegram", role: "MTProto client", url: "https://gram.js.org" },
  { name: "ws3-fca", role: "Messenger session", url: "https://www.npmjs.com/package/ws3-fca" },
];

export const AUTHORED: string[] = [
  "The persona trainer that turns raw chat exports into a measured style profile.",
  "Bengali and Banglish script heuristics that pick the reply script per message.",
  "Relationship guardrails that decide which register a name is allowed to hear.",
];

/** Landing labels for the mood grid, keyed by the real mood ids. */
export const MOOD_COPY: Record<ReplyMood, { name: string; line: string }> = {
  warm: { name: "Warm", line: "The default front desk. Unhurried, and it always leaves a door open." },
  friendly: { name: "Friendly", line: "First names, short lines, nothing that reads like a form letter." },
  professional: { name: "Professional", line: "Neutral register, complete sentences, no exclamation marks." },
  concise: { name: "Concise", line: "Answer first, nothing after it. Speed read as respect." },
  empathetic: { name: "Empathetic", line: "Names the feeling before it names the fix." },
  playful: { name: "Playful", line: "Light and conversational. Wordplay yes, sarcasm no." },
  persuasive: { name: "Persuasive", line: "One clear benefit, then one clear next step." },
  apologetic: { name: "Apologetic", line: "Owns the miss without grovelling, then repairs it." },
  assertive: { name: "Assertive", line: "Holds the position politely when the answer is no." },
  romantic: { name: "Romantic", line: "Plain and specific. Private threads only." },
  flirty: { name: "Flirty", line: "Teasing and light, and it knows when to stop." },
  pritam: { name: "Pritam Persona", line: "The owner's own voice, learned from his exported chats." },
};
