import { NextRequest, NextResponse } from "next/server";
import { generateReply } from "@/lib/ai";
import { insertLog } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { alertHumanHandoff } from "@/lib/telegram";
import {
  isPlatformEnabled,
  parseInbound,
  sendPlatformReply,
  verifyDiscordSignature,
  verifyMetaSignature,
  verifySlackSignature,
  type InboundMessage,
} from "@/lib/channels";
import { isPlatformId, platformMeta, type PlatformId } from "@/lib/settings-schema";

export const dynamic = "force-dynamic";

/** Messenger, Instagram DM and WhatsApp all speak the Meta webhook protocol. */
const META_PLATFORMS: PlatformId[] = ["messenger", "instagram", "whatsapp"];

/* =========================================================================
   GET — webhook verification (Meta) and a status probe for everything else
   ========================================================================= */

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  if (!isPlatformId(params.platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }
  const platform = params.platform;
  const { channels } = await getSettings();

  if (META_PLATFORMS.includes(platform)) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    const verifyToken = channels.fbVerifyToken || "my-verify-token";

    if (mode === "subscribe" && token === verifyToken) {
      return new NextResponse(challenge || "", { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.json({
    platform,
    label: platformMeta(platform).label,
    enabled: (channels.enabledPlatforms || []).includes(platform),
    canSend: platformMeta(platform).canSend,
  });
}

/* =========================================================================
   POST — one inbound pipeline for every channel
   ========================================================================= */

export async function POST(req: NextRequest, { params }: { params: { platform: string } }) {
  const startTs = Date.now();

  if (!isPlatformId(params.platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }
  const platform = params.platform;
  const raw = await req.text();
  const { channels } = await getSettings();

  /* 1. Authenticity ------------------------------------------------------ */
  if (META_PLATFORMS.includes(platform)) {
    if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), channels.fbAppSecret)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }
  if (platform === "slack") {
    const ok = verifySlackSignature(
      raw,
      req.headers.get("x-slack-request-timestamp"),
      req.headers.get("x-slack-signature"),
      channels.slackSigningSecret
    );
    if (!ok) return new NextResponse("Invalid signature", { status: 401 });
  }
  if (platform === "discord") {
    const ok = verifyDiscordSignature(
      raw,
      req.headers.get("x-signature-timestamp"),
      req.headers.get("x-signature-ed25519"),
      channels.discordPublicKey
    );
    if (!ok) return new NextResponse("invalid request signature", { status: 401 });
  }
  if (platform === "web" && channels.webhookSecret) {
    if (req.headers.get("x-bhasha-secret") !== channels.webhookSecret) {
      return NextResponse.json({ error: "Bad secret" }, { status: 401 });
    }
  }

  let body: any = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  /* 2. Handshakes that must answer before anything else ------------------- */
  // Slack proves ownership of the endpoint by echoing a challenge.
  if (platform === "slack" && body?.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }
  // Discord pings the interactions endpoint the moment it is saved.
  if (platform === "discord" && body?.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  /* 3. Enablement --------------------------------------------------------- */
  if (!(await isPlatformEnabled(platform))) {
    return NextResponse.json(
      { error: `${platformMeta(platform).label} is switched off in Settings` },
      { status: 403 }
    );
  }

  /* 4. Draft, log, deliver ------------------------------------------------ */
  const inbound = parseInbound(platform, body);
  if (inbound.length === 0) {
    // Read receipts, echoes, reactions: acknowledge without doing work.
    return NextResponse.json({ status: "EVENT_RECEIVED" });
  }

  const handled = [];
  for (const message of inbound) {
    handled.push(await handleMessage(message, startTs));
  }

  // The generic webhook is synchronous by design: whoever posted gets the
  // drafted reply straight back, since there is nothing to deliver it through.
  if (platform === "web") {
    return NextResponse.json({ ok: true, results: handled });
  }

  // Discord expects an immediate interaction response.
  if (platform === "discord") {
    return NextResponse.json({ type: 4, data: { content: handled[0]?.reply || "…" } });
  }

  return NextResponse.json({ status: "EVENT_RECEIVED" });
}

async function handleMessage(message: InboundMessage, startTs: number) {
  const counterpartName = message.senderName || message.senderId;
  const ai = await generateReply(message.text, { counterpartName });
  const latencyMs = Date.now() - startTs;

  const logId = await insertLog({
    senderId: message.senderId,
    pageId: message.accountId,
    messageText: message.text,
    reply: ai.reply,
    detectedLanguage: ai.detected_language,
    languageCode: ai.language_code,
    sentiment: ai.sentiment,
    intent: ai.intent,
    needsHuman: ai.needs_human,
    source: "webhook",
    platform: message.platform,
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

  let delivered = false;
  if (ai.needs_human) {
    await alertHumanHandoff({
      sentiment: ai.sentiment,
      intent: ai.intent,
      senderId: `${message.platform}:${message.senderId}`,
      pageId: message.accountId,
      messageText: message.text,
      detectedLanguage: ai.detected_language,
      escalationReason: ai.escalation_reason,
      leadName: ai.lead.name,
      leadPhone: ai.lead.phone,
    });
  } else {
    delivered = await sendPlatformReply(message, ai.reply);
  }

  return {
    logId,
    platform: message.platform,
    reply: ai.reply,
    sentiment: ai.sentiment,
    intent: ai.intent,
    mood: ai.mood_used,
    needsHuman: ai.needs_human,
    detectedLanguage: ai.detected_language,
    delivered,
    latencyMs,
  };
}
