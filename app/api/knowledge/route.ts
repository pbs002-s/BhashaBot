import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfile, updateBusinessProfile } from "@/lib/knowledge";

export async function GET() {
  const profile = getBusinessProfile();
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const updated = updateBusinessProfile(body);
  return NextResponse.json({ ok: true, profile: updated });
}
