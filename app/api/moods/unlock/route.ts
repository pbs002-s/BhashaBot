import { NextRequest, NextResponse } from "next/server";
import {
  UNLOCK_COOKIE,
  checkPassword,
  isUnlocked,
  mintToken,
  usingFallbackPassword,
} from "@/lib/mood-lock";

export const dynamic = "force-dynamic";

/** Has this browser already unlocked the private persona mood? */
export async function GET() {
  return NextResponse.json({ unlocked: isUnlocked(), usingDefaultPassword: usingFallbackPassword() });
}

/** Exchange the mood password for a short-lived signed cookie. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    // Deliberately vague, and slow enough that guessing over the network is dull.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = mintToken();
  const res = NextResponse.json({ ok: true, unlocked: true });
  res.cookies.set(UNLOCK_COOKIE, token.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.maxAge,
  });
  return res;
}

/** Lock it again. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true, unlocked: false });
  res.cookies.set(UNLOCK_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
