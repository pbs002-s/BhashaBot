import { NextRequest, NextResponse } from "next/server";
import { generateReply, type ReplyOverrides } from "@/lib/ai";
import { insertLog } from "@/lib/db";
import { isUnlocked } from "@/lib/mood-lock";
import { ROLES, type RelationshipRole } from "@/lib/relationships";
import {
  MOODS,
  WORKSPACE_MODES,
  isSubMoodId,
  moodMeta,
  type PritamSubMood,
  type ReplyLength,
  type ReplyMood,
  type WorkspaceMode,
} from "@/lib/settings-schema";

export async function POST(req: NextRequest) {
  const startTs = Date.now();
  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").trim();
  const senderId = body.senderId || `studio-${Math.floor(Math.random() * 9000 + 1000)}`;
  const saveToLogs = body.saveToLogs !== false;

  if (!text) {
    return NextResponse.json({ error: "A message is required" }, { status: 400 });
  }

  // Per-draft overrides so the studio can preview a mode without changing
  // the saved workspace settings.
  const overrides: ReplyOverrides = {};
  if (WORKSPACE_MODES.some((m) => m.id === body.workspaceMode)) {
    overrides.workspaceMode = body.workspaceMode as WorkspaceMode;
  }
  if (MOODS.some((m) => m.id === body.mood)) {
    const mood = body.mood as ReplyMood;
    // Drafting in a locked mood needs the same password as selecting it.
    if (moodMeta(mood).locked && !isUnlocked()) {
      return NextResponse.json({ error: "This mood is locked", locked: true }, { status: 403 });
    }
    overrides.mood = mood;
  }
  if (typeof body.subMood === "string" && isSubMoodId(body.subMood)) {
    overrides.subMood = body.subMood as PritamSubMood;
  }
  if (typeof body.counterpartRole === "string" && ROLES.some((r) => r.id === body.counterpartRole)) {
    overrides.counterpartRole = body.counterpartRole as RelationshipRole;
  }
  if (typeof body.counterpartName === "string" && body.counterpartName.trim()) {
    overrides.counterpartName = body.counterpartName.trim();
  }
  if (["short", "medium", "detailed"].includes(body.replyLength)) {
    overrides.replyLength = body.replyLength as ReplyLength;
  }

  const ai = await generateReply(text, overrides);
  const latencyMs = Date.now() - startTs;

  let logId: number | null = null;
  if (saveToLogs) {
    logId = await insertLog({
      senderId,
      pageId: "reply-studio",
      messageText: text,
      reply: ai.reply,
      detectedLanguage: ai.detected_language,
      languageCode: ai.language_code,
      sentiment: ai.sentiment,
      intent: ai.intent,
      needsHuman: ai.needs_human,
      source: "simulator",
      platform: "web",
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
  }

  return NextResponse.json({ ok: true, logId, latencyMs, result: ai });
}
