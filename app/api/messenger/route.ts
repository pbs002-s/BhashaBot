import { NextRequest, NextResponse } from "next/server";
import { generateReply } from "@/lib/ai";
import { insertLog } from "@/lib/db";
import { alertHumanHandoff } from "@/lib/telegram";
import { sendMessengerReply } from "@/lib/messenger";

// --- GET: Meta webhook verification handshake -----------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.FB_VERIFY_TOKEN || "my-verify-token";
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// --- POST: incoming Messenger events --------------------------------------
export async function POST(req: NextRequest) {
  const startTs = Date.now();
  const body = await req.json().catch(() => ({}));

  const entry = body?.entry?.[0] || {};
  const messaging = entry?.messaging?.[0] || {};
  const msg = messaging?.message || {};
  const text = (msg?.text || "").trim();

  // Ignore delivery/read/echo events and empty messages, but still ack fast.
  if (!text || msg.is_echo) {
    return NextResponse.json({ status: "EVENT_RECEIVED" });
  }

  const senderId = messaging?.sender?.id || "unknown";
  const pageId = entry?.id || "unknown";

  const ai = await generateReply(text);
  const latencyMs = Date.now() - startTs;

  await insertLog({
    senderId,
    pageId,
    messageText: text,
    reply: ai.reply,
    detectedLanguage: ai.detected_language,
    languageCode: ai.language_code,
    sentiment: ai.sentiment,
    intent: ai.intent,
    needsHuman: ai.needs_human,
    leadName: ai.lead.name,
    leadPhone: ai.lead.phone,
    leadEmail: ai.lead.email,
    leadLocation: ai.lead.location,
    leadInterest: ai.lead.interest,
    leadBudget: ai.lead.budget,
    leadCompany: ai.lead.company,
    latencyMs,
  });

  if (ai.needs_human) {
    await alertHumanHandoff({
      sentiment: ai.sentiment,
      intent: ai.intent,
      senderId,
      pageId,
      messageText: text,
      detectedLanguage: ai.detected_language,
    });
  } else {
    await sendMessengerReply(senderId, ai.reply);
  }

  // Meta requires a fast 200 acknowledgement.
  return NextResponse.json({ status: "EVENT_RECEIVED" });
}
