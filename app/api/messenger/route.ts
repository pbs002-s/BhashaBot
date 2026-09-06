import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateReply } from "@/lib/ai";
import { insertLog } from "@/lib/db";
import { alertHumanHandoff } from "@/lib/telegram";
import { sendMessengerReply } from "@/lib/messenger";
import { getSettings } from "@/lib/settings";

// --- GET: Meta webhook verification handshake -----------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const { channels } = await getSettings();
  const verifyToken = channels.fbVerifyToken || "my-verify-token";
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// --- POST: incoming Messenger events --------------------------------------
export async function POST(req: NextRequest) {
  const startTs = Date.now();
  const rawBody = await req.text();

  // 1. Signature Verification (if FB_APP_SECRET is set)
  const appSecret = (await getSettings()).channels.fbAppSecret;
  const signature = req.headers.get("x-hub-signature-256");

  if (appSecret && signature) {
    const expectedSig = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    if (signature !== expectedSig) {
      console.warn("Invalid X-Hub-Signature-256 received");
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }

  let body: any = {};
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: "INVALID_JSON" }, { status: 400 });
  }

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

  // The sender id is what Messenger gives us; when it happens to be a name on
  // the roster the persona mood answers in the right register.
  const ai = await generateReply(text, { counterpartName: senderId });
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
    source: "webhook",
    platform: "messenger",
    mood: ai.mood_used || "",
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
      escalationReason: ai.escalation_reason,
      leadName: ai.lead.name,
      leadPhone: ai.lead.phone,
    });
  } else {
    await sendMessengerReply(senderId, ai.reply);
  }

  // Meta requires a fast 200 acknowledgement.
  return NextResponse.json({ status: "EVENT_RECEIVED" });
}
