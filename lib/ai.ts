import type { AiResult } from "./types";
import { generateKnowledgeContext, getBusinessProfile } from "./knowledge";
import { buildPersonaBlock } from "./persona-pack";
import { roleFor, type RelationshipRole } from "./relationships";
import { getSettings } from "./settings";
import {
  AppSettings,
  EMOJI_DIRECTIVE,
  INTIMATE_GUARD,
  INTIMATE_SAFETY,
  PERSONA_MOOD_ID,
  PersonaSettings,
  REPLY_LANGUAGE_DIRECTIVE,
  REPLY_LENGTH_DIRECTIVE,
  moodMeta,
  providerMeta,
  workspaceModeMeta,
} from "./settings-schema";

export interface ReplyOverrides extends Partial<PersonaSettings> {
  /** Who is on the other end, when the caller knows. Narrows the persona register. */
  counterpartRole?: RelationshipRole;
  /** Their name, used to look the role up when the caller did not pass one. */
  counterpartName?: string;
}

/* =========================================================================
   Prompt assembly
   ========================================================================= */

function buildSystemPrompt(persona: PersonaSettings, role?: RelationshipRole): string {
  const mode = workspaceModeMeta(persona.workspaceMode);
  const mood = moodMeta(persona.mood);
  const capturesLeads = persona.captureLeads && mode.capturesLeads;

  // Romantic and flirty carry a consent guard everywhere, plus a register
  // guard in any inbox that is not a private one.
  const moodGuard = mood.intimate
    ? `
${INTIMATE_SAFETY}${mode.allowsIntimateMoods ? "" : `
${INTIMATE_GUARD}`}`
    : "";

  // The owner's private persona mood carries its own block: the voice measured
  // from his exported chats, the selected sub-mood, and the register for
  // whoever is on the other end.
  const personaBlock =
    persona.mood === PERSONA_MOOD_ID
      ? `

${buildPersonaBlock(persona.subMood || "friendly", role)}`
      : "";

  const knowledgeBlock =
    persona.workspaceMode === "business" || persona.workspaceMode === "creator"
      ? generateKnowledgeContext()
      : "";

  const identity = persona.senderName
    ? `You are writing as ${persona.senderName}. Never refer to yourself in any other name.`
    : "Do not invent a name for yourself. Speak in the first person without introducing yourself.";

  const signature = persona.signature
    ? `End every reply with this exact closing line on its own line: "${persona.signature}"`
    : "Do not append a signature or sign-off block.";

  const escalation = persona.autoEscalate
    ? `HANDING OVER TO A PERSON — set "needs_human" to true when any of these hold:
- The sender is furious, threatening legal action, or deeply dissatisfied.
- They demand a refund, an order cancellation, or dispute a payment.
- They report a broken, counterfeit or fraudulent item.
- They explicitly ask for a human.
- Answering would need access to an account or record you cannot see.
- The message contains any of these words: ${
        persona.escalationKeywords.length ? persona.escalationKeywords.join(", ") : "(none configured)"
      }.
When you set it, put the reason in "escalation_reason" and make the reply a calm holding message in the sender's language.`
    : `Never set "needs_human" to true. Always answer directly, and say plainly when you do not have the information.`;

  const leadRules = capturesLeads
    ? `CONTACT DETAILS — fill "lead" with anything the sender actually stated: name, phone, email, location, what they are interested in, any budget, and their organisation. Leave a field as "" when it was not mentioned. Never guess.`
    : `CONTACT DETAILS — this inbox does not collect contact details. Return every field of "lead" as an empty string, even when the sender mentions them.`;

  return `You are a reply desk drafting a single response to one incoming message.

WHAT THIS INBOX IS FOR
${mode.directive}

VOICE
${identity}
Tone: ${mood.directive}${moodGuard}${personaBlock}
Length: ${REPLY_LENGTH_DIRECTIVE[persona.replyLength]}
Emoji: ${EMOJI_DIRECTIVE[persona.emojiLevel]}
Language: ${REPLY_LANGUAGE_DIRECTIVE[persona.replyLanguage]}
${signature}
${persona.customInstructions ? `Standing instructions from the account owner: ${persona.customInstructions}` : ""}
${knowledgeBlock}
${escalation}

${leadRules}

Never break character, never mention that you are a language model, and never argue with the sender.

"sentiment" must be exactly one of: happy, neutral, confused, angry, urgent.
"intent" is a short snake_case label such as price_inquiry, order_placement, delivery_inquiry, refund_request, complaint, technical_support, personal_catchup, meeting_request, general_inquiry.

Respond with valid JSON and nothing else, matching this schema exactly:
{
  "detected_language": "<language name, e.g. English, Bengali, Banglish, Hindi, Spanish>",
  "language_code": "<ISO code, e.g. en, bn, bn-Latn, hi, es, fr, ar>",
  "reply": "<the reply itself>",
  "sentiment": "happy" | "neutral" | "confused" | "angry" | "urgent",
  "intent": "<short_intent_label>",
  "needs_human": boolean,
  "escalation_reason": "<reason when needs_human is true, otherwise an empty string>",
  "confidence": <number between 0.85 and 0.99>,
  "lead": {
    "name": "<string>",
    "phone": "<string>",
    "email": "<string>",
    "location": "<string>",
    "interest": "<string>",
    "budget": "<string>",
    "company": "<string>"
  }
}`;
}

/* =========================================================================
   Generation
   ========================================================================= */

export async function generateReply(
  messageText: string,
  overrides?: ReplyOverrides
): Promise<AiResult> {
  const settings = await getSettings();
  const { counterpartRole, counterpartName, ...personaOverrides } = overrides || {};
  const persona: PersonaSettings = { ...settings.persona, ...personaOverrides };
  const role: RelationshipRole | undefined =
    counterpartRole || (counterpartName ? roleFor(counterpartName) : undefined);
  const meta = providerMeta(settings.provider.id);

  if (meta.dialect === "none" || !settings.provider.apiKey) {
    return ruleBasedFallback(messageText, persona);
  }

  try {
    let raw: string;
    if (meta.dialect === "anthropic") {
      raw = await callAnthropic(settings, persona, messageText, role);
    } else {
      try {
        raw = await callOpenAiCompatible(settings, persona, messageText, role);
      } catch (firstErr: any) {
        // If Google Gemini returns 503 high demand, 429, 404, or times out, attempt fast fallback to gemini-3.5-flash-lite
        const cleanModel = (settings.provider.model || "").replace(/^models\//, "");
        if (settings.provider.id === "gemini" && cleanModel !== "gemini-3.5-flash-lite") {
          console.warn(
            `Gemini model ${cleanModel} failed (${firstErr?.message || "timeout"}), attempting fast fallback to gemini-3.5-flash-lite...`
          );
          raw = await callOpenAiCompatible(settings, persona, messageText, role, "gemini-3.5-flash-lite");
        } else {
          throw firstErr;
        }
      }
    }

    const parsed = JSON.parse(extractJson(raw));
    return normalize(parsed, persona);
  } catch (err) {
    console.error("Model call failed, falling back to the rule engine:", err);
    return ruleBasedFallback(messageText, persona);
  }
}

async function callOpenAiCompatible(
  settings: AppSettings,
  persona: PersonaSettings,
  messageText: string,
  role?: RelationshipRole,
  overrideModel?: string
): Promise<string> {
  const meta = providerMeta(settings.provider.id);
  const endpoint = settings.provider.baseUrl || meta.endpoint;
  if (!endpoint) throw new Error("No endpoint configured for this provider");

  const rawModel = overrideModel || settings.provider.model || "";
  const model = rawModel.replace(/^models\//, "");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.provider.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: settings.provider.temperature,
      max_tokens: settings.provider.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(persona, role) },
        { role: "user", content: messageText },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

async function callAnthropic(
  settings: AppSettings,
  persona: PersonaSettings,
  messageText: string,
  role?: RelationshipRole
): Promise<string> {
  const endpoint = settings.provider.baseUrl || providerMeta("anthropic").endpoint;

  const rawModel = settings.provider.model || "";
  const model = rawModel.replace(/^models\//, "");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.provider.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: settings.provider.maxTokens,
      temperature: settings.provider.temperature,
      system: buildSystemPrompt(persona, role),
      messages: [
        { role: "user", content: messageText },
        // Prefilling the opening brace keeps Claude inside the JSON contract.
        { role: "assistant", content: "{" },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return text.trim().startsWith("{") ? text : `{${text}`;
}

/** Models occasionally wrap JSON in prose or a fenced block. */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return "{}";
}

/* =========================================================================
   Connection test used by the settings panel
   ========================================================================= */

export async function testProviderConnection(settings: AppSettings): Promise<{
  ok: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}> {
  const meta = providerMeta(settings.provider.id);
  const started = Date.now();

  if (meta.dialect === "none") {
    return { ok: true, latencyMs: 0, model: "bhasha-rules-v2" };
  }
  if (!settings.provider.apiKey) {
    return { ok: false, latencyMs: 0, model: settings.provider.model, error: "No API key stored" };
  }

  try {
    const probe: PersonaSettings = {
      ...settings.persona,
      replyLength: "short",
      customInstructions: "",
    };
    if (meta.dialect === "anthropic") {
      await callAnthropic(settings, probe, "ping");
    } else {
      await callOpenAiCompatible(settings, probe, "ping");
    }
    return { ok: true, latencyMs: Date.now() - started, model: settings.provider.model };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      model: settings.provider.model,
      error: String(err?.message || err).slice(0, 240),
    };
  }
}

/* =========================================================================
   Normalisation
   ========================================================================= */

function normalize(data: any, persona: PersonaSettings): AiResult {
  const lead = data.lead || {};
  const capturesLeads = persona.captureLeads && workspaceModeMeta(persona.workspaceMode).capturesLeads;
  const blank = { name: "", phone: "", email: "", location: "", interest: "", budget: "", company: "" };

  return {
    mood_used: persona.mood,
    detected_language: data.detected_language || "English",
    language_code: data.language_code || "en",
    reply:
      data.reply ||
      "Thanks for the message — I will come back to you on this shortly.",
    sentiment: ["happy", "neutral", "confused", "angry", "urgent"].includes(data.sentiment)
      ? data.sentiment
      : "neutral",
    intent: data.intent || "general_inquiry",
    needs_human: persona.autoEscalate ? data.needs_human === true : false,
    escalation_reason: data.escalation_reason || "",
    confidence: typeof data.confidence === "number" ? data.confidence : 0.95,
    lead: capturesLeads
      ? {
          name: lead.name || "",
          phone: lead.phone || "",
          email: lead.email || "",
          location: lead.location || "",
          interest: lead.interest || "",
          budget: lead.budget || "",
          company: lead.company || "",
        }
      : blank,
  };
}

/* =========================================================================
   Offline engine — multilingual, and now mode-aware
   ========================================================================= */

type LangKey = "bn" | "bnLatn" | "hi" | "es" | "en";

export function ruleBasedFallback(text: string, persona?: PersonaSettings): AiResult {
  const p: PersonaSettings = persona || {
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
    escalationKeywords: [],
  };

  const profile = getBusinessProfile();
  const lower = text.toLowerCase().trim();

  /* 1. Language ---------------------------------------------------------- */
  const hasBengaliScript = /[ঀ-৿]/.test(text);
  const hasHindiScript = /[ऀ-ॿ]/.test(text);
  const isBanglish =
    /\b(koto|kivabe|korbo|lagbe|dam|taka|dokan|kharap|ferot|chai|ache|apnader|bhalo|dhaka|chattogram|sylhet|kothay|bhai|vai|kemon|acho|khobor)\b/i.test(
      lower
    );
  const isHindi =
    /\b(kitna|kaha|kaise|chahiye|daam|kripya|wapas|bhejo|mujhe|namaste)\b/i.test(lower) || hasHindiScript;
  const isSpanish = /\b(hola|precio|cuanto|cuesta|envio|donde|gracias|pedido|reembolso)\b/i.test(lower);

  let detectedLanguage = "English";
  let languageCode = "en";
  let lang: LangKey = "en";

  if (hasBengaliScript) {
    detectedLanguage = "Bengali";
    languageCode = "bn";
    lang = "bn";
  } else if (isBanglish) {
    detectedLanguage = "Banglish";
    languageCode = "bn-Latn";
    lang = "bnLatn";
  } else if (isHindi) {
    detectedLanguage = "Hindi";
    languageCode = "hi";
    lang = "hi";
  } else if (isSpanish) {
    detectedLanguage = "Spanish";
    languageCode = "es";
    lang = "es";
  }

  // A forced reply language overrides what was detected.
  if (p.replyLanguage !== "auto") {
    lang =
      p.replyLanguage === "bn"
        ? "bn"
        : p.replyLanguage === "bn-Latn"
        ? "bnLatn"
        : p.replyLanguage === "hi"
        ? "hi"
        : p.replyLanguage === "es"
        ? "es"
        : "en";
  }

  /* 2. Sentiment and routing --------------------------------------------- */
  const customTrigger = p.escalationKeywords.some((k) => k && lower.includes(k));
  // Latin cues are word-bounded; Bengali and Devanagari have no \b, so those
  // alternatives are matched against the raw text as substrings.
  const isAngry =
    /\b(refund|cancel|angry|complaint|scam|cheat|fraud|worst|terrible|horrible|lawyer|legal|sue|kharap|faltu|churi|dhoka|ghatiya|waste)\b/i.test(
      lower
    ) || /ফেরত|রিফান্ড|অভিযোগ|প্রতারণা|খারাপ|বাতিল/.test(text);
  const isUrgent =
    /\b(urgent|asap|emergency|immediately|shiggroi|taratari|jaldi|turant)\b/i.test(lower) ||
    /জরুরি|তাড়াতাড়ি|শীঘ্র|तुरंत/.test(text);
  const isHappy =
    /\b(thank|thanks|great|love|awesome|amazing|dhonnobad|dhanyavad|super|perfect|good|bhalo|shundor)\b/i.test(
      lower
    ) || /ধন্যবাদ|দারুণ|সুন্দর|চমৎকার|धन्यवाद/.test(text);
  const isConfused =
    /\b(confused|how|not sure|dont understand|bujhte parsi na|samajh nahi|why)\b/i.test(lower) ||
    /বুঝতে পারছি না|কীভাবে|কিভাবে/.test(text);

  const sentiment = isAngry
    ? "angry"
    : isUrgent
    ? "urgent"
    : isHappy
    ? "happy"
    : isConfused
    ? "confused"
    : "neutral";

  const asksForHuman =
    /\b(human|agent|representative|manager|manush|officer)\b/i.test(lower) ||
    /মানুষের সাথে|কর্মকর্তা|ম্যানেজার|প্রতিনিধি/.test(text);
  const needsHuman = p.autoEscalate && (isAngry || isUrgent || asksForHuman || customTrigger);

  const escalationReason = !needsHuman
    ? ""
    : isAngry
    ? "Strong dissatisfaction or a refund dispute"
    : isUrgent
    ? "Sender asked for immediate help"
    : asksForHuman
    ? "Sender asked for a person"
    : "Matched one of your handoff keywords";

  /* 3. Contact extraction ------------------------------------------------- */
  const capturesLeads = p.captureLeads && workspaceModeMeta(p.workspaceMode).capturesLeads;
  const blankLead = { name: "", phone: "", email: "", location: "", interest: "", budget: "", company: "" };

  let lead = blankLead;
  if (capturesLeads) {
    const phoneMatch = text.match(
      /(?:\+?880|0)?1[3-9]\d{8}|\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/
    );
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const budgetMatch = text.match(/(?:৳|\$|tk|bdt|rs|inr)\s*\d{2,7}|\b\d{2,7}\s*(?:tk|taka|bdt|usd|dollars)\b/i);
    const nameMatch = text.match(
      /(?:my name is|i am|name:|naam|amar naam)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    );
    // Bengali names follow "আমার নাম" or "নাম" and run for one or two words.
    const bengaliNameMatch = text.match(
      /(?:আমার নাম|নাম\s*[:ঃ]?)\s*([ঀ-৿]+(?:\s+[ঀ-৿]+)?)/
    );
    const locationMatch = text.match(
      /\b(Dhaka|Chattogram|Chittagong|Sylhet|Rajshahi|Khulna|Barishal|Rangpur|Gazipur|Cumilla|Kolkata|Delhi|Mumbai|New York|London)\b/i
    );
    const bengaliLocationMatch = text.match(
      /(ঢাকা|চট্টগ্রাম|সিলেট|রাজশাহী|খুলনা|বরিশাল|রংপুর|গাজীপুর|কুমিল্লা|ময়মনসিংহ|ধানমন্ডি|উত্তরা|মিরপুর)/
    );

    let interest = "";
    if (/watch|smart\s*watch/i.test(lower) || /ওয়াচ|ঘড়ি/.test(text))
      interest = "Bhasha Smart Watch Pro";
    else if (/earbud|audio|headphone|pulse/i.test(lower) || /ইয়ারবাড|হেডফোন/.test(text))
      interest = "Pulse Noise-Cancelling Earbuds";
    else if (/charger|gan|65w/i.test(lower) || /চার্জার/.test(text))
      interest = "Ultra-Fast 65W GaN Charger";
    else if (/backpack|bag/i.test(lower) || /ব্যাকপ্যাক|ব্যাগ/.test(text))
      interest = "Nordic Minimalist Backpack";

    lead = {
      name: nameMatch ? nameMatch[1] : bengaliNameMatch ? bengaliNameMatch[1] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      email: emailMatch ? emailMatch[0] : "",
      location: locationMatch
        ? locationMatch[0]
        : bengaliLocationMatch
        ? bengaliLocationMatch[0]
        : "",
      interest,
      budget: budgetMatch ? budgetMatch[0] : "",
      company: "",
    };
  }

  /* 4. Intent and copy ---------------------------------------------------- */
  const pick = (variants: Partial<Record<LangKey, string>>) =>
    variants[lang] || variants.en || "";

  let intent = "general_inquiry";
  let reply = "";

  const personalMode = p.workspaceMode === "personal";
  const officialMode = p.workspaceMode === "official";
  const supportMode = p.workspaceMode === "support";

  if (needsHuman) {
    intent = isAngry ? "complaint_escalation" : "human_escalation";
    reply = pick({
      bn: "বিষয়টি আমরা গুরুত্ব দিয়ে দেখছি। একজন সহকর্মী এখনই আপনার সাথে যোগাযোগ করছেন।",
      bnLatn: "Bishoyti amra gurutwo diye dekhchi. Ekjon shohokormi ekhoni apnar sathe jogajog korchen.",
      hi: "हम इसे प्राथमिकता दे रहे हैं। हमारी टीम का एक सदस्य शीघ्र ही आपसे संपर्क करेगा।",
      es: "Lo estamos revisando ahora mismo. Un compañero se pondrá en contacto con usted en breve.",
      en: "I have flagged this for a colleague, who will pick it up with you directly in a moment.",
    });
  } else if (personalMode && p.mood === "romantic") {
    intent = "personal_affection";
    reply = isHappy
      ? pick({
          bn: "এই খবরটা পুরো দিনটা বদলে দিলো। ফিরলে সব শুনব।",
          bnLatn: "Ei khoborta puro din ta bodle dilo. Firle sob shunbo.",
          hi: "यह ख़बर पूरा दिन बदल गई। आकर सब बताना।",
          es: "Esa noticia me ha cambiado el día. Cuéntamelo todo cuando llegues.",
          en: "That news just changed my whole day. Tell me everything when you get in.",
        })
      : pick({
          bn: "বার্তাটা পেয়েছি। তুমি কেমন আছ, সেটাই আগে বলো — বাকিটা পরে হবে।",
          bnLatn: "Message ta peyechi. Tumi kemon acho, seta age bolo — bakita pore hobe.",
          hi: "संदेश मिल गया। पहले यह बताओ कि तुम कैसे हो — बाकी बाद में।",
          es: "Recibí tu mensaje. Dime primero cómo estás tú; lo demás puede esperar.",
          en: "Got your message. Tell me how you are first — the rest can wait.",
        });
  } else if (personalMode && p.mood === "flirty") {
    intent = "personal_banter";
    reply = pick({
      bn: "এত দ্রুত উত্তর পেয়ে অভ্যাস করে ফেলো না! বলো তো, বাকি গল্পটা কোথায় শুনব?",
      bnLatn: "Eto druto uttor peye obhyash kore felo na! Bolo to, baki golpo ta kothay shunbo?",
      hi: "इतनी जल्दी जवाब मिलने की आदत मत डालना! अच्छा, बाकी किस्सा कहाँ सुनूँ?",
      es: "No te acostumbres a respuestas tan rápidas. Dime, ¿dónde me cuentas el resto?",
      en: "Do not get used to replies this fast. So — where do I get the rest of that story?",
    });
  } else if (personalMode) {
    intent = "personal_message";
    reply = isHappy
      ? pick({
          bn: "শুনে খুব ভালো লাগল! পরে বিস্তারিত বলছি।",
          bnLatn: "Shune khub bhalo laglo! Pore bistarito bolchi.",
          hi: "सुनकर बहुत अच्छा लगा! बाद में विस्तार से बात करते हैं।",
          es: "Me alegra mucho saberlo. Te cuento con calma luego.",
          en: "That is really good to hear. I will tell you the whole story later.",
        })
      : pick({
          bn: "পেয়েছি বার্তাটা। একটু পরেই ঠিকঠাক উত্তর দিচ্ছি।",
          bnLatn: "Message ta peyechi. Ektu pore thik moto uttor dicchi.",
          hi: "संदेश मिल गया। थोड़ी देर में ठीक से जवाब देता हूँ।",
          es: "Recibí tu mensaje. Te respondo con calma en un rato.",
          en: "Got your message. I will come back to you properly in a bit.",
        });
  } else if (officialMode) {
    intent = "official_correspondence";
    reply = pick({
      bn: "আপনার বার্তাটি যথাযথভাবে গৃহীত হয়েছে। বিষয়টি পর্যালোচনা করে নির্ধারিত সময়ের মধ্যে আপনাকে অবহিত করা হবে।",
      bnLatn: "Apnar barta ti gohito hoyeche. Bishoyti porjalochona kore nirdharito shomoyer moddhe apnake obohito kora hobe.",
      hi: "आपका संदेश प्राप्त हुआ है। विषय की समीक्षा कर निर्धारित समय में आपको सूचित किया जाएगा।",
      es: "Hemos recibido su mensaje. Será revisado y le informaremos dentro del plazo establecido.",
      en: "Your message has been received and recorded. It will be reviewed and you will be informed of the outcome within the standard response time.",
    });
  } else if (supportMode) {
    intent = "technical_support";
    reply = pick({
      bn: "সমস্যাটি বুঝেছি। প্রথমে অ্যাপটি বন্ধ করে আবার চালু করুন, তারপর একই কাজটি করে দেখুন। না হলে কোন ধাপে আটকে যাচ্ছে সেটি জানান।",
      bnLatn: "Problem ta bujhechi. Prothome app ta bondho kore abar chalu korun, tarpor ekoi kaj ta kore dekhun. Na hole kon dhape atke jacche seta janan.",
      hi: "समस्या समझ गया। पहले ऐप बंद करके दोबारा खोलें, फिर वही चरण दोहराएँ। न हो तो बताइए किस चरण पर रुक रहा है।",
      es: "Entiendo el problema. Cierre la aplicación, ábrala de nuevo y repita el mismo paso. Si sigue igual, dígame en qué paso se detiene.",
      en: "Understood. First close the app and reopen it, then repeat the same step. If it still fails, tell me exactly which step it stops at.",
    });
  } else if (/price|cost|dam|koto|daam|cuanto|kitna/i.test(lower) || /দাম|মূল্য|প্রাইস|কত টাকা|कीमत|दाम/.test(text)) {
    intent = "price_inquiry";
    const product =
      profile.products.find((pr) => lower.includes(pr.name.toLowerCase().split(" ")[0])) ||
      profile.products[0];
    reply = pick({
      bn: `${product.name}-এর দাম ${product.price}। ${product.description} অর্ডার করতে নাম ও ঠিকানা জানালেই হবে।`,
      bnLatn: `${product.name}-er price ${product.price}. Dhaka-e 24-48 ghonta, Dhaka-r baire 2-4 din lage. Order korte naam o thikana din.`,
      hi: `${product.name} की कीमत ${product.price} है। ऑर्डर के लिए अपना पता और फोन नंबर भेजिए।`,
      es: `El precio de ${product.name} es ${product.price}. Hacemos envíos rápidos con siete días de garantía.`,
      en: `${product.name} is ${product.price}. ${product.description} Send your name and address and I can place the order.`,
    });
  } else if (
    /delivery|ship|shipping|kobe|koto din|envio|kaha/i.test(lower) ||
    /ডেলিভারি|পৌঁছাবে|কতদিন|কবে পাব|डिलीवरी/.test(text)
  ) {
    intent = "delivery_inquiry";
    reply = pick({
      bn: `ডেলিভারি: ${profile.deliveryTime}। খরচ: ${profile.deliveryFee}।`,
      bnLatn: `Delivery: ${profile.deliveryTime}. Fee: ${profile.deliveryFee}.`,
      hi: `डिलीवरी: ${profile.deliveryTime}। शुल्क: ${profile.deliveryFee}।`,
      es: `Envío: ${profile.deliveryTime}. Coste: ${profile.deliveryFee}.`,
      en: `Delivery: ${profile.deliveryTime}. Charges: ${profile.deliveryFee}.`,
    });
  } else if (
    /order|buy|kinte|korte chai|pedir|booking/i.test(lower) ||
    /অর্ডার|কিনতে|নিতে চাই|ऑर्डर/.test(text)
  ) {
    intent = "order_placement";
    reply = pick({
      bn: "অর্ডার নিশ্চিত করতে নাম, মোবাইল নম্বর, সম্পূর্ণ ঠিকানা এবং পণ্যের নামটি পাঠান।",
      bnLatn: "Order confirm korte naam, mobile number, purno thikana ar product er naam pathan.",
      hi: "ऑर्डर पक्का करने के लिए नाम, मोबाइल नंबर, पूरा पता और उत्पाद का नाम भेजिए।",
      es: "Para confirmar el pedido, envíe su nombre, teléfono, dirección completa y el producto.",
      en: "To confirm the order, send your name, mobile number, full address and the product you want.",
    });
  } else if (
    /bkash|nagad|cod|cash|payment|pago/i.test(lower) ||
    /বিকাশ|নগদ|রকেট|পেমেন্ট|ক্যাশ অন ডেলিভারি|भुगतान/.test(text)
  ) {
    intent = "payment_inquiry";
    reply = pick({
      bn: `পেমেন্ট মাধ্যম: ${profile.paymentMethods.join(", ")}।`,
      bnLatn: `Payment methods: ${profile.paymentMethods.join(", ")}.`,
      hi: `भुगतान के तरीके: ${profile.paymentMethods.join(", ")}।`,
      es: `Métodos de pago: ${profile.paymentMethods.join(", ")}.`,
      en: `We accept ${profile.paymentMethods.join(", ")}.`,
    });
  } else if (isHappy) {
    intent = "feedback_positive";
    reply = pick({
      bn: "ধন্যবাদ। আপনার সন্তুষ্টিই আমাদের লক্ষ্য, প্রয়োজনে যেকোনো সময় লিখবেন।",
      bnLatn: "Dhonnobad. Apnar shontushtii amader lokkho, proyojone jekono shomoy likhben.",
      hi: "धन्यवाद। किसी भी ज़रूरत पर बेझिझक लिखिए।",
      es: "Gracias. Escríbanos cuando lo necesite.",
      en: "Thank you. Write to us any time you need something.",
    });
  } else {
    intent = "general_inquiry";
    reply = pick({
      bn: `${profile.businessName}-এ স্বাগতম। দাম, ডেলিভারি বা অর্ডার নিয়ে যা জানতে চান জিজ্ঞাসা করুন।`,
      bnLatn: `${profile.businessName}-e welcome. Price, delivery ba order niye ja jante chan bolun.`,
      hi: `${profile.businessName} में आपका स्वागत है। कीमत, डिलीवरी या ऑर्डर के बारे में पूछिए।`,
      es: `Bienvenido a ${profile.businessName}. Pregúntenos por precios, envíos o pedidos.`,
      en: `Welcome to ${profile.businessName}. Ask about pricing, delivery or placing an order.`,
    });
  }

  if (p.signature) {
    reply = `${reply}\n${p.signature}`;
  }

  return {
    mood_used: p.mood,
    detected_language: detectedLanguage,
    language_code: languageCode,
    reply,
    sentiment,
    intent,
    needs_human: needsHuman,
    escalation_reason: escalationReason,
    confidence: 0.94,
    lead,
  };
}
