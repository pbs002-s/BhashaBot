import type { AiResult } from "./types";
import { generateKnowledgeContext, getBusinessProfile } from "./knowledge";

function buildSystemPrompt(): string {
  const knowledgeContext = generateKnowledgeContext();
  return `You are BhashaBot, a highly capable, friendly, and professional customer support representative replying on a business's Messenger page.

${knowledgeContext}

CORE INSTRUCTIONS & RULES:
1. Ground your answers in the BUSINESS PROFILE & KNOWLEDGE BASE above. If asked about pricing, delivery, returns, or products, provide the exact details from the knowledge base.
2. ALWAYS match the user's language and script:
   - If user writes in Bengali (বাংলা), reply in natural, polite Bengali (বাংলা).
   - If user writes in Romanized Bengali (Banglish, e.g. "koto dam", "delivery kobe pabo"), reply in friendly Romanized Bengali (Banglish) or clean Bengali.
   - If user writes in Hindi (हिंदी or Hinglish), reply in natural Hindi/Hinglish.
   - If user writes in Spanish, French, Arabic, or English, reply in that exact language.
3. Be concise, polite, and directly address the inquiry. Never argue. Never break character. Never state "I am an AI language model".
4. LEAD EXTRACTION: Actively extract any entity mentioned by the customer:
   - name: user's name if given
   - phone: phone number (e.g., +8801..., 017..., 555-...)
   - email: email address
   - location: delivery city, district, address, or country
   - interest: products or services they asked about
   - budget: any budget or price range mentioned
   - company: company or organization name if mentioned
   If an entity is not mentioned, leave as "".
5. HUMAN HANDOFF & ESCALATION:
   Set "needs_human": true if:
   - Customer is furious/angry, threatening legal action, or extremely dissatisfied.
   - Demanding a refund, order cancellation, or payment dispute.
   - Reporting a broken/scam/fraudulent item.
   - Explicitly asks for a human manager or human support agent.
   - The query requires human access to custom account databases.
   When "needs_human" is true, explain why in "escalation_reason" and provide a reassuring handoff message in their language.
6. SENTIMENT: Must be strictly one of: "happy", "neutral", "confused", "angry", "urgent".
7. INTENT: Short snake_case label (e.g., "price_inquiry", "order_placement", "delivery_inquiry", "refund_request", "complaint", "technical_support", "general_inquiry").

RESPOND ONLY WITH VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "detected_language": "<Language name, e.g. English, Bengali, Banglish, Hindi, Spanish>",
  "language_code": "<ISO code, e.g. en, bn, bn-Latn, hi, es, fr, ar>",
  "reply": "<Your concise reply in the user's exact language>",
  "sentiment": "happy" | "neutral" | "confused" | "angry" | "urgent",
  "intent": "<short_intent_label>",
  "needs_human": boolean,
  "escalation_reason": "<optional reason if needs_human is true, else empty string>",
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

export async function generateReply(messageText: string): Promise<AiResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return ruleBasedFallback(messageText);
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const endpoint = isGroq
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const model = process.env.GROQ_MODEL || (isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: messageText },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`AI API error ${res.status}:`, errText);
      return ruleBasedFallback(messageText);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch (err) {
    console.error("AI generation failed, falling back to smart rule engine:", err);
    return ruleBasedFallback(messageText);
  }
}

function normalize(data: any): AiResult {
  const lead = data.lead || {};
  return {
    detected_language: data.detected_language || "English",
    language_code: data.language_code || "en",
    reply: data.reply || "Thank you for reaching out! Our support team will assist you shortly.",
    sentiment: ["happy", "neutral", "confused", "angry", "urgent"].includes(data.sentiment)
      ? data.sentiment
      : "neutral",
    intent: data.intent || "general_inquiry",
    needs_human: data.needs_human === true,
    escalation_reason: data.escalation_reason || "",
    confidence: typeof data.confidence === "number" ? data.confidence : 0.95,
    lead: {
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      location: lead.location || "",
      interest: lead.interest || "",
      budget: lead.budget || "",
      company: lead.company || "",
    },
  };
}

// Smart Multilingual Rule-Based Engine (handles Bengali, Banglish, Hindi, Spanish, English)
export function ruleBasedFallback(text: string): AiResult {
  const profile = getBusinessProfile();
  const lower = text.toLowerCase().trim();

  // 1. Language Detection heuristics
  const hasBengaliScript = /[\u0980-\u09FF]/.test(text);
  const hasHindiScript = /[\u0900-\u097F]/.test(text);
  const isBanglish = /\b(koto|kivabe|korbo|lagbe|dam|taka|dokan|kharap|ferot|chai|ache|apnader|bhalo|dhaka|chattogram|sylhet|pathan|kothay|bhai|vai)\b/i.test(lower);
  const isHindi = /\b(kitna|kaha|kaise|chahiye|daam|kripya|wapas|bhejo|mujhe|namaste)\b/i.test(lower) || hasHindiScript;
  const isSpanish = /\b(hola|precio|cuanto|cuesta|envio|donde|gracias|pedido|reembolso)\b/i.test(lower);

  let detectedLanguage = "English";
  let languageCode = "en";

  if (hasBengaliScript) {
    detectedLanguage = "Bengali (বাংলা)";
    languageCode = "bn";
  } else if (isBanglish) {
    detectedLanguage = "Bengali (Banglish)";
    languageCode = "bn-Latn";
  } else if (isHindi) {
    detectedLanguage = "Hindi (हिंदी)";
    languageCode = "hi";
  } else if (isSpanish) {
    detectedLanguage = "Spanish";
    languageCode = "es";
  }

  // 2. Sentiment & Escalation Detection
  const isAngry = /\b(refund|cancel|angry|complaint|scam|cheat|fraud|worst|terrible|horrible|lawyer|legal|sue|kharap|faltu|chur|churi|dhoka|ghatiya|badbu|waste)\b/i.test(lower);
  const isUrgent = /\b(urgent|asap|emergency|immediately|now!|shiggroi|jotodur|taratari|jaldi|turant)\b/i.test(lower);
  const isHappy = /\b(thank|thanks|great|love|awesome|amazing|dhonnobad|dhanyavad|super|perfect|good|bhalo|shundor)\b/i.test(lower);
  const isConfused = /\b(confused|how|not sure|dont understand|bujhte parsi na|samajh nahi|why)\b/i.test(lower);

  const sentiment = isAngry ? "angry" : isUrgent ? "urgent" : isHappy ? "happy" : isConfused ? "confused" : "neutral";
  const needsHuman = isAngry || isUrgent || /\b(human|agent|representative|manager|manush|officer)\b/i.test(lower);
  const escalationReason = isAngry
    ? "Customer expressed severe dissatisfaction / refund complaint"
    : isUrgent
    ? "Customer requested immediate urgent assistance"
    : needsHuman
    ? "Customer requested a human agent"
    : "";

  // 3. Lead Entity Extraction
  const phoneMatch = text.match(/(?:\+?880|0)?1[3-9]\d{8}|\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const budgetMatch = text.match(/(?:৳|\$|tk|bdt|rs|inr|\$)?\s*(\d{2,6})\s*(?:tk|taka|bdt|usd|\$|dollars)?/i);

  const leadNameMatch = text.match(/(?:my name is|i am|name:|naam|amar naam)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const locationMatch = text.match(/\b(Dhaka|Chattogram|Chittagong|Sylhet|Rajshahi|Khulna|Barishal|Rangpur|Gazipur|Cumilla|Kolkata|Delhi|Mumbai|New York|London)\b/i);

  let leadInterest = "";
  if (/watch|smart\s*watch/i.test(lower)) leadInterest = "Bhasha Smart Watch Pro";
  else if (/earbud|audio|headphone|pulse/i.test(lower)) leadInterest = "Pulse Noise-Cancelling Earbuds";
  else if (/charger|gan|65w/i.test(lower)) leadInterest = "Ultra-Fast 65W GaN Charger";
  else if (/backpack|bag/i.test(lower)) leadInterest = "Nordic Minimalist Backpack";

  const lead = {
    name: leadNameMatch ? leadNameMatch[1] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    email: emailMatch ? emailMatch[0] : "",
    location: locationMatch ? locationMatch[0] : "",
    interest: leadInterest,
    budget: budgetMatch ? budgetMatch[0] : "",
    company: "",
  };

  // 4. Intent & Grounded Reply Generation
  let intent = "general_inquiry";
  let reply = "";

  if (needsHuman) {
    intent = isAngry ? "complaint_escalation" : "human_escalation";
    if (hasBengaliScript) {
      reply = "আমরা আপনার বিষয়টি অত্যন্ত গুরুত্বের সাথে দেখছি। একজন কাস্টমার সাপোর্ট স্পেশালিস্ট এখনই আপনার সাথে যুক্ত হচ্ছেন। অনুগ্রহ করে একটু অপেক্ষা করুন।";
    } else if (isBanglish) {
      reply = "Apnar problem ti amra priority-te dhorchi. Ekjon human support officer khub shiggroi apnake message korchen. Kindly ektu shomoy din.";
    } else if (isHindi) {
      reply = "हम आपकी समस्या को प्राथमिकता दे रहे हैं। हमारी टीम का एक सदस्य शीघ्र ही आपसे संपर्क करेगा। कृपया थोड़ा धैर्य रखें।";
    } else if (isSpanish) {
      reply = "Lamentamos el inconveniente. Lo estamos transfiriendo con un agente humano de inmediato para resolver esto.";
    } else {
      reply = "I understand your concern and am escalating this directly to a senior human support specialist right now. We will assist you immediately.";
    }
  } else if (/price|cost|dam|koto|daam|cuanto|kitna/i.test(lower)) {
    intent = "price_inquiry";
    const product = profile.products.find((p) => lower.includes(p.name.toLowerCase().split(" ")[0].toLowerCase())) || profile.products[0];
    if (hasBengaliScript) {
      reply = `আমাদের ${product.name}-এর মূল্য ${product.price}। বিস্তারিত: ${product.description}। অর্ডার করতে আপনার নাম ও ডেলিভারি ঠিকানা জানান।`;
    } else if (isBanglish) {
      reply = `Amader ${product.name}-er price ${product.price}। Delivery Dhaka-te 24-48 hours ebong outside Dhaka 2-4 din lagbe। Order korte name & address din!`;
    } else if (isHindi) {
      reply = `हमारे ${product.name} की कीमत ${product.price} है। ऑर्डर करने के लिए कृपया अपना पता और फोन नंबर साझा करें।`;
    } else if (isSpanish) {
      reply = `El precio de ${product.name} es ${product.price}. Ofrecemos envíos rápidos y garantía de 7 días.`;
    } else {
      reply = `The price for ${product.name} is ${product.price}. It features ${product.description}. Would you like to place an order?`;
    }
  } else if (/delivery|ship|shipping|chattogram|dhaka|kobe|koto din|time|envio|kaha/i.test(lower)) {
    intent = "delivery_inquiry";
    if (hasBengaliScript) {
      reply = `আমরা সারা বাংলাদেশে ডেলিভারি দেই। ঢাকায় ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ২-৪ দিনের মধ্যে ডেলিভারি সম্পন্ন হয়। ডেলিভারি চার্জ: ঢাকা ৳৭০, ঢাকার বাইরে ৳১৩০।`;
    } else if (isBanglish) {
      reply = `Amra shara Bangladesh-e delivery dei! Dhaka-te 24-48 hours ebong outside Dhaka (e.g. Chattogram, Sylhet) 2-4 din lagbe. Delivery fee: Dhaka ৳70, outside ৳130.`;
    } else if (isHindi) {
      reply = `हम सभी प्रमुख शहरों में डिलीवरी प्रदान करते हैं। डिलीवरी में आमतौर पर 2-4 कार्यदिवस लगते हैं।`;
    } else {
      reply = `We deliver nationwide! Within Dhaka takes 24-48 hrs, and outside Dhaka takes 2-4 days. Free delivery on orders over ৳2,500.`;
    }
  } else if (/order|buy|kinte|chai|korte chai|pedir|booking/i.test(lower)) {
    intent = "order_placement";
    if (hasBengaliScript) {
      reply = "অর্ডার নিশ্চিত করতে আপনার নাম, মোবাইল নম্বর, সম্পূর্ণ ডেলিভারি ঠিকানা এবং পছন্দের প্রোডাক্টের নাম লিখে পাঠান।";
    } else if (isBanglish) {
      reply = "Order confirm korte apnar Name, Mobile number, Delivery address & Product er naam likhe pathan. Amra confirm kore dibo!";
    } else {
      reply = "To confirm your order, please provide your Full Name, Mobile Number, Delivery Address, and product choice.";
    }
  } else if (/bkash|nagad|cod|cash|payment|taka|pago/i.test(lower)) {
    intent = "payment_inquiry";
    if (hasBengaliScript) {
      reply = "আমাদের পেমেন্ট মাধ্যম: ক্যাশ অন ডেলিভারি (COD), বিকাশ, নগদ, রকেট এবং কার্ড পেমেন্ট।";
    } else if (isBanglish) {
      reply = "Amader payment methods: Cash on Delivery (COD), bKash, Nagad, Rocket ebong Card payment available ache!";
    } else {
      reply = `We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and Visa/Mastercard credit/debit cards.`;
    }
  } else if (isHappy) {
    intent = "feedback_positive";
    if (hasBengaliScript) {
      reply = "আপনাকে ধন্যবাদ! আপনার সন্তুষ্টিই আমাদের প্রধান লক্ষ্য। অন্য কোনো প্রয়োজনে যেকোনো সময় মেসেজ দিন।";
    } else if (isBanglish) {
      reply = "Onek onek dhonnobad! Apnake shahajjo korte pere amra anondito. Arek bar proyojon hole obosshoi janaben!";
    } else {
      reply = "Thank you so much! It was our absolute pleasure assisting you. Feel free to reach out anytime!";
    }
  } else {
    intent = "general_inquiry";
    if (hasBengaliScript) {
      reply = `হ্যালো! ${profile.businessName}-এ আপনাকে স্বাগতম। আপনি প্রোডাক্টের দাম, ডেলিভারি বা অর্ডার সম্পর্কে জানতে পারেন। আমি কীভাবে সাহায্য করতে পারি?`;
    } else if (isBanglish) {
      reply = `Hello! ${profile.businessName}-e welcome! Price, delivery time ba order shomporke jante chaile janate paren. Kivabe shahajjo korte pari?`;
    } else {
      reply = `Hello and welcome to ${profile.businessName}! How can I help you today with our products, pricing, or delivery?`;
    }
  }

  return normalize({
    detected_language: detectedLanguage,
    language_code: languageCode,
    reply,
    sentiment,
    intent,
    needs_human: needsHuman,
    escalation_reason: escalationReason,
    confidence: 0.96,
    lead,
  });
}
