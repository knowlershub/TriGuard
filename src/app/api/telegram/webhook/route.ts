import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/users";
import { parseCommand, routeCommand } from "@/lib/commandRouter";
import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { handleReceiptImage } from "@/lib/handlers/receiptOcr";
import { sendTelegramMessage, downloadTelegramPhoto } from "@/lib/telegram";

/**
 * POST /api/telegram/webhook
 *
 * Unlike WhatsApp, Telegram has no GET verification handshake — you just
 * register this URL once via a setWebhook API call, and Telegram starts
 * POSTing updates here directly.
 *
 * Same routing logic as the WhatsApp webhook: /commands go through
 * commandRouter, plain text is tried as a forwarded bank SMS, and photos
 * go through the same OCR pipeline — just with Telegram's own message
 * shape and its own media download method.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  try {
    const message = body?.message;
    if (!message) {
      // Non-message updates (edited_message, channel_post, etc.) — ignore.
      return NextResponse.json({ status: "ignored" });
    }

    const chatId: number = message.chat.id;
    const telegramUserId: string = String(message.from.id);

    if (message.photo) {
      const user = await getOrCreateUser("telegram", telegramUserId);
      // Telegram sends multiple resolutions of the same photo; the last
      // entry in the array is the largest/highest quality.
      const largestPhoto = message.photo[message.photo.length - 1];

      const imageBuffer = await downloadTelegramPhoto(largestPhoto.file_id);
      if (!imageBuffer) {
        await sendTelegramMessage(chatId, "Couldn't download that image — try sending it again.");
        return NextResponse.json({ status: "download_failed" });
      }

      const reply = await handleReceiptImage(user.id, imageBuffer);
      await sendTelegramMessage(chatId, reply);
      return NextResponse.json({ status: "ok" });
    }

    if (!message.text) {
      await sendTelegramMessage(
        chatId,
        "I can only read text and receipt photos right now — voice notes are coming soon."
      );
      return NextResponse.json({ status: "unsupported_type" });
    }

    const user = await getOrCreateUser("telegram", telegramUserId);
    const parsed = parseCommand(message.text);

    const reply = parsed
      ? await routeCommand(user.id, parsed)
      : await handleForwardedSms(user.id, message.text);

    await sendTelegramMessage(chatId, reply);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[telegram webhook] Error handling message:", err);
    return NextResponse.json({ status: "error" });
  }
}