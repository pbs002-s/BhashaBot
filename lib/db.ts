import { createClient } from "@libsql/client";
import type { ConversationLog } from "./types";

// Free, open-source SQLite (libSQL). Locally it just writes to a file.
// In production point TURSO_DATABASE_URL / TURSO_AUTH_TOKEN at a free
// Turso database (https://turso.tech) and the exact same code works
// on serverless hosts like Vercel where the local filesystem is reset
// between requests.
const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient(
  authToken ? { url, authToken } : { url }
);

let ready: Promise<void> | null = null;

export function initDb() {
  if (!ready) {
    ready = db.execute(`
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
    `).then(() => undefined);
  }
  return ready;
}

export async function insertLog(row: Omit<ConversationLog, "id" | "createdAt">) {
  await initDb();
  const createdAt = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO logs
      (senderId, pageId, messageText, reply, detectedLanguage, languageCode,
       sentiment, intent, needsHuman, leadName, leadPhone, leadEmail,
       leadLocation, leadInterest, leadBudget, leadCompany, latencyMs, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.senderId, row.pageId, row.messageText, row.reply,
      row.detectedLanguage, row.languageCode, row.sentiment, row.intent,
      row.needsHuman ? 1 : 0, row.leadName, row.leadPhone, row.leadEmail,
      row.leadLocation, row.leadInterest, row.leadBudget, row.leadCompany,
      row.latencyMs, createdAt,
    ],
  });
}

export async function listLogs(limit = 50): Promise<ConversationLog[]> {
  await initDb();
  const res = await db.execute({
    sql: `SELECT * FROM logs ORDER BY id DESC LIMIT ?`,
    args: [limit],
  });
  return res.rows.map((r: any) => ({
    id: r.id,
    senderId: r.senderId,
    pageId: r.pageId,
    messageText: r.messageText,
    reply: r.reply,
    detectedLanguage: r.detectedLanguage,
    languageCode: r.languageCode,
    sentiment: r.sentiment,
    intent: r.intent,
    needsHuman: !!r.needsHuman,
    leadName: r.leadName,
    leadPhone: r.leadPhone,
    leadEmail: r.leadEmail,
    leadLocation: r.leadLocation,
    leadInterest: r.leadInterest,
    leadBudget: r.leadBudget,
    leadCompany: r.leadCompany,
    latencyMs: r.latencyMs,
    createdAt: r.createdAt,
  }));
}

export async function getStats() {
  await initDb();
  const total = await db.execute(`SELECT COUNT(*) as c FROM logs`);
  const handoffs = await db.execute(`SELECT COUNT(*) as c FROM logs WHERE needsHuman = 1`);
  const avgLatency = await db.execute(`SELECT AVG(latencyMs) as a FROM logs`);
  const totalCount = Number((total.rows[0] as any).c) || 0;
  const handoffCount = Number((handoffs.rows[0] as any).c) || 0;
  return {
    total: totalCount,
    handoffs: handoffCount,
    resolvedByAiPct: totalCount ? Math.round(((totalCount - handoffCount) / totalCount) * 100) : 100,
    avgLatencyMs: Math.round(Number((avgLatency.rows[0] as any).a) || 0),
  };
}
