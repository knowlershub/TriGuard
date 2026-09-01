const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN — cannot send reply.");
    return;
  }

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[telegram] Failed to send message (${res.status}): ${body}`);
  }
}

/**
 * Downloads a photo given a Telegram file_id. Two-step, like WhatsApp's
 * media download: getFile to resolve a temporary path, then fetch the
 * actual bytes from Telegram's file server.
 */
export async function downloadTelegramPhoto(fileId: string): Promise<Buffer | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN.");
    return null;
  }

  const fileRes = await fetch(`${TELEGRAM_API}/bot${token}/getFile?file_id=${fileId}`);
  if (!fileRes.ok) {
    console.error(`[telegram] getFile failed (${fileRes.status})`);
    return null;
  }

  const fileData = await fileRes.json();
  const filePath = fileData?.result?.file_path;
  if (!filePath) {
    console.error("[telegram] getFile response had no file_path.");
    return null;
  }

  const downloadRes = await fetch(`${TELEGRAM_API}/file/bot${token}/${filePath}`);
  if (!downloadRes.ok) {
    console.error(`[telegram] File download failed (${downloadRes.status})`);
    return null;
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}