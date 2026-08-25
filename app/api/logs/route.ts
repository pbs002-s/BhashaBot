import { NextRequest, NextResponse } from "next/server";
import { listLogs, getAnalytics } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const sentiment = searchParams.get("sentiment") || undefined;
  const language = searchParams.get("language") || undefined;
  const needsHumanParam = searchParams.get("needsHuman");
  const limitParam = searchParams.get("limit");

  const needsHuman =
    needsHumanParam === "true" ? true : needsHumanParam === "false" ? false : undefined;
  const limit = limitParam ? parseInt(limitParam, 10) : 60;

  const [logs, analytics] = await Promise.all([
    listLogs({ limit, search, sentiment, language, needsHuman }),
    getAnalytics(),
  ]);

  const stats = {
    total: analytics.totalConversations,
    handoffs: analytics.totalHandoffs,
    resolvedByAiPct: analytics.resolutionRatePct,
    avgLatencyMs: analytics.avgLatencyMs,
    pendingHandoffs: analytics.pendingHandoffs,
    totalLeads: analytics.totalLeads,
  };

  return NextResponse.json({ logs, stats, analytics });
}
