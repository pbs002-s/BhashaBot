// Sends replies back to the user via the Facebook Graph API.
export async function sendMessengerReply(recipientId: string, text: string): Promise<boolean> {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) {
    // skip silently in demo/local mode (no Facebook Page connected)
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Messenger send failed:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Messenger send network exception:", err);
    return false;
  }
}
