import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/users";
import {
  parseCommand,
  routeCommand,
} from "@/lib/commandRouter";
import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { handleReceiptImage } from "@/lib/handlers/receiptOcr";
import {
  sendTelegramMessage,
  downloadTelegramPhoto,
} from "@/lib/telegram";

async function handleTelegramStart(
  chatId: string | number,
  telegramUserId: string,
  text: string
): Promise<boolean> {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);

  if (!match) {
    return false;
  }

  const code = match[1]?.trim();

  if (!code) {
    await sendTelegramMessage(
      chatId,
      "Welcome to TriGuard. To connect this Telegram account, use the Connect Telegram button in your TriGuard Settings."
    );

    return true;
  }

  const linkCode = await prisma.telegramLinkCode.findUnique({
    where: {
      code,
    },
    select: {
      code: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!linkCode) {
    await sendTelegramMessage(
      chatId,
      "That TriGuard connection link is invalid. Please generate a new link from Settings."
    );

    return true;
  }

  if (linkCode.usedAt) {
    await sendTelegramMessage(
      chatId,
      "That TriGuard connection link has already been used. Please generate a new link from Settings."
    );

    return true;
  }

  if (linkCode.expiresAt.getTime() <= Date.now()) {
    await sendTelegramMessage(
      chatId,
      "That TriGuard connection link has expired. Please generate a new link from Settings."
    );

    return true;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.telegramLinkCode.updateMany({
        where: {
          code: linkCode.code,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new Error("TELEGRAM_LINK_CODE_ALREADY_CLAIMED");
      }

      await tx.user.update({
        where: {
          id: linkCode.userId,
        },
        data: {
          telegramId: telegramUserId,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "TELEGRAM_LINK_CODE_ALREADY_CLAIMED"
    ) {
      await sendTelegramMessage(
        chatId,
        "That TriGuard connection link is no longer available. Please generate a new link from Settings."
      );

      return true;
    }

    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      await sendTelegramMessage(
        chatId,
        "This Telegram account is already connected to another TriGuard account."
      );

      return true;
    }

    throw error;
  }

  await sendTelegramMessage(
    chatId,
    "Telegram connected successfully. You can now send expenses, receipts, and commands to TriGuard here."
  );

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret =
      process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "[telegram webhook] TELEGRAM_WEBHOOK_SECRET is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Telegram webhook is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const providedSecret =
      req.headers.get(
        "x-telegram-bot-api-secret-token"
      );

    if (
      !providedSecret ||
      providedSecret !== webhookSecret
    ) {
      console.warn(
        "[telegram webhook] Invalid webhook secret."
      );

      return new NextResponse(
        "Forbidden",
        {
          status: 403,
        }
      );
    }

    const body =
      await req.json().catch(
        () => null
      );

    if (!body) {
      return NextResponse.json(
        {
          status: "invalid_json",
        },
        {
          status: 400,
        }
      );
    }

    const message =
      body?.message;

    if (!message) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const chatId =
      message.chat?.id;

    const telegramUserId =
      message.from?.id;

    if (
      chatId === undefined ||
      telegramUserId === undefined
    ) {
      return NextResponse.json(
        {
          status: "invalid_message",
        },
        {
          status: 400,
        }
      );
    }

    const telegramUserIdString =
      String(telegramUserId);

    if (
      typeof message.text === "string" &&
      message.text.trim()
    ) {
      const handledStart =
        await handleTelegramStart(
          chatId,
          telegramUserIdString,
          message.text
        );

      if (handledStart) {
        return NextResponse.json({
          status: "ok",
        });
      }
    }

    if (
      typeof message.text === "string" &&
      message.text.trim().match(/^\/id(?:@\w+)?$/i)
    ) {
      await sendTelegramMessage(
        chatId,
        `🆔 Your Telegram ID:\n\n${telegramUserIdString}`
      );

      return NextResponse.json({
        status: "ok",
      });
    }

    if (message.photo) {
      const user =
        await getOrCreateUser(
          "telegram",
          telegramUserIdString
        );

      const largestPhoto =
        message.photo[
          message.photo.length - 1
        ];

      if (
        !largestPhoto?.file_id
      ) {
        await sendTelegramMessage(
          chatId,
          "Couldn't read that image — try sending it again."
        );

        return NextResponse.json({
          status: "missing_media_id",
        });
      }

      const imageBuffer =
        await downloadTelegramPhoto(
          largestPhoto.file_id
        );

      if (!imageBuffer) {
        await sendTelegramMessage(
          chatId,
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

      await sendTelegramMessage(
        chatId,
        reply
      );

      return NextResponse.json({
        status: "ok",
      });
    }

    if (
      typeof message.text !==
      "string" ||
      !message.text.trim()
    ) {
      await sendTelegramMessage(
        chatId,
        "I can only read text and receipt photos right now — voice notes are coming soon."
      );

      return NextResponse.json({
        status: "unsupported_type",
      });
    }

    const user =
      await getOrCreateUser(
        "telegram",
        telegramUserIdString
      );

    const parsed =
      parseCommand(
        message.text
      );

    const reply = parsed
      ? await routeCommand(
          user.id,
          parsed
        )
      : await handleForwardedSms(
          user.id,
          message.text
        );

    await sendTelegramMessage(
      chatId,
      reply
    );

    return NextResponse.json({
      status: "ok",
    });
  } catch (err) {
    console.error(
      "[telegram webhook] Error handling message:",
      err
    );

    return NextResponse.json(
      {
        status: "error",
      },
      {
        status: 500
      }
    );
  }
}
