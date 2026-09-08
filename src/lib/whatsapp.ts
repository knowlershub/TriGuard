const WHATSAPP_GRAPH_VERSION = "v20.0";

function getWhatsAppConfig() {
  const token =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return null;
  }

  return {
    token,
    phoneNumberId,
  };
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<boolean> {
  const config = getWhatsAppConfig();

  if (!config) {
    console.error(
      "[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID."
    );
    return false;
  }

  if (
    typeof to !== "string" ||
    !to.trim()
  ) {
    console.error(
      "[whatsapp] Invalid recipient."
    );
    return false;
  }

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    console.error(
      "[whatsapp] Refusing to send an empty message."
    );
    return false;
  }

  const messageText =
    text.length > 4096
      ? `${text.slice(0, 4093)}...`
      : text;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${encodeURIComponent(
        config.phoneNumberId
      )}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: messageText,
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const body =
        await response.text().catch(() => "");

      console.error(
        `[whatsapp] Failed to send message (${response.status}): ${body}`
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[whatsapp] Send message error:",
      error
    );

    return false;
  }
}
