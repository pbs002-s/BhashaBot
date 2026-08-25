import { createClient } from "@libsql/client";
import type { ConversationLog, Sentiment, AnalyticsSummary } from "./types";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient(
  authToken ? { url, authToken } : { url }
);

let ready: Promise<void> | null = null;

export function initDb() {
  if (!ready) {
    ready = (async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          senderId TEXT,
          pageId TEXT,
          messageText TEXT,
          reply TEXT,
          detectedLanguage TEXT,
          languageCode TEXT,
          sentiment TEXT,
          intent TEXT,
          needsHuman INTEGER,
          isResolved INTEGER DEFAULT 0,
          agentReply TEXT DEFAULT '',
          agentRepliedAt TEXT DEFAULT '',
          source TEXT DEFAULT 'webhook',
          leadName TEXT,
          leadPhone TEXT,
          leadEmail TEXT,
          leadLocation TEXT,
          leadInterest TEXT,
          leadBudget TEXT,
          leadCompany TEXT,
          latencyMs INTEGER,
          createdAt TEXT
        )
      `);

      // Ensure new columns exist on older tables without errors
      try {
        await db.execute(`ALTER TABLE logs ADD COLUMN isResolved INTEGER DEFAULT 0`);
      } catch {}
      try {
        await db.execute(`ALTER TABLE logs ADD COLUMN agentReply TEXT DEFAULT ''`);
      } catch {}
      try {
        await db.execute(`ALTER TABLE logs ADD COLUMN agentRepliedAt TEXT DEFAULT ''`);
      } catch {}
      try {
        await db.execute(`ALTER TABLE logs ADD COLUMN source TEXT DEFAULT 'webhook'`);
      } catch {}
    })();
  }
  return ready;
}

export async function insertLog(row: Omit<ConversationLog, "id" | "createdAt">): Promise<number> {
  await initDb();
  const createdAt = new Date().toISOString();
  const res = await db.execute({
    sql: `INSERT INTO logs
      (senderId, pageId, messageText, reply, detectedLanguage, languageCode,
       sentiment, intent, needsHuman, isResolved, agentReply, agentRepliedAt, source,
       leadName, leadPhone, leadEmail, leadLocation, leadInterest, leadBudget, leadCompany,
       latencyMs, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.senderId,
      row.pageId,
      row.messageText,
      row.reply,
      row.detectedLanguage,
      row.languageCode,
      row.sentiment,
      row.intent,
      row.needsHuman ? 1 : 0,
      row.isResolved ? 1 : 0,
      row.agentReply || "",
      row.agentRepliedAt || "",
      row.source || "webhook",
      row.leadName || "",
      row.leadPhone || "",
      row.leadEmail || "",
      row.leadLocation || "",
      row.leadInterest || "",
      row.leadBudget || "",
      row.leadCompany || "",
      row.latencyMs || 0,
      createdAt,
    ],
  });
  return Number(res.lastInsertRowid) || 0;
}

export async function listLogs(params: {
  limit?: number;
  sentiment?: string;
  needsHuman?: boolean;
  search?: string;
  language?: string;
} = {}): Promise<ConversationLog[]> {
  await initDb();
  const limit = params.limit || 60;
  let conditions: string[] = [];
  let args: any[] = [];

  if (params.sentiment) {
    conditions.push("sentiment = ?");
    args.push(params.sentiment);
  }

  if (params.needsHuman !== undefined) {
    conditions.push("needsHuman = ?");
    args.push(params.needsHuman ? 1 : 0);
  }

  if (params.language) {
    conditions.push("(detectedLanguage LIKE ? OR languageCode = ?)");
    args.push(`%${params.language}%`, params.language);
  }

  if (params.search) {
    conditions.push("(messageText LIKE ? OR reply LIKE ? OR senderId LIKE ? OR leadName LIKE ? OR intent LIKE ?)");
    const query = `%${params.search}%`;
    args.push(query, query, query, query, query);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT * FROM logs ${whereClause} ORDER BY id DESC LIMIT ?`;
  args.push(limit);

  const res = await db.execute({ sql, args });
  return res.rows.map(mapRowToLog);
}

export async function getConversation(id: number): Promise<ConversationLog | null> {
  await initDb();
  const res = await db.execute({
    sql: `SELECT * FROM logs WHERE id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return mapRowToLog(res.rows[0]);
}

export async function addAgentReply(id: number, agentReply: string): Promise<boolean> {
  await initDb();
  const agentRepliedAt = new Date().toISOString();
  const res = await db.execute({
    sql: `UPDATE logs SET agentReply = ?, agentRepliedAt = ?, isResolved = 1 WHERE id = ?`,
    args: [agentReply, agentRepliedAt, id],
  });
  return (res.rowsAffected || 0) > 0;
}

export async function toggleResolveHandoff(id: number, isResolved: boolean): Promise<boolean> {
  await initDb();
  const res = await db.execute({
    sql: `UPDATE logs SET isResolved = ? WHERE id = ?`,
    args: [isResolved ? 1 : 0, id],
  });
  return (res.rowsAffected || 0) > 0;
}

export async function getLeads(): Promise<ConversationLog[]> {
  await initDb();
  const res = await db.execute(`
    SELECT * FROM logs
    WHERE (leadName != '' OR leadPhone != '' OR leadEmail != '' OR leadCompany != '')
    ORDER BY id DESC
  `);
  return res.rows.map(mapRowToLog);
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  await initDb();
  const totalRows = await db.execute(`SELECT * FROM logs ORDER BY id DESC LIMIT 500`);
  const logs = totalRows.rows.map(mapRowToLog);

  const totalConversations = logs.length;
  let totalHandoffs = 0;
  let resolvedHandoffs = 0;
  let totalLatency = 0;
  let totalLeads = 0;

  const sentimentBreakdown: Record<Sentiment, number> = {
    happy: 0,
    neutral: 0,
    confused: 0,
    angry: 0,
    urgent: 0,
  };

  const languageBreakdown: Record<string, number> = {};
  const intentBreakdown: Record<string, number> = {};

  for (const log of logs) {
    if (log.needsHuman) {
      totalHandoffs++;
      if (log.isResolved) resolvedHandoffs++;
    }

    if (log.leadName || log.leadPhone || log.leadEmail || log.leadCompany) {
      totalLeads++;
    }

    totalLatency += log.latencyMs || 0;

    const s = log.sentiment as Sentiment;
    if (sentimentBreakdown[s] !== undefined) {
      sentimentBreakdown[s]++;
    } else {
      sentimentBreakdown.neutral++;
    }

    const lang = log.detectedLanguage || "English";
    languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;

    const intent = log.intent || "general_inquiry";
    intentBreakdown[intent] = (intentBreakdown[intent] || 0) + 1;
  }

  const pendingHandoffs = totalHandoffs - resolvedHandoffs;
  const resolutionRatePct = totalConversations
    ? Math.round(((totalConversations - pendingHandoffs) / totalConversations) * 100)
    : 100;

  const avgLatencyMs = totalConversations ? Math.round(totalLatency / totalConversations) : 0;

  return {
    totalConversations,
    totalHandoffs,
    resolvedHandoffs,
    pendingHandoffs,
    resolutionRatePct,
    totalLeads,
    avgLatencyMs,
    sentimentBreakdown,
    languageBreakdown,
    intentBreakdown,
  };
}

export async function clearLogs(): Promise<void> {
  await initDb();
  await db.execute(`DELETE FROM logs`);
}

function mapRowToLog(r: any): ConversationLog {
  return {
    id: Number(r.id),
    senderId: String(r.senderId || ""),
    pageId: String(r.pageId || ""),
    messageText: String(r.messageText || ""),
    reply: String(r.reply || ""),
    detectedLanguage: String(r.detectedLanguage || "English"),
    languageCode: String(r.languageCode || "en"),
    sentiment: (r.sentiment as Sentiment) || "neutral",
    intent: String(r.intent || "general_inquiry"),
    needsHuman: !!r.needsHuman,
    isResolved: !!r.isResolved,
    agentReply: String(r.agentReply || ""),
    agentRepliedAt: String(r.agentRepliedAt || ""),
    source: (r.source as any) || "webhook",
    leadName: String(r.leadName || ""),
    leadPhone: String(r.leadPhone || ""),
    leadEmail: String(r.leadEmail || ""),
    leadLocation: String(r.leadLocation || ""),
    leadInterest: String(r.leadInterest || ""),
    leadBudget: String(r.leadBudget || ""),
    leadCompany: String(r.leadCompany || ""),
    latencyMs: Number(r.latencyMs || 0),
    createdAt: String(r.createdAt || new Date().toISOString()),
  };
}
