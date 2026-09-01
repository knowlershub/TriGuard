import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/users";
import { parseCommand, routeCommand } from "@/lib/commandRouter";
import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { handleReceiptImage } from "@/lib/handlers/receiptOcr";
import { downloadWhatsAppMedia } from "@/lib/whatsappMedia";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * GET — Meta's one-time webhook verification handshake.
 * When you register this URL in the Meta for Developers dashboard, Meta
 * sends a GET with hub.mode/hub.verify_token/hub.challenge. We must echo
 * back hub.challenge if the token matches WHATSAPP_VERIFY_TOKEN, or Meta
 * refuses to save the webhook.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST — actual incoming messages/events from WhatsApp.
 *
 * Important: WhatsApp's webhook payload also includes things that aren't
 * user messages (delivery receipts, read receipts, status updates). We only
 * act on `messages` — text goes through command routing / SMS forwarding,
 * images go through the OCR pipeline, everything else gets a friendly
 * "not supported yet" reply.
 *
 * We always return 200 quickly, even on errors — WhatsApp interprets
 * non-200 as "retry this delivery," and a bug in our handler shouldn't
 * cause the same message to be redelivered repeatedly.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) {
      // Status update / read receipt / etc — nothing to do.
      return NextResponse.json({ status: "ignored" });
    }
    const from: string = message.from; // sender's WhatsApp ID (phone number, no "+")

    if (message.type === "image") {
      const user = await getOrCreateUser("whatsapp", from);
      const mediaId = message.image?.id;
      if (!mediaId) {
        await sendWhatsAppMessage(from, "Couldn't read that image — try sending it again.");
        return NextResponse.json({ status: "missing_media_id" });
      }
      const imageBuffer = await downloadWhatsAppMedia(mediaId);
      if (!imageBuffer) {
        await sendWhatsAppMessage(from, "Couldn't download that image — try sending it again.");
        return NextResponse.json({ status: "download_failed" });
      }
      const reply = await handleReceiptImage(user.id, imageBuffer);
      await sendWhatsAppMessage(from, reply);
      return NextResponse.json({ status: "ok" });
    }

    if (message.type !== "text") {
      await sendWhatsAppMessage(
        from,
        "I can only read text and receipt photos right now — voice notes are coming soon."
      );
      return NextResponse.json({ status: "unsupported_type" });
    }

    const text: string = message.text?.body ?? "";
    const user = await getOrCreateUser("whatsapp", from);
    const parsed = parseCommand(text);
    const reply = parsed
      ? await routeCommand(user.id, parsed)
      : await handleForwardedSms(user.id, text);
    await sendWhatsAppMessage(from, reply);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[whatsapp webhook] Error handling message:", err);
    // Still 200 — see comment above about avoiding retry storms.
    return NextResponse.json({ status: "error" });
  }
}