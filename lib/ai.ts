import type { AiResult } from "./types";

const SYSTEM_PROMPT = `You are a friendly, professional customer support representative replying on a business's Messenger page.
Rules:
- Always be friendly, professional, short and helpful.
- Never argue. Never reveal that you are an AI. Never invent facts.
- If you don't know the answer, set needs_human=true and reply: "I'll connect you with a human."

LANGUAGE: Detect the user's language and ALWAYS reply in that same language. Understand romanized/mixed forms of the language too (e.g. Banglish).

HUMAN HANDOFF: Set needs_human=true for: angry customer, refund, legal, complaint, abuse, order cancellation, payment failed, or an emergency.

SENTIMENT: one of happy, neutral, confused, angry, urgent.

LEAD CAPTURE: extract any of name, phone, email, location, interest, budget, company the user reveals. Leave "" if absent.

Respond ONLY with JSON matching exactly:
{
  "detected_language": "<language name>",
  "language_code": "<ISO code>",
  "reply": "<reply in user's language>",
  "sentiment": "happy|neutral|confused|angry|urgent",
  "intent": "<short label>",
  "needs_human": true|false,
  "lead": {"name":"","phone":"","email":"","location":"","interest":"","budget":"","company":""}
}`;

// --- Free, open-source-model AI reply -------------------------------------
// Uses Groq's free-tier OpenAI-compatible endpoint, serving open source
// models (Llama 3.x). If no GROQ_API_KEY is configured, falls back to a
// deterministic rule-based responder so the whole app still works with
// zero external setup (handy for local demos / grading).
export async function generateReply(messageText: string): Promise<AiResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return ruleBasedFallback(messageText);
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: messageText },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq API error ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch (err) {
    console.error("AI generation failed, falling back:", err);
    return ruleBasedFallback(messageText);
  }
}

function normalize(data: any): AiResult {
  const lead = data.lead || {};
  return {
    detected_language: data.detected_language || "English",
    language_code: data.language_code || "en",
    reply: data.reply || "I'll connect you with a human.",
    sentiment: data.sentiment || "neutral",
    intent: data.intent || "unknown",
    needs_human: data.needs_human === true,
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

// Tiny keyword-based responder used only when no AI key is configured.
function ruleBasedFallback(text: string): AiResult {
  const lower = text.toLowerCase();
  const angry = /(refund|cancel|angry|complaint|scam|legal|lawyer)/.test(lower);
  const urgent = /(urgent|asap|emergency|now!)/.test(lower);
  const sentiment = angry ? "angry" : urgent ? "urgent" : /(thank|great|love)/.test(lower) ? "happy" : "neutral";

  return normalize({
    detected_language: "English",
    language_code: "en",
    reply: angry || urgent
      ? "I'll connect you with a human."
      : "Thanks for reaching out! A team member will follow up shortly with details.",
    sentiment,
    intent: angry ? "complaint" : /price|cost|koto/.test(lower) ? "price_inquiry" : "general_inquiry",
    needs_human: angry || urgent,
    lead: {},
  });
}
