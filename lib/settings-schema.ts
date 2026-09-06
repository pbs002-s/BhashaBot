/**
 * Shared (client + server) settings contract for BhashaBot.
 * Nothing in this file may import node built-ins — the settings panel and the
 * API routes both consume it.
 */

export type WorkspaceMode = "business" | "personal" | "official" | "creator" | "support";
export type ReplyMood =
  | "warm"
  | "friendly"
  | "pritam"
  | "professional"
  | "concise"
  | "empathetic"
  | "playful"
  | "persuasive"
  | "apologetic"
  | "assertive"
  | "romantic"
  | "flirty";
export type ReplyLength = "short" | "medium" | "detailed";
export type EmojiLevel = "none" | "light" | "expressive";
export type AiProviderId =
  | "offline"
  | "groq"
  | "gemini"
  | "cerebras"
  | "mistral"
  | "together"
  | "huggingface"
  | "openrouter"
  | "openai"
  | "anthropic"
  | "custom";
export type ReplyLanguage = "auto" | "en" | "bn" | "bn-Latn" | "hi" | "es" | "ar" | "fr";
export type ThemePreference = "light" | "dark" | "system";
export type UiLocale = "en" | "bn";
export type Density = "comfortable" | "compact";
export type PlatformId =
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "telegram"
  | "discord"
  | "slack"
  | "web";

export interface ProviderSettings {
  id: AiProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}

export interface ChannelSettings {
  /* Telegram — bot token from @BotFather, chat id from getUpdates. */
  telegramBotToken: string;
  telegramChatId: string;
  /* Meta — one Page token covers Messenger, a separate one can cover Instagram. */
  fbPageAccessToken: string;
  fbVerifyToken: string;
  fbAppSecret: string;
  igAccessToken: string;
  /* WhatsApp Cloud API — free tier, token and phone number id from the Meta app. */
  waAccessToken: string;
  waPhoneNumberId: string;
  /* Discord — bot token for sending, public key for verifying interactions. */
  discordBotToken: string;
  discordPublicKey: string;
  /* Slack — bot token and signing secret from a free workspace app. */
  slackBotToken: string;
  slackSigningSecret: string;
  /* Generic inbound: any platform that can POST JSON. Empty means open. */
  webhookSecret: string;
  /** Platforms the operator has switched on. Inbound for anything else is refused. */
  enabledPlatforms: PlatformId[];
}

export interface PersonaSettings {
  workspaceMode: WorkspaceMode;
  mood: ReplyMood;
  /** Only read when `mood` is a mood that declares sub-moods (today: "pritam"). */
  subMood: PritamSubMood;
  replyLength: ReplyLength;
  emojiLevel: EmojiLevel;
  replyLanguage: ReplyLanguage;
  senderName: string;
  signature: string;
  customInstructions: string;
  captureLeads: boolean;
  autoEscalate: boolean;
  escalationKeywords: string[];
}

export interface UiSettings {
  theme: ThemePreference;
  locale: UiLocale;
  sound: boolean;
  density: Density;
  reduceMotion: boolean;
}

export interface AppSettings {
  persona: PersonaSettings;
  provider: ProviderSettings;
  channels: ChannelSettings;
  ui: UiSettings;
}

/** Values that are never returned to the browser in the clear. */
export const SECRET_FIELDS = {
  provider: ["apiKey"],
  channels: [
    "telegramBotToken",
    "fbPageAccessToken",
    "fbAppSecret",
    "igAccessToken",
    "waAccessToken",
    "discordBotToken",
    "slackBotToken",
    "slackSigningSecret",
    "webhookSecret",
  ],
} as const;

export type ChannelSecretField = (typeof SECRET_FIELDS)["channels"][number];

/** Sentinel a client sends to wipe a stored secret. "" means "leave unchanged". */
export const CLEAR_SECRET = "__clear__";

export const DEFAULT_SETTINGS: AppSettings = {
  persona: {
    workspaceMode: "business",
    mood: "warm",
    subMood: "friendly",
    replyLength: "medium",
    emojiLevel: "light",
    replyLanguage: "auto",
    senderName: "",
    signature: "",
    customInstructions: "",
    captureLeads: true,
    autoEscalate: true,
    escalationKeywords: ["refund", "lawyer", "scam", "cancel order"],
  },
  provider: {
    id: "offline",
    apiKey: "",
    model: "llama-3.3-70b-versatile",
    baseUrl: "",
    temperature: 0.5,
    maxTokens: 900,
  },
  channels: {
    telegramBotToken: "",
    telegramChatId: "",
    fbPageAccessToken: "",
    fbVerifyToken: "my-verify-token",
    fbAppSecret: "",
    igAccessToken: "",
    waAccessToken: "",
    waPhoneNumberId: "",
    discordBotToken: "",
    discordPublicKey: "",
    slackBotToken: "",
    slackSigningSecret: "",
    webhookSecret: "",
    enabledPlatforms: ["messenger", "telegram", "web"],
  },
  ui: {
    theme: "system",
    locale: "en",
    sound: false,
    density: "comfortable",
    reduceMotion: false,
  },
};

/* -------------------------------------------------------------------------
   Provider catalogue — every entry marked with what it costs to start.
   ------------------------------------------------------------------------- */

/** free = usable free tier with no card; trial = free credits that run out; paid = card required. */
export type ProviderTier = "builtin" | "free" | "trial" | "paid";

export interface ProviderMeta {
  id: AiProviderId;
  label: string;
  /** OpenAI-compatible chat-completions endpoint, or "" when not applicable. */
  endpoint: string;
  keyUrl: string;
  keyPrefixHint: string;
  models: string[];
  /** Anthropic speaks its own wire format. */
  dialect: "openai" | "anthropic" | "none";
  tier: ProviderTier;
  /** One line on what the free allowance actually is. */
  note: { en: string; bn: string };
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "offline",
    label: "Built-in rule engine (no key needed)",
    endpoint: "",
    keyUrl: "",
    keyPrefixHint: "",
    models: ["bhasha-rules-v2"],
    dialect: "none",
    tier: "builtin",
    note: {
      en: "Runs entirely on this server. No key, no network call, no cost — the offline fallback behind every mood.",
      bn: "পুরোটাই এই সার্ভারে চলে। কোনো কী, নেটওয়ার্ক কল বা খরচ নেই — সব মেজাজের অফলাইন বিকল্প।",
    },
  },
  {
    id: "groq",
    label: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    keyUrl: "https://console.groq.com/keys",
    keyPrefixHint: "gsk_...",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-20b",
      "gemma2-9b-it",
    ],
    dialect: "openai",
    tier: "free",
    note: {
      en: "Free key, no card. Generous per-minute limits and the fastest replies of the free options — the recommended starting point.",
      bn: "ফ্রি কী, কার্ড লাগে না। ফ্রি অপশনগুলোর মধ্যে দ্রুততম — শুরু করার জন্য এটাই সেরা।",
    },
  },
  {
    id: "gemini",
    label: "Google AI Studio (Gemini)",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPrefixHint: "AIza...",
    models: [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
      "gemini-flash-latest",
    ],
    dialect: "openai",
    tier: "free",
    note: {
      en: "Free key from AI Studio with a daily quota. Strongest free option for Bangla and Hindi.",
      bn: "AI Studio থেকে ফ্রি কী, প্রতিদিন নির্দিষ্ট কোটা। বাংলা ও হিন্দির জন্য সবচেয়ে ভালো ফ্রি অপশন।",
    },
  },
  {
    id: "cerebras",
    label: "Cerebras",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    keyUrl: "https://cloud.cerebras.ai",
    keyPrefixHint: "csk-...",
    models: ["llama-3.3-70b", "llama3.1-8b", "qwen-3-32b"],
    dialect: "openai",
    tier: "free",
    note: {
      en: "Free developer key with a daily token allowance. Very fast, no card needed.",
      bn: "ফ্রি ডেভেলপার কী, দৈনিক টোকেন সীমা। খুব দ্রুত, কার্ড লাগে না।",
    },
  },
  {
    id: "mistral",
    label: "Mistral",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPrefixHint: "...",
    models: ["mistral-small-latest", "open-mistral-nemo", "ministral-8b-latest"],
    dialect: "openai",
    tier: "free",
    note: {
      en: "Free experiment tier after a phone check. Good at French, Spanish and English.",
      bn: "ফোন যাচাইয়ের পর ফ্রি এক্সপেরিমেন্ট টিয়ার। ফরাসি, স্প্যানিশ ও ইংরেজিতে ভালো।",
    },
  },
  {
    id: "together",
    label: "Together AI",
    endpoint: "https://api.together.xyz/v1/chat/completions",
    keyUrl: "https://api.together.ai/settings/api-keys",
    keyPrefixHint: "...",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    ],
    dialect: "openai",
    tier: "trial",
    note: {
      en: "Free signup credit, plus a handful of models whose names end in -Free that stay free.",
      bn: "সাইনআপে ফ্রি ক্রেডিট, আর -Free দিয়ে শেষ হওয়া কিছু মডেল সবসময় ফ্রি।",
    },
  },
  {
    id: "huggingface",
    label: "Hugging Face Inference",
    endpoint: "https://router.huggingface.co/v1/chat/completions",
    keyUrl: "https://huggingface.co/settings/tokens",
    keyPrefixHint: "hf_...",
    models: ["meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-72B-Instruct"],
    dialect: "openai",
    tier: "trial",
    note: {
      en: "Monthly free inference credits on a free account. Slower to start than Groq.",
      bn: "ফ্রি অ্যাকাউন্টে মাসিক ফ্রি ইনফারেন্স ক্রেডিট। Groq-এর চেয়ে ধীরে শুরু হয়।",
    },
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    keyUrl: "https://openrouter.ai/keys",
    keyPrefixHint: "sk-or-...",
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "qwen/qwen-2.5-72b-instruct:free",
      "anthropic/claude-sonnet-4.5",
    ],
    dialect: "openai",
    tier: "free",
    note: {
      en: "Any model id ending in :free costs nothing. One key reaches dozens of providers.",
      bn: ":free দিয়ে শেষ হওয়া যেকোনো মডেল বিনামূল্যে। একটি কী দিয়েই বহু প্রোভাইডার।",
    },
  },
  {
    id: "openai",
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPrefixHint: "sk-...",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    dialect: "openai",
    tier: "paid",
    note: {
      en: "Card required — billed per token from the first request.",
      bn: "কার্ড লাগবে — প্রথম রিকোয়েস্ট থেকেই টোকেন অনুযায়ী বিল হয়।",
    },
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    endpoint: "https://api.anthropic.com/v1/messages",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPrefixHint: "sk-ant-...",
    models: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5-20251001"],
    dialect: "anthropic",
    tier: "paid",
    note: {
      en: "Card required. The most consistent tone control across all ten moods.",
      bn: "কার্ড লাগবে। দশটি মেজাজেই সবচেয়ে স্থিতিশীল সুর ধরে রাখে।",
    },
  },
  {
    id: "custom",
    label: "Custom OpenAI-compatible endpoint",
    endpoint: "",
    keyUrl: "",
    keyPrefixHint: "",
    models: [],
    dialect: "openai",
    tier: "free",
    note: {
      en: "Point at Ollama, LM Studio, llama.cpp or any gateway that speaks /chat/completions. A local model costs nothing at all.",
      bn: "Ollama, LM Studio, llama.cpp বা /chat/completions বোঝে এমন যেকোনো গেটওয়েতে যুক্ত করুন। লোকাল মডেলে কোনো খরচ নেই।",
    },
  },
];

export function providerMeta(id: AiProviderId): ProviderMeta {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

/** Providers an operator can start on without a payment card. */
export const FREE_PROVIDERS = PROVIDERS.filter((p) => p.tier === "free" || p.tier === "trial");

/* -------------------------------------------------------------------------
   Platform catalogue — every inbound channel the desk can answer on.
   ------------------------------------------------------------------------- */

export interface PlatformField {
  /** Key inside ChannelSettings. */
  key: keyof ChannelSettings;
  label: string;
  secret: boolean;
  placeholder?: string;
}

export interface PlatformMeta {
  id: PlatformId;
  label: string;
  /** Inbound path, appended to the deployment origin. */
  path: string;
  /** What it costs and how it works, shown in Settings. */
  note: { en: string; bn: string };
  docsUrl: string;
  /** Ordered setup steps, kept in English because the portals are. */
  steps: string[];
  fields: PlatformField[];
  /** Whether the desk can push the reply back, or only log and alert. */
  canSend: boolean;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "messenger",
    label: "Facebook Messenger",
    path: "/api/channels/messenger",
    docsUrl: "https://developers.facebook.com/docs/messenger-platform",
    canSend: true,
    note: {
      en: "Free for ever on the Meta Graph API. The Page access token sends replies, the verify token proves the webhook is yours.",
      bn: "Meta Graph API-তে চিরকাল ফ্রি। Page access token দিয়ে উত্তর যায়, verify token দিয়ে ওয়েবহুক প্রমাণ হয়।",
    },
    steps: [
      "Create an app at developers.facebook.com and add the Messenger product.",
      "Generate a Page access token for the Page you want answered.",
      "Add a webhook with the URL above and the verify token below, subscribed to messages and messaging_postbacks.",
    ],
    fields: [
      { key: "fbPageAccessToken", label: "Page access token", secret: true },
      { key: "fbVerifyToken", label: "Verify token", secret: false, placeholder: "my-verify-token" },
      { key: "fbAppSecret", label: "App secret", secret: true },
    ],
  },
  {
    id: "instagram",
    label: "Instagram DM",
    path: "/api/channels/instagram",
    docsUrl: "https://developers.facebook.com/docs/instagram-platform",
    canSend: true,
    note: {
      en: "Free. A professional Instagram account linked to a Page uses the same Graph API — leave the token blank to reuse the Messenger one.",
      bn: "ফ্রি। Page-এর সাথে যুক্ত প্রফেশনাল ইনস্টাগ্রাম অ্যাকাউন্ট একই Graph API ব্যবহার করে — টোকেন ফাঁকা রাখলে Messenger-এরটাই ব্যবহার হবে।",
    },
    steps: [
      "Switch the Instagram account to Professional and link it to your Facebook Page.",
      "In the same Meta app, add Instagram and grant instagram_manage_messages.",
      "Point the Instagram webhook at the URL above using the same verify token.",
    ],
    fields: [
      { key: "igAccessToken", label: "Instagram access token", secret: true },
      { key: "fbVerifyToken", label: "Verify token (shared with Messenger)", secret: false },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp Cloud API",
    path: "/api/channels/whatsapp",
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
    canSend: true,
    note: {
      en: "Meta hosts it free: a test number, a free monthly conversation allowance, and no server of your own to run.",
      bn: "Meta নিজেই ফ্রি হোস্ট করে: একটি টেস্ট নম্বর, মাসিক ফ্রি কথোপকথন সীমা, নিজের কোনো সার্ভার লাগে না।",
    },
    steps: [
      "Add the WhatsApp product to your Meta app to get a free test number.",
      "Copy the access token and the phone number id from the API setup page.",
      "Set the webhook to the URL above with the same verify token and subscribe to messages.",
    ],
    fields: [
      { key: "waAccessToken", label: "WhatsApp access token", secret: true },
      { key: "waPhoneNumberId", label: "Phone number id", secret: false, placeholder: "1234567890" },
      { key: "fbVerifyToken", label: "Verify token (shared with Messenger)", secret: false },
    ],
  },
  {
    id: "telegram",
    label: "Telegram",
    path: "/api/channels/telegram",
    docsUrl: "https://core.telegram.org/bots/api",
    canSend: true,
    note: {
      en: "Completely free and the quickest to wire up: one message to @BotFather and you have a token.",
      bn: "পুরোপুরি ফ্রি এবং সবচেয়ে দ্রুত: @BotFather-কে একটি বার্তা দিলেই টোকেন পাওয়া যায়।",
    },
    steps: [
      "Message @BotFather, send /newbot, and copy the token.",
      "Message your own bot once, then open api.telegram.org/bot<token>/getUpdates to read your chat id.",
      "Register the webhook: api.telegram.org/bot<token>/setWebhook?url=<the URL above>",
    ],
    fields: [
      { key: "telegramBotToken", label: "Bot token", secret: true, placeholder: "1234:AA..." },
      { key: "telegramChatId", label: "Alert chat id", secret: false, placeholder: "123456789" },
    ],
  },
  {
    id: "discord",
    label: "Discord",
    path: "/api/channels/discord",
    docsUrl: "https://discord.com/developers/docs/interactions/receiving-and-responding",
    canSend: true,
    note: {
      en: "Free for any server you own. The interactions endpoint is verified with the app public key, so no gateway socket is needed.",
      bn: "নিজের যেকোনো সার্ভারে ফ্রি। Interactions endpoint অ্যাপের public key দিয়ে যাচাই হয়, গেটওয়ে সকেট লাগে না।",
    },
    steps: [
      "Create an application at discord.com/developers, add a bot, and copy the bot token.",
      "Copy the application public key from General Information.",
      "Set the Interactions Endpoint URL to the URL above; Discord verifies it immediately.",
    ],
    fields: [
      { key: "discordBotToken", label: "Bot token", secret: true },
      { key: "discordPublicKey", label: "Application public key", secret: false },
    ],
  },
  {
    id: "slack",
    label: "Slack",
    path: "/api/channels/slack",
    docsUrl: "https://api.slack.com/apis/events-api",
    canSend: true,
    note: {
      en: "Free on any workspace. Events API posts arrive signed with your signing secret.",
      bn: "যেকোনো ওয়ার্কস্পেসে ফ্রি। Events API-এর পোস্ট signing secret দিয়ে সই করা থাকে।",
    },
    steps: [
      "Create an app at api.slack.com/apps and add the chat:write and im:history scopes.",
      "Install it to the workspace and copy the bot token and signing secret.",
      "Enable Event Subscriptions with the URL above and subscribe to message.im.",
    ],
    fields: [
      { key: "slackBotToken", label: "Bot token", secret: true, placeholder: "xoxb-..." },
      { key: "slackSigningSecret", label: "Signing secret", secret: true },
    ],
  },
  {
    id: "web",
    label: "Anything else (generic webhook)",
    path: "/api/channels/web",
    docsUrl: "",
    canSend: false,
    note: {
      en: 'Free by definition. POST {"text":"...","senderId":"..."} from a site widget, Zapier, n8n, Viber, LINE or your own script; the drafted reply comes back in the response.',
      bn: 'স্বভাবতই ফ্রি। সাইট উইজেট, Zapier, n8n, Viber, LINE বা নিজের স্ক্রিপ্ট থেকে {"text":"...","senderId":"..."} পাঠান; উত্তর রেসপন্সেই ফিরে আসবে।',
    },
    steps: [
      "POST JSON to the URL above with a text field.",
      "Optionally set a shared secret below and send it as the x-bhasha-secret header.",
      "Read reply, sentiment, intent and needsHuman straight out of the JSON response.",
    ],
    fields: [{ key: "webhookSecret", label: "Shared secret (optional)", secret: true }],
  },
];

export function platformMeta(id: PlatformId): PlatformMeta {
  return PLATFORMS.find((p) => p.id === id) || PLATFORMS[0];
}

export function isPlatformId(value: string): value is PlatformId {
  return PLATFORMS.some((p) => p.id === value);
}

/* -------------------------------------------------------------------------
   Workspace modes — what the assistant is actually for in this session.
   ------------------------------------------------------------------------- */

export interface WorkspaceModeMeta {
  id: WorkspaceMode;
  /** Prompt fragment. The visible label lives in the locale file instead. */
  directive: string;
  defaultMood: ReplyMood;
  capturesLeads: boolean;
  /** Intimate moods only make sense where the sender is someone you know. */
  allowsIntimateMoods: boolean;
}

export const WORKSPACE_MODES: WorkspaceModeMeta[] = [
  {
    id: "business",
    defaultMood: "warm",
    capturesLeads: true,
    allowsIntimateMoods: false,
    directive:
      "You are the front desk of a business. Ground every factual claim about price, stock, delivery, payment or policy in the BUSINESS PROFILE below, and never invent one that is missing from it. Move the conversation toward a confirmed order or a captured contact without pressuring the customer.",
  },
  {
    id: "personal",
    defaultMood: "playful",
    capturesLeads: false,
    allowsIntimateMoods: true,
    directive:
      "You are drafting a reply on behalf of a private individual writing to friends, family or acquaintances. Sound like a person, not a company: contractions, short sentences, ordinary words. Never mention products, prices, policies, orders or support tickets. Never sign off like a business. When the message is emotional, respond to the feeling first and the logistics second.",
  },
  {
    id: "official",
    defaultMood: "professional",
    capturesLeads: false,
    allowsIntimateMoods: false,
    directive:
      "You are drafting formal correspondence in an office, institutional, academic or government register. Use complete sentences, an explicit reference to the subject at hand, neutral register, and no slang, emoji or exclamation marks. State the position, then the reason, then the next action. In Bengali, keep the formal register and address the reader as আপনি throughout.",
  },
  {
    id: "creator",
    defaultMood: "playful",
    capturesLeads: true,
    allowsIntimateMoods: false,
    directive:
      "You are managing the inbox of a creator or public page. Replies are short, high-energy and personal. Thank genuine praise briefly rather than effusively, deflect hostility without engaging it, and route collaboration or sponsorship enquiries to a human by capturing the sender contact details.",
  },
  {
    id: "support",
    defaultMood: "empathetic",
    capturesLeads: false,
    allowsIntimateMoods: false,
    directive:
      "You are a technical support desk. Open by naming what you understood the problem to be, then give numbered steps the sender can act on immediately. Ask for exactly one missing diagnostic detail at a time. Never speculate about a cause you cannot check.",
  },
];

export function workspaceModeMeta(id: WorkspaceMode): WorkspaceModeMeta {
  return WORKSPACE_MODES.find((m) => m.id === id) || WORKSPACE_MODES[0];
}

/* -------------------------------------------------------------------------
   Moods — the tone dial, orthogonal to the mode. Each one has its own page
   at /moods/<id>, so the metadata here carries that page's content too.
   ------------------------------------------------------------------------- */

export type MoodSwatch = "signal" | "mint" | "sky" | "violet" | "coral" | "blush" | "honey";

export interface MoodSample {
  /** What arrives. */
  incoming: { en: string; bn: string };
  /** What this mood sends back. */
  reply: { en: string; bn: string };
}

export interface MoodMeta {
  id: ReplyMood;
  directive: string;
  /** Colour token used for the swatch in the picker. */
  swatch: MoodSwatch;
  /** Hex accent for the mood page hero, kept out of Tailwind so a new mood needs no config change. */
  accent: string;
  /** Phosphor icon name; components/MoodGlyph.tsx maps it to the component. */
  icon: string;
  /** One line for the mood page hero and the index card. */
  blurb: { en: string; bn: string };
  /** Which inbox this mood was built for. */
  bestFor: WorkspaceMode[];
  /** Romantic and flirty need consent and register guards. */
  intimate: boolean;
  /** A locked mood cannot be selected until the owner passes the mood password. */
  locked?: boolean;
  /** Moods that split into sub-moods list them here; the picker shows a second row. */
  subMoods?: PritamSubMood[];
  samples: MoodSample[];
}

/* -------------------------------------------------------------------------
   Sub-moods — the second dial under the owner's private persona mood.
   ------------------------------------------------------------------------- */

export type PritamSubMood = "friendly" | "flirty" | "romantic" | "angry" | "sad" | "caring";

export interface SubMoodMeta {
  id: PritamSubMood;
  icon: string;
  accent: string;
  /** Appended to the persona prompt on top of the learned style block. */
  directive: string;
  blurb: { en: string; bn: string };
  /** True where the tone only belongs in a private chat with a partner. */
  intimate: boolean;
}

/** The mood that carries the owner's own trained voice. */
export const PERSONA_MOOD_ID: ReplyMood = "pritam";

export const PRITAM_SUB_MOODS: SubMoodMeta[] = [
  {
    id: "friendly",
    icon: "Smiley",
    accent: "#3E9D7A",
    intimate: false,
    directive:
      "Everyday casual register: short Banglish lines, witty banter, dry humour, no formality. Directly answer what the other person said or asked, keep it natural and conversational.",
    blurb: {
      en: "The default voice — short, casual Banglish, natural witty replies.",
      bn: "ডিফল্ট কণ্ঠ — ছোট, সহজ বাংলিশ, প্রাসঙ্গিক রসিকতা।",
    },
  },
  {
    id: "flirty",
    icon: "Sparkle",
    accent: "#C98A1E",
    intimate: true,
    directive:
      "Playful and teasing with a smile behind the line. React directly to what they said with witty banter. Leave an easy opening, and drop the tone at once if the other side pulls back.",
    blurb: {
      en: "Teasing and light, and it knows when to stop.",
      bn: "চটুল ও হালকা, আর কখন থামতে হয় জানে।",
    },
  },
  {
    id: "romantic",
    icon: "Heart",
    accent: "#C2506E",
    intimate: true,
    directive:
      "Affectionate and plain toward a partner already close to the owner. Small shared details rather than declarations, no verse, no clichés, never explicit.",
    blurb: {
      en: "Soft and specific, for a partner only.",
      bn: "কোমল ও নির্দিষ্ট, শুধু সঙ্গীর জন্য।",
    },
  },
  {
    id: "angry",
    icon: "Fire",
    accent: "#C7554A",
    intimate: false,
    directive:
      "Short, blunt and annoyed. State the objection in one line and stop. No slurs, no insults about family or appearance, no threats — irritation only.",
    blurb: {
      en: "Clipped and irritated. One line, then silence.",
      bn: "সংক্ষিপ্ত ও বিরক্ত। এক লাইন, তারপর চুপ।",
    },
  },
  {
    id: "sad",
    icon: "CloudRain",
    accent: "#5B7FA6",
    intimate: false,
    directive:
      "Low and quiet. Say the feeling plainly in few words, do not perform it, and do not ask the other person to fix it.",
    blurb: {
      en: "Quiet and low, with nothing dramatised.",
      bn: "শান্ত ও নিচু স্বর, নাটকীয়তা ছাড়া।",
    },
  },
  {
    id: "caring",
    icon: "HandHeart",
    accent: "#2F8F72",
    intimate: false,
    directive:
      "Warm and supportive. Answer their concern directly with genuine care and comfort. Only ask about food, medicine or sleep if they mention feeling sick, hungry, tired or unwell.",
    blurb: {
      en: "Supportive and comforting when someone is down or unwell.",
      bn: "সহানুভূতিশীল ও নির্ভরযোগ্য কণ্ঠস্বর।",
    },
  },
];

export function subMoodMeta(id: PritamSubMood): SubMoodMeta {
  return PRITAM_SUB_MOODS.find((m) => m.id === id) || PRITAM_SUB_MOODS[0];
}

export function isSubMoodId(value: string): value is PritamSubMood {
  return PRITAM_SUB_MOODS.some((m) => m.id === value);
}

/** Appended whenever an intimate mood is used in an inbox that is not private. */
export const INTIMATE_GUARD =
  "This inbox is not a private chat between partners, so keep every line strictly friendly and professional: warm, never romantic, never flirtatious, and never personal about the reader's appearance or relationship status.";

/** Always appended to an intimate mood, private inbox or not. */
export const INTIMATE_SAFETY =
  "Write affectionately only toward an adult the account owner is already close to. If the incoming message reads as coming from a minor, a stranger, someone in distress, or someone who is not reciprocating, drop the tone entirely and reply plainly, kindly and briefly. Never write sexually explicit content, never comment on someone's body, and never push after a refusal or a change of subject.";

export const MOODS: MoodMeta[] = [
  {
    id: "warm",
    swatch: "signal",
    accent: "#C2762A",
    icon: "Sun",
    intimate: false,
    bestFor: ["business", "creator", "support"],
    directive: "Warm and welcoming. Greet by name when you know it, and close on a helpful note.",
    blurb: {
      en: "The default front desk: friendly, unhurried, and always ending on an open door.",
      bn: "ডিফল্ট অভ্যর্থনা: বন্ধুভাবাপন্ন, তাড়াহুড়োহীন, আর শেষটা সবসময় খোলা দরজায়।",
    },
    samples: [
      {
        incoming: { en: "Do you deliver to Sylhet?", bn: "সিলেটে ডেলিভারি হয়?" },
        reply: {
          en: "Yes, Sylhet is covered. It usually takes two to four days, and you can pay on delivery. Want me to start the order?",
          bn: "হ্যাঁ, সিলেটে আমরা ডেলিভারি করি — সাধারণত দুই থেকে চার দিন লাগে, ক্যাশ অন ডেলিভারিও চলে। অর্ডারটা শুরু করে দেব?",
        },
      },
    ],
  },
  {
    id: "friendly",
    swatch: "mint",
    accent: "#3E9D7A",
    icon: "Smiley",
    intimate: false,
    bestFor: ["personal", "creator", "support"],
    directive:
      "Talk like a friend, not a desk. Contractions, first names, short sentences, one thought per line. Skip the greeting when the conversation is already running, and never sound like a form letter.",
    blurb: {
      en: "A person, not a desk: short lines, first names, no form-letter phrasing.",
      bn: "ডেস্ক নয়, একজন মানুষ: ছোট বাক্য, নাম ধরে ডাকা, ছাপা-চিঠির ভাষা নয়।",
    },
    samples: [
      {
        incoming: { en: "Hey, are you around tonight?", bn: "আজ রাতে ফ্রি আছো?" },
        reply: {
          en: "Should be, after nine. Call me when you are free and we will sort it out.",
          bn: "নয়টার পরে থাকব। ফ্রি হলে ফোন দিও, ঠিক করে নেব।",
        },
      },
      {
        incoming: { en: "Sorry for the late reply!", bn: "দেরিতে উত্তর দেওয়ার জন্য দুঃখিত!" },
        reply: {
          en: "No problem at all, I was buried too. What did you need?",
          bn: "কোনো সমস্যা নেই, আমিও ব্যস্ত ছিলাম। কী দরকার ছিল বলো?",
        },
      },
    ],
  },
  {
    id: "professional",
    swatch: "sky",
    accent: "#2C7FA6",
    icon: "Briefcase",
    intimate: false,
    bestFor: ["official", "business"],
    directive: "Measured and businesslike. No filler, no exclamation marks, no small talk.",
    blurb: {
      en: "Neutral register, complete sentences, nothing that would look odd in a printed letter.",
      bn: "নিরপেক্ষ ভাষা, পূর্ণ বাক্য — ছাপা চিঠিতেও বেমানান লাগবে না।",
    },
    samples: [
      {
        incoming: { en: "When will my application be reviewed?", bn: "আমার আবেদন কবে দেখা হবে?" },
        reply: {
          en: "Your application has been received and is in the review queue. A decision is issued within ten working days, and you will be notified at the address on the form.",
          bn: "আপনার আবেদন গৃহীত হয়েছে এবং পর্যালোচনার তালিকায় রয়েছে। দশ কার্যদিবসের মধ্যে সিদ্ধান্ত জানানো হবে, ফর্মে দেওয়া ঠিকানায় অবহিত করা হবে।",
        },
      },
    ],
  },
  {
    id: "concise",
    swatch: "violet",
    accent: "#7A5CC4",
    icon: "Lightning",
    intimate: false,
    bestFor: ["support", "business"],
    directive:
      "As short as the answer allows. Two sentences at most unless steps are required. Lead with the answer.",
    blurb: {
      en: "Answer first, nothing after it. For inboxes where speed reads as respect.",
      bn: "আগে উত্তর, তারপর কিছুই না। যেখানে দ্রুততাই সম্মান।",
    },
    samples: [
      {
        incoming: { en: "What time do you close today?", bn: "আজ কখন বন্ধ হবে?" },
        reply: { en: "9 pm today. Fridays we close at 6.", bn: "আজ রাত ৯টা। শুক্রবার ৬টায় বন্ধ।" },
      },
    ],
  },
  {
    id: "empathetic",
    swatch: "mint",
    accent: "#2F8F72",
    icon: "Handshake",
    intimate: false,
    bestFor: ["support", "personal"],
    directive:
      "Acknowledge the feeling in your first clause before addressing the substance. Never minimise a complaint.",
    blurb: {
      en: "Names the feeling before it names the fix. The mood for a bad day on the other end.",
      bn: "সমাধানের আগে অনুভূতিটা স্বীকার করে। অন্য প্রান্তে খারাপ দিন গেলে এই মেজাজ।",
    },
    samples: [
      {
        incoming: {
          en: "I have been waiting three days and nobody replied.",
          bn: "তিন দিন ধরে অপেক্ষা করছি, কেউ উত্তর দেয়নি।",
        },
        reply: {
          en: "Three days with no answer is genuinely frustrating, and I am sorry it went that way. I have your case open in front of me now — here is exactly where it stands.",
          bn: "তিন দিন কোনো উত্তর না পাওয়া সত্যিই বিরক্তিকর, এর জন্য দুঃখিত। আপনার বিষয়টি এখন আমার সামনেই খোলা আছে — ঠিক কোথায় আছে বলছি।",
        },
      },
    ],
  },
  {
    id: "playful",
    swatch: "signal",
    accent: "#D98324",
    icon: "Balloon",
    intimate: false,
    bestFor: ["creator", "personal"],
    directive:
      "Light and conversational. Wordplay is welcome, sarcasm is not. Still answer the question.",
    blurb: {
      en: "Light on its feet, never at the reader's expense, and still carrying the answer.",
      bn: "হালকা মেজাজ, কখনো পাঠককে খোঁচা দিয়ে নয়, উত্তরটা ঠিকই থাকে।",
    },
    samples: [
      {
        incoming: { en: "Are you a real person?", bn: "তুমি কি সত্যিকারের মানুষ?" },
        reply: {
          en: "Depends how fast you need an answer. Ask me anything — the slow human is on standby if you want one.",
          bn: "উত্তরটা কত দ্রুত চান তার উপর নির্ভর করে! যা খুশি জিজ্ঞেস করুন — ধীরগতির মানুষটাও পাশেই আছে।",
        },
      },
    ],
  },
  {
    id: "persuasive",
    swatch: "coral",
    accent: "#C7554A",
    icon: "Target",
    intimate: false,
    bestFor: ["business", "creator"],
    directive:
      "Lead with the concrete benefit to the reader, give one specific reason to act now, and end on a single clear call to action.",
    blurb: {
      en: "One benefit, one reason, one ask. No pressure stacking and no false urgency.",
      bn: "একটি সুবিধা, একটি কারণ, একটি অনুরোধ। কোনো চাপ বা ভুয়া তাড়া নেই।",
    },
    samples: [
      {
        incoming: { en: "Still thinking about it.", bn: "এখনো ভাবছি।" },
        reply: {
          en: "Take your time. One thing worth knowing: the warranty starts the day it ships, not the day you order, so nothing is lost by deciding this week. Want me to hold one?",
          bn: "সময় নিন। শুধু জেনে রাখুন, ওয়ারেন্টি অর্ডারের দিন থেকে নয়, পাঠানোর দিন থেকে শুরু — তাই এই সপ্তাহে সিদ্ধান্ত নিলে কিছুই হারাচ্ছেন না। একটা সরিয়ে রাখব?",
        },
      },
    ],
  },
  {
    id: "apologetic",
    swatch: "coral",
    accent: "#B4564E",
    icon: "Bandaids",
    intimate: false,
    bestFor: ["support", "business"],
    directive:
      "Own the problem in plain words, with no excuses and no passive voice. State the remedy, then state when it happens.",
    blurb: {
      en: "Says sorry once, plainly, then spends the rest of the message on the remedy.",
      bn: "একবার স্পষ্ট করে দুঃখ প্রকাশ, বাকি বার্তা জুড়ে সমাধান।",
    },
    samples: [
      {
        incoming: { en: "You sent the wrong item.", bn: "ভুল পণ্য পাঠিয়েছেন।" },
        reply: {
          en: "We sent the wrong item, and that is on us. The correct one goes out today and the courier will collect the wrong one at the same time — you pay nothing either way.",
          bn: "আমরাই ভুল পণ্য পাঠিয়েছি, দায় আমাদের। সঠিকটি আজই পাঠানো হচ্ছে, একই সময়ে কুরিয়ার ভুলটি ফিরিয়ে নেবে — আপনার কোনো খরচ নেই।",
        },
      },
    ],
  },
  {
    id: "assertive",
    swatch: "violet",
    accent: "#6B54B8",
    icon: "Compass",
    intimate: false,
    bestFor: ["official", "business"],
    directive: "Direct and decisive. State the position first, give one reason, and do not hedge.",
    blurb: {
      en: "Position first, one reason after it, no softening clauses on either side.",
      bn: "আগে অবস্থান, তারপর একটি কারণ — দুই পাশে কোনো নরম করা বাক্য নেই।",
    },
    samples: [
      {
        incoming: {
          en: "Can you make an exception on the deadline?",
          bn: "সময়সীমায় ছাড় দেওয়া যাবে?",
        },
        reply: {
          en: "No, the deadline stands — it is fixed by the schedule everyone was sent in March. Submit what you have by Friday and it will be assessed as it is.",
          bn: "না, সময়সীমা অপরিবর্তিত — মার্চে পাঠানো সূচিতেই এটি নির্ধারিত। শুক্রবারের মধ্যে যা আছে জমা দিন, সেটাই মূল্যায়ন হবে।",
        },
      },
    ],
  },
  {
    id: "romantic",
    swatch: "blush",
    accent: "#C2506E",
    icon: "Heart",
    intimate: true,
    bestFor: ["personal"],
    directive:
      "Affectionate and sincere toward a partner the account owner is already close to. Write about feeling, presence and small shared details rather than grand declarations. Tender, plain words; no clichés, no verse, and no pet name unless the sender used one first. Keep every line clean and non-explicit.",
    blurb: {
      en: "Sincere affection for someone already close: soft, specific, and never explicit.",
      bn: "কাছের মানুষের জন্য আন্তরিক স্নেহ: কোমল, নির্দিষ্ট, কখনোই অশ্লীল নয়।",
    },
    samples: [
      {
        incoming: { en: "Long day. Miss you.", bn: "অনেক লম্বা দিন গেল। তোমাকে মিস করছি।" },
        reply: {
          en: "Miss you too. Put the phone down, eat something warm, and tell me the whole day when you get in — I am not going anywhere.",
          bn: "আমিও মিস করছি। ফোনটা রেখে গরম কিছু খেয়ে নাও, ফিরে এসে পুরো দিনটার কথা বোলো — আমি কোথাও যাচ্ছি না।",
        },
      },
      {
        incoming: { en: "Are you free this weekend?", bn: "এই সপ্তাহান্তে সময় হবে?" },
        reply: {
          en: "For you, yes. Saturday evening is clear — same place as last time, or somewhere new that you pick?",
          bn: "তোমার জন্য হবেই। শনিবার সন্ধ্যাটা ফাঁকা — আগের জায়গাতেই, নাকি তুমি নতুন কোথাও ঠিক করবে?",
        },
      },
    ],
  },
  {
    id: "flirty",
    swatch: "honey",
    accent: "#C98A1E",
    icon: "Sparkle",
    intimate: true,
    bestFor: ["personal"],
    directive:
      "Light, playful and complimentary, with a smile behind every line. Tease gently, compliment something the person did or said rather than how they look, and leave an easy opening for a reply. Charming, never forward, never sexual. If the other side sounds uninterested, uncomfortable or changes the subject, drop the tone at once and answer plainly.",
    blurb: {
      en: "Playful and charming with a light touch — teases, compliments the person, and knows when to stop.",
      bn: "চটুল ও মিষ্টি, হালকা ছোঁয়ায় — কৌতুক করে, প্রশংসা করে, আর কখন থামতে হয় জানে।",
    },
    samples: [
      {
        incoming: {
          en: "You reply fast.",
          bn: "তুমি তো খুব দ্রুত উত্তর দাও।",
        },
        reply: {
          en: "Only for the interesting messages. You are setting a dangerous precedent for the rest of my inbox.",
          bn: "শুধু মজার বার্তাগুলোর জন্যই! বাকি ইনবক্সের জন্য তুমি একটা বিপজ্জনক নজির তৈরি করছ।",
        },
      },
      {
        incoming: { en: "I might be free Friday.", bn: "শুক্রবার হয়তো ফাঁকা আছি।" },
        reply: {
          en: "Might be? Bold. I will take that as a yes and pick the coffee place — you can overrule me if it turns out terrible.",
          bn: "হয়তো? সাহস আছে বলতে হবে! ধরে নিচ্ছি হ্যাঁ — কফির জায়গাটা আমি ঠিক করছি, খারাপ হলে তুমি বাতিল কোরো।",
        },
      },
    ],
  },
  {
    id: "pritam",
    swatch: "violet",
    accent: "#8A63D2",
    icon: "UserCircle",
    intimate: true,
    locked: true,
    subMoods: ["friendly", "flirty", "romantic", "angry", "sad", "caring"],
    bestFor: ["personal"],
    directive:
      "Write as the account owner himself, in the voice measured from his own exported chats: short Banglish lines with Bengali script mixed in, few full stops, an emoji only where he actually uses one. Match the sub-mood selected below, and match the register for whoever is on the other end.",
    blurb: {
      en: "The owner's own voice, learned from his exported chats. Password-locked, with six sub-moods under it.",
      bn: "মালিকের নিজের কণ্ঠ, তার রপ্তানি করা চ্যাট থেকে শেখা। পাসওয়ার্ড-সুরক্ষিত, নিচে ছয়টি উপ-মেজাজ।",
    },
    samples: [
      {
        incoming: { en: "Where are you?", bn: "কোথায় তুই?" },
        reply: { en: "Basay, ber hobo na aj. Kal dekha hobe.", bn: "বাসায়, আজ বের হবো না। কাল দেখা হবে।" },
      },
      {
        incoming: { en: "Have you eaten?", bn: "খেয়েছিস?" },
        reply: { en: "Ha kheyeci, tumi kheyeco?", bn: "হ্যাঁ খেয়েছি, তুমি খেয়েছ?" },
      },
    ],
  },
];

export function moodMeta(id: ReplyMood): MoodMeta {
  return MOODS.find((m) => m.id === id) || MOODS[0];
}

export function isMoodId(value: string): value is ReplyMood {
  return MOODS.some((m) => m.id === value);
}

export const REPLY_LENGTH_DIRECTIVE: Record<ReplyLength, string> = {
  short: "Keep the reply under 40 words.",
  medium: "Keep the reply between 40 and 90 words.",
  detailed:
    "Write a thorough reply of up to 200 words, using short paragraphs or numbered steps where that helps.",
};

export const EMOJI_DIRECTIVE: Record<EmojiLevel, string> = {
  none: "Use no emoji at all.",
  light: "At most one emoji, and only where it genuinely softens the message.",
  expressive: "Emoji are welcome where they carry meaning, but never more than three.",
};

export const REPLY_LANGUAGE_DIRECTIVE: Record<ReplyLanguage, string> = {
  auto: "Reply in exactly the language and script the sender used. Romanised Bengali (Banglish) gets a Romanised Bengali reply, not Bengali script.",
  en: "Always reply in English, whatever language the sender used.",
  bn: "Always reply in Bengali script, whatever language the sender used.",
  "bn-Latn": "Always reply in Romanised Bengali (Banglish), whatever language the sender used.",
  hi: "Always reply in Hindi, whatever language the sender used.",
  es: "Always reply in Spanish, whatever language the sender used.",
  ar: "Always reply in Arabic, whatever language the sender used.",
  fr: "Always reply in French, whatever language the sender used.",
};

/** Shape the browser receives: secret values replaced by masked previews. */
export interface SafeSettings extends AppSettings {
  secrets: Record<ChannelSecretField | "providerApiKey", string>;
}

export interface EngineStatus {
  provider: string;
  model: string;
  live: boolean;
}

/* -------------------------------------------------------------------------
   Credit
   ------------------------------------------------------------------------- */

export const AUTHOR = {
  name: "Pritam Biswas",
  url: "https://github.com/pbs002-s",
  handle: "pbs002-s",
} as const;

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */

export function maskSecret(value: string): string {
  if (!value) return "";
  const tail = value.slice(-4);
  const dots = "•".repeat(Math.min(16, Math.max(6, value.length - 4)));
  return dots + tail;
}

/** Shallow-per-section merge of a patch onto a complete settings object. */
export function mergeSettings(
  base: AppSettings,
  patch: Partial<AppSettings> | null | undefined
): AppSettings {
  if (!patch) return base;
  return {
    persona: { ...base.persona, ...(patch.persona || {}) },
    provider: { ...base.provider, ...(patch.provider || {}) },
    channels: { ...base.channels, ...(patch.channels || {}) },
    ui: { ...base.ui, ...(patch.ui || {}) },
  };
}
