import { NextRequest, NextResponse } from "next/server";
import { toggleResolveHandoff } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const isResolved = body.isResolved !== false;

  const success = await toggleResolveHandoff(id, isResolved);
  return NextResponse.json({ ok: success, isResolved });
}
