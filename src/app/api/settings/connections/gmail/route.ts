import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";
import { refreshAccessToken } from "@/lib/googleOAuth";

export const dynamic = "force-dynamic";

const REFRESH_BUFFER_MS =
  60 * 1000;

export async function GET(
  _req: NextRequest
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

    const account =
      await prisma.emailAccount.findFirst({
        where: {
          userId: resolved.user.id,
          provider: "gmail",
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

    const now =
      Date.now();

    const expiresAt =
      account.expiresAt.getTime();

    const needsRefresh =
      expiresAt <=
      now + REFRESH_BUFFER_MS;

    if (!needsRefresh) {
      return NextResponse.json({
        connected: true,
        emailAddress:
          account.emailAddress,
        provider:
          account.provider,
        expired: false,
        needsReauth: false,
      });
    }

    if (!account.refreshToken) {
      return NextResponse.json({
        connected: false,
        emailAddress:
          account.emailAddress,
        provider:
          account.provider,
        expired: true,
        needsReauth: true,
      });
    }

    const refreshed =
      await refreshAccessToken(
        account.refreshToken
      );

    if (!refreshed) {
      console.warn(
        "[gmail status] Gmail access token could not be refreshed."
      );

      return NextResponse.json({
        connected: false,
        emailAddress:
          account.emailAddress,
        provider:
          account.provider,
        expired: true,
        needsReauth: true,
      });
    }

    await prisma.emailAccount.update({
      where: {
        userId_provider: {
          userId:
            resolved.user.id,
          provider: "gmail",
        },
      },
      data: {
        accessToken:
          refreshed.accessToken,
        expiresAt:
          refreshed.expiresAt,
      },
    });

    return NextResponse.json({
      connected: true,
      emailAddress:
        account.emailAddress,
      provider:
        account.provider,
      expired: false,
      needsReauth: false,
    });
  } catch (error) {
    console.error(
      "Gmail connection status error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to check Gmail connection.",
      },
      {
        status: 500,
      }
    );
  }
}
