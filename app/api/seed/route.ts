import { NextRequest, NextResponse } from "next/server";

// Realistic multilingual test events showcasing languages, sentiment, lead capture, and escalations
const SAMPLE_MESSAGES = [
  // 1. Banglish Price & Delivery with Location
  {
    text: "Hi! Bhasha Smart Watch er price koto? Ami Chattogram theke order korte chai, delivery fee koto?",
    sender: "demo-user-nafis",
  },
  // 2. Pure Bengali order with lead details
  {
    text: "আমি পালস ইয়ারবাড ২টা অর্ডার করতে চাই। আমার নাম তানভীর আহমেদ, মোবাইল: 01711223344, ঠিকানা: ধানমন্ডি ২৭, ঢাকা।",
    sender: "demo-user-tanvir",
  },
  // 3. Banglish Escalation / Complaint
  {
    text: "Ami 3 din age order koresilam kintu ekhono delivery painai! Return & refund chai ASAP!",
    sender: "demo-user-shakil",
  },
  // 4. English Lead Capture with Budget & Email
  {
    text: "Hello! My name is Sarah Jenkins from TechNova Corp. We want to purchase 15 units of the 65W GaN Charger for our office. Our budget is around $250. Email me at sarah@technovacorp.io",
    sender: "demo-user-sarah",
  },
  // 5. Hindi inquiry
  {
    text: "नमस्ते! क्या आपके पास स्मार्ट वॉच का ब्लैक कलर उपलब्ध है? इसकी कीमत कितनी है?",
    sender: "demo-user-rohit",
  },
  // 6. Bengali warranty query
  {
    text: "আপনাদের প্রোডাক্টে কতদিনের ওয়ারেন্টি আছে এবং ক্যাশ অন ডেলিভারি দেওয়া যাবে কি?",
    sender: "demo-user-mita",
  },
  // 7. Spanish general query
  {
    text: "Hola, me gustaría saber si hacen envíos internacionales y cuál es el costo de envío.",
    sender: "demo-user-carlos",
  },
  // 8. Urgent payment problem
  {
    text: "My bKash payment was deducted twice for order #9821. Please connect me with a human agent urgently!",
    sender: "demo-user-farhan",
  },
  // 9. Happy customer feedback
  {
    text: "Got the earbuds today! Sound quality is exceptional. Thank you so much for the super fast delivery!",
    sender: "demo-user-anika",
  },
];

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const sample = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];

  const fakeEvent = {
    entry: [
      {
        id: "bhashabot-page-01",
        messaging: [
          {
            sender: { id: `${sample.sender}-${Math.floor(Math.random() * 899 + 100)}` },
            message: { text: sample.text },
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

  return NextResponse.json({ ok: true, sample });
}
