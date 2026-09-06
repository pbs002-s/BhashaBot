import { getSettings } from "./settings";

/** Sends a reply back through the Meta Graph API when a Page is connected. */
export async function sendMessengerReply(recipientId: string, text: string): Promise<boolean> {
  const { channels } = await getSettings();
  const token = channels.fbPageAccessToken;

  // No Page connected: the desk still logs and drafts, it just does not deliver.
  if (!token) return false;

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
      console.error("Messenger send failed:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Messenger send request failed:", err);
    return false;
  }
}
