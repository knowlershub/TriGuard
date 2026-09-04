const TELEGRAM_API =
  "https://api.telegram.org";

const MAX_TELEGRAM_IMAGE_SIZE =
  10 * 1024 * 1024;

export async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<void> {
  const token =
    process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error(
      "[telegram] Missing TELEGRAM_BOT_TOKEN — cannot send reply."
    );
    return;
  }

  const res = await fetch(
    `${TELEGRAM_API}/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );

  if (!res.ok) {
    const body =
      await res.text().catch(
        () => ""
      );

    console.error(
      `[telegram] Failed to send message (${res.status}): ${body}`
    );
  }
}

export async function downloadTelegramPhoto(
  fileId: string
): Promise<Buffer | null> {
  if (
    typeof fileId !== "string" ||
    !fileId.trim()
  ) {
    console.error(
      "[telegram] Invalid file_id."
    );

    return null;
  }

  const token =
    process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error(
      "[telegram] Missing TELEGRAM_BOT_TOKEN."
    );

    return null;
  }

  const fileRes =
    await fetch(
      `${TELEGRAM_API}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
    );

  if (!fileRes.ok) {
    console.error(
      `[telegram] getFile failed (${fileRes.status})`
    );

    return null;
  }

  const fileData =
    await fileRes.json().catch(
      () => null
    );

  const filePath =
    fileData?.result?.file_path;

  if (
    typeof filePath !== "string" ||
    !filePath
  ) {
    console.error(
      "[telegram] getFile response had no valid file_path."
    );

    return null;
  }

  const downloadRes =
    await fetch(
      `${TELEGRAM_API}/file/bot${token}/${filePath}`
    );

  if (!downloadRes.ok) {
    console.error(
      `[telegram] File download failed (${downloadRes.status})`
    );

    return null;
  }

  const contentLength =
    downloadRes.headers.get(
      "content-length"
    );

  if (
    contentLength &&
    Number(contentLength) >
      MAX_TELEGRAM_IMAGE_SIZE
  ) {
    console.warn(
      "[telegram] Telegram image exceeds size limit."
    );

    return null;
  }

  const arrayBuffer =
    await downloadRes.arrayBuffer();

  if (
    arrayBuffer.byteLength >
    MAX_TELEGRAM_IMAGE_SIZE
  ) {
    console.warn(
      "[telegram] Downloaded Telegram image exceeds size limit."
    );

    return null;
  }

  return Buffer.from(
    arrayBuffer
  );
}
