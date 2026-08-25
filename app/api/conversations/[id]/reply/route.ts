import { NextRequest, NextResponse } from "next/server";
import { addAgentReply, getConversation } from "@/lib/db";
import { sendMessengerReply } from "@/lib/messenger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const replyText = (body.reply || "").trim();

  if (!replyText) {
    return NextResponse.json({ error: "Reply text cannot be empty" }, { status: 400 });
  }

  const conv = await getConversation(id);
  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const success = await addAgentReply(id, replyText);

  // If connected to Facebook Messenger, send the manual human reply back to the user
  if (conv.senderId && !conv.senderId.startsWith("demo-") && !conv.senderId.startsWith("sim-")) {
    await sendMessengerReply(conv.senderId, replyText);
  }

  return NextResponse.json({
    ok: success,
    message: "Agent reply sent and conversation marked as resolved",
  });
}
