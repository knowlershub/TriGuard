import { NextRequest, NextResponse } from "next/server";
import { resolveApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest
) {
  try {
    const resolved =
      await resolveApiUser();
    if (resolved.status !== 200) {
      return NextResponse.json(
        {
          error: resolved.error,
        },
        {
          status: resolved.status,
        }
      );
    }
    const user = resolved.user;
    return NextResponse.json({
      connected: Boolean(
        user.telegramId
      ),
      telegramId:
        user.telegramId ?? null,
    });
  } catch (error) {
    console.error(
      "Telegram connection status error:",
      error
    );
    return NextResponse.json(
      {
        error:
          "Failed to check Telegram connection.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST — generates a short-lived TelegramLinkCode for the current user
 * and returns the t.me deep link. The user opens this link, Telegram
 * sends /start <code> to our bot, and the webhook (see
 * src/app/api/telegram/webhook/route.ts) links their Telegram account
 * to this User row.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const resolved = await resolveApiUser();

    if (resolved.status !== 200) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      console.error("Missing TELEGRAM_BOT_USERNAME env var.");
      return NextResponse.json(
        { error: "Telegram linking isn't configured yet." },
        { status: 500 }
      );
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const linkCode = await prisma.telegramLinkCode.create({
      data: {
        userId: resolved.user.id,
        expiresAt,
      },
    });

    return NextResponse.json({
      connected: Boolean(resolved.user.telegramId),
      code: linkCode.code,
      expiresAt: linkCode.expiresAt.toISOString(),
      url: `https://t.me/${botUsername}?start=${linkCode.code}`,
    });
  } catch (error) {
    console.error("Telegram link code generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Telegram link code." },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const resolved =
      await resolveApiUser();

    if (resolved.status !== 200) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    await prisma.user.update({
      where: {
        id: resolved.user.id,
      },
      data: {
        telegramId: null,
      },
    });

    await prisma.telegramLinkCode.updateMany({
      where: {
        userId: resolved.user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      connected: false,
      telegramId: null,
    });
  } catch (error) {
    console.error(
      "Telegram unlink error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to unlink Telegram.",
      },
      {
        status: 500,
      }
    );
  }
}
