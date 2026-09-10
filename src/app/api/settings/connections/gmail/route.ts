import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

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

    const account =
      await prisma.emailAccount.findFirst({
        where: {
          userId:
            resolved.user.id,
          provider: "gmail",
        },
        select: {
          emailAddress: true,
          provider: true,
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

    const expired =
      account.expiresAt.getTime() <=
      Date.now();

    return NextResponse.json({
      connected: !expired,
      emailAddress:
        account.emailAddress,
      provider:
        account.provider,
      expired,
      needsReauth: expired,
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
