import { NextRequest, NextResponse } from "next/server";
import { testProviderConnection } from "@/lib/ai";
import { getSettings } from "@/lib/settings";
import { alertHumanHandoff } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/**
 * Fires a real request at whatever is configured, so a wrong key fails here
 * rather than silently in front of a customer.
 * body: { target: "provider" | "telegram" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const target = body.target === "telegram" ? "telegram" : "provider";
  const settings = await getSettings();

  if (target === "telegram") {
    const result = await alertHumanHandoff({
      sentiment: "urgent",
      intent: "connection_test",
      senderId: "settings-panel",
      pageId: "settings-panel",
      messageText: "This is a test alert from your BhashaBot settings page.",
      detectedLanguage: "English",
      escalationReason: "Manual connection test",
    });
    return NextResponse.json({
      ok: result.ok,
      error: result.ok
        ? undefined
        : result.reason === "not_configured"
        ? "No bot token or chat id stored"
        : "Telegram rejected the message",
    });
  }

  const result = await testProviderConnection(settings);
  return NextResponse.json(result);
}
