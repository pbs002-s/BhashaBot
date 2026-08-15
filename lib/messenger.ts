// Sends the AI-generated reply back to the user via the Facebook
// Graph API (free — requires a Meta developer app + Page access token).
export async function sendMessengerReply(recipientId: string, text: string) {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return; // skip silently in demo mode (no Page connected yet)

  await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  }).catch((err) => console.error("Messenger send failed:", err));
}
