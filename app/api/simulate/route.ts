import { NextRequest, NextResponse } from "next/server";
import { generateReply } from "@/lib/ai";
import { insertLog } from "@/lib/db";

export async function POST(req: NextRequest) {
  const startTs = Date.now();
  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").trim();
  const senderId = body.senderId || `sim-user-${Math.floor(Math.random() * 9000 + 1000)}`;
  const saveToLogs = body.saveToLogs !== false;

  if (!text) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  const ai = await generateReply(text);
  const latencyMs = Date.now() - startTs;

  let logId = null;
  if (saveToLogs) {
    logId = await insertLog({
      senderId,
      pageId: "simulator-console",
      messageText: text,
      reply: ai.reply,
      detectedLanguage: ai.detected_language,
      languageCode: ai.language_code,
      sentiment: ai.sentiment,
      intent: ai.intent,
      needsHuman: ai.needs_human,
      source: "simulator",
      leadName: ai.lead.name,
      leadPhone: ai.lead.phone,
      leadEmail: ai.lead.email,
      leadLocation: ai.lead.location,
      leadInterest: ai.lead.interest,
      leadBudget: ai.lead.budget,
      leadCompany: ai.lead.company,
      latencyMs,
    });
  }

  return NextResponse.json({
    ok: true,
    logId,
    latencyMs,
    result: ai,
  });
}
