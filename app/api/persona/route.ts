import { NextResponse } from "next/server";
import { isUnlocked } from "@/lib/mood-lock";
import { personaSummary } from "@/lib/persona-pack";

export const dynamic = "force-dynamic";

/**
 * Counts and style statistics for the trained persona mood. Numbers only —
 * the learned chat lines themselves never leave the server, and even the
 * numbers need the mood password.
 */
export async function GET() {
  if (!isUnlocked()) {
    return NextResponse.json({ error: "This mood is locked", locked: true }, { status: 403 });
  }
  return NextResponse.json({ ok: true, persona: personaSummary() });
}
