import { NextResponse } from "next/server";
import { listLogs, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [logs, stats] = await Promise.all([listLogs(50), getStats()]);
  return NextResponse.json({ logs, stats });
}
