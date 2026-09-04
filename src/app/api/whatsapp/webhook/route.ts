import { createHmac, timingSafeEqual } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getOrCreateUser } from "@/lib/users";
import {
  parseCommand,
  routeCommand,
} from "@/lib/commandRouter";
import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { handleReceiptImage } from "@/lib/handlers/receiptOcr";
import { downloadWhatsAppMedia } from "@/lib/whatsappMedia";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const appSecret =
    process.env.WHATSAPP_APP_SECRET;

  if (!appSecret || !signature) {
    return false;
  }

  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const providedSignature =
    signature.slice("sha256=".length);

  const expectedSignature =
    createHmac(
      "sha256",
      appSecret
    )
      .update(rawBody)
      .digest("hex");

  const providedBuffer =
    Buffer.from(providedSignature, "hex");

  const expectedBuffer =
    Buffer.from(expectedSignature, "hex");

  if (
    providedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    providedBuffer,
    expectedBuffer
  );
}

export async function GET(
  req: NextRequest
) {
  const params =
    req.nextUrl.searchParams;

  const mode =
    params.get("hub.mode");

  const token =
    params.get("hub.verify_token");

  const challenge =
    params.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token ===
      process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(
      challenge,
      {
        status: 200,
      }
    );
  }

  return new NextResponse(
    "Forbidden",
    {
      status: 403,
    }
  );
}

export async function POST(
  req: NextRequest
) {
  try {
    const rawBody =
      await req.text();

    const signature =
      req.headers.get(
        "x-hub-signature-256"
      );

    if (
      !verifyWhatsAppSignature(
        rawBody,
        signature
      )
    ) {
      console.warn(
        "[whatsapp webhook] Invalid signature."
      );

      return new NextResponse(
        "Forbidden",
        {
          status: 403,
        }
      );
    }

    const body =
      JSON.parse(rawBody);

    const entry =
      body?.entry?.[0];

    const change =
      entry?.changes?.[0]?.value;

    const message =
      change?.messages?.[0];

    if (!message) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const from =
      typeof message.from === "string"
        ? message.from
        : "";

    if (!from) {
      return NextResponse.json(
        {
          status: "invalid_message",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.type === "image"
    ) {
      const user =
        await getOrCreateUser(
          "whatsapp",
          from
        );

      const mediaId =
        message.image?.id;

      if (!mediaId) {
        await sendWhatsAppMessage(
          from,
          "Couldn't read that image — try sending it again."
        );

        return NextResponse.json({
          status: "missing_media_id",
        });
      }

      const imageBuffer =
        await downloadWhatsAppMedia(
          mediaId
        );

      if (!imageBuffer) {
        await sendWhatsAppMessage(
          from,
          "Couldn't download that image — try sending it again."
        );

        return NextResponse.json({
          status: "download_failed",
        });
      }

      const reply =
        await handleReceiptImage(
          user.id,
          imageBuffer
        );

      await sendWhatsAppMessage(
        from,
        reply
      );

      return NextResponse.json({
        status: "ok",
      });
    }

    if (
      message.type !== "text"
    ) {
      await sendWhatsAppMessage(
        from,
        "I can only read text and receipt photos right now — voice notes are coming soon."
      );

      return NextResponse.json({
        status: "unsupported_type",
      });
    }

    const text =
      typeof message.text?.body ===
      "string"
        ? message.text.body
        : "";

    if (!text.trim()) {
      return NextResponse.json({
        status: "empty_message",
      });
    }

    const user =
      await getOrCreateUser(
        "whatsapp",
        from
      );

    const parsed =
      parseCommand(text);

    const reply = parsed
      ? await routeCommand(
          user.id,
          parsed
        )
      : await handleForwardedSms(
          user.id,
          text
        );

    await sendWhatsAppMessage(
      from,
      reply
    );

    return NextResponse.json({
      status: "ok",
    });
  } catch (err) {
    console.error(
      "[whatsapp webhook] Error handling message:",
      err
    );

    return NextResponse.json(
      {
        status: "error",
      },
      {
        status: 500,
      }
    );
  }
}
