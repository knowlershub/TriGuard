/**
 * Thin wrapper around the WhatsApp Cloud API's /messages endpoint.
 * Needs two env vars:
 *   WHATSAPP_ACCESS_TOKEN   — permanent or temp token from Meta for Developers
 *   WHATSAPP_PHONE_NUMBER_ID — the "Phone number ID" (not the phone number itself)
 *                              shown in your WhatsApp app's API setup page
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error(
      "[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID — cannot send reply."
    );
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    // Don't throw — a failed reply shouldn't crash the webhook handler and
    // cause WhatsApp to retry-storm us. Log it so it's visible, move on.
    const body = await res.text().catch(() => "");
    console.error(`[whatsapp] Failed to send message (${res.status}): ${body}`);
  }
}