import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/lib/mood-lock";
import { getSettings, redactSettings, saveSettings } from "@/lib/settings";
import { isMoodId, moodMeta, providerMeta } from "@/lib/settings-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    settings: redactSettings(settings),
    engine: {
      provider: providerMeta(settings.provider.id).label,
      model: settings.provider.model,
      live: providerMeta(settings.provider.id).dialect !== "none" && !!settings.provider.apiKey,
    },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a settings object" }, { status: 400 });
  }

  // A locked mood can only be selected by a browser that passed the password.
  const requestedMood = body?.persona?.mood;
  if (
    typeof requestedMood === "string" &&
    isMoodId(requestedMood) &&
    moodMeta(requestedMood).locked &&
    !isUnlocked()
  ) {
    return NextResponse.json({ error: "This mood is locked", locked: true }, { status: 403 });
  }

  try {
    const saved = await saveSettings(body);
    return NextResponse.json({
      ok: true,
      settings: redactSettings(saved),
      engine: {
        provider: providerMeta(saved.provider.id).label,
        model: saved.provider.model,
        live: providerMeta(saved.provider.id).dialect !== "none" && !!saved.provider.apiKey,
      },
    });
  } catch (err: any) {
    console.error("Settings save failed:", err);
    return NextResponse.json(
      { error: String(err?.message || "Could not save settings") },
      { status: 500 }
    );
  }
}
