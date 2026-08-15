import { NextRequest, NextResponse } from "next/server";

// Demo helper: fires a realistic fake Messenger event straight into the
// webhook so the dashboard can be seen live without a real Facebook Page.
const SAMPLES = [
  "Hi! Price koto for the blue one?",
  "আমি অর্ডার করতে চাই, delivery koto din lagbe?",
  "This is unacceptable, I want a refund NOW!",
  "Hello, do you ship to Chattogram?",
  "Thanks so much, that was super helpful!",
  "My payment failed twice, please help urgently.",
];

export async function POST(req: NextRequest) {
  const text = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  const origin = new URL(req.url).origin;

  const fakeEvent = {
    entry: [
      {
        id: "demo-page-001",
        messaging: [
          {
            sender: { id: `demo-user-${Math.floor(Math.random() * 9000 + 1000)}` },
            message: { text },
          },
        ],
      },
    ],
  };

  await fetch(`${origin}/api/messenger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fakeEvent),
  });

  return NextResponse.json({ ok: true });
}
