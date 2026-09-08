import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getOrCreateUser } from "@/lib/users";
import {
  parseCommand,
  routeCommand,
} from "@/lib/commandRouter";
import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { handleReceiptImage } from "@/lib/handlers/receiptOcr";
import {
  downloadWhatsAppMedia,
} from "@/lib/whatsappMedia";
import {
  sendWhatsAppMessage,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

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

  const providedHex =
    signature.slice("sha256=".length);

  if (!/^[0-9a-f]{64}$/i.test(providedHex)) {
    return false;
  }

  const expectedHex =
    createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

  const providedBuffer =
    Buffer.from(providedHex, "hex");

  const expectedBuffer =
    Buffer.from(expectedHex, "hex");

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
  const mode =
    req.nextUrl.searchParams.get(
      "hub.mode"
    );

  const token =
    req.nextUrl.searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    req.nextUrl.searchParams.get(
      "hub.challenge"
    );

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    expectedToken &&
    token === expectedToken &&
    challenge
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

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          status: "invalid_json",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const payload =
      body as Record<string, unknown>;

    const entry =
      Array.isArray(payload.entry)
        ? payload.entry[0]
        : null;

    if (
      !entry ||
      typeof entry !== "object"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const changesValue =
      (entry as Record<string, unknown>)
        .changes;

    const changes: unknown[] =
      Array.isArray(changesValue)
        ? changesValue
        : [];

    const change =
      changes[0];

    if (
      !change ||
      typeof change !== "object"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const changeValue =
      (change as Record<
        string,
        unknown
      >).value;

    if (
      !changeValue ||
      typeof changeValue !== "object"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const value =
      changeValue as Record<
        string,
        unknown
      >;

    /*
     * WhatsApp sends message-status events and
     * other notifications through the same webhook.
     * Those are not user messages and should be
     * acknowledged without attempting to process them.
     */
    const messages =
      Array.isArray(value.messages)
        ? value.messages
        : [];

    const message =
      messages[0];

    if (
      !message ||
      typeof message !== "object"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const incomingMessage =
      message as Record<
        string,
        unknown
      >;

    const from =
      typeof incomingMessage.from ===
      "string"
        ? incomingMessage.from.trim()
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

    const messageType =
      typeof incomingMessage.type ===
      "string"
        ? incomingMessage.type
        : "";

    if (messageType === "image") {
      const user =
        await getOrCreateUser(
          "whatsapp",
          from
        );

      const image =
        incomingMessage.image;

      const imagePayload =
        image &&
        typeof image === "object"
          ? image as Record<
              string,
              unknown
            >
          : null;

      const mediaId =
        typeof imagePayload?.id ===
        "string"
          ? imagePayload.id.trim()
          : "";

      if (!mediaId) {
        await sendWhatsAppMessage(
          from,
          "Couldn't read that image. Please send the receipt photo again."
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
          "I couldn't download that receipt. Please send a clearer or smaller image and try again."
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

    if (messageType !== "text") {
      await sendWhatsAppMessage(
        from,
        "I can currently read text messages and receipt photos. Voice notes and other media types aren't supported yet."
      );

      return NextResponse.json({
        status: "unsupported_type",
      });
    }

    const textPayload =
      incomingMessage.text;

    const textObject =
      textPayload &&
      typeof textPayload === "object"
        ? textPayload as Record<
            string,
            unknown
          >
        : null;

    const text =
      typeof textObject?.body ===
      "string"
        ? textObject.body.trim()
        : "";

    if (!text) {
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

    const reply =
      parsed
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
  } catch (error) {
    console.error(
      "[whatsapp webhook] Error handling message:",
      error
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
