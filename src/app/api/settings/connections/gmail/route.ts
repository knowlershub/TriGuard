import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/users";
import { refreshAccessToken } from "@/lib/googleOAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const testUserId = req.nextUrl.searchParams.get("testUserId");

    if (!testUserId) {
      return NextResponse.json(
        { error: "Missing testUserId." },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser("test", testUserId);

    const account = await prisma.emailAccount.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "gmail",
        },
      },
      select: {
        emailAddress: true,
        provider: true,
        accessToken: true,
        refreshToken: true,
        expiresAt: true,
      },
    });

    if (!account) {
      return NextResponse.json({
        connected: false,
        emailAddress: null,
        provider: null,
        expired: false,
        needsReauth: false,
      });
    }

    const expiresSoon =
      account.expiresAt.getTime() <= Date.now() + 30_000;

    if (!expiresSoon) {
      return NextResponse.json({
        connected: true,
        emailAddress: account.emailAddress,
        provider: account.provider,
        expired: false,
        needsReauth: false,
      });
    }

    /*
     * The existing Claude-built Gmail implementation already has
     * refreshAccessToken(). Use that same helper here instead of
     * treating an expired access token as a disconnected account.
     */
    const refreshed = await refreshAccessToken(
      account.refreshToken
    );

    if (!refreshed) {
      return NextResponse.json({
        connected: true,
        emailAddress: account.emailAddress,
        provider: account.provider,
        expired: true,
        needsReauth: true,
      });
    }

    await prisma.emailAccount.update({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "gmail",
        },
      },
      data: {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      },
    });

    return NextResponse.json({
      connected: true,
      emailAddress: account.emailAddress,
      provider: account.provider,
      expired: false,
      needsReauth: false,
    });
  } catch (error) {
    console.error("Gmail connection status error:", error);

    return NextResponse.json(
      {
        error: "Failed to check Gmail connection.",
      },
      { status: 500 }
    );
  }
}