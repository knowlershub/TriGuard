import {
  NextRequest,
  NextResponse,
} from "next/server";

export const dynamic = "force-dynamic";

import {
  exchangeCodeForTokens,
  fetchGmailAddress,
  verifyGmailOAuthState,
} from "@/lib/googleOAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest
) {
  try {
    const code =
      req.nextUrl.searchParams.get(
        "code"
      );

    const state =
      req.nextUrl.searchParams.get(
        "state"
      );

    const error =
      req.nextUrl.searchParams.get(
        "error"
      );

    if (error) {
      return new NextResponse(
        "Gmail connection was cancelled or denied.",
        {
          status: 400,
        }
      );
    }

    if (!code || !state) {
      return new NextResponse(
        "Missing Gmail OAuth parameters.",
        {
          status: 400,
        }
      );
    }

    const userId =
      verifyGmailOAuthState(state);

    if (!userId) {
      return new NextResponse(
        "Invalid or expired Gmail connection request.",
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      });

    if (!user) {
      return new NextResponse(
        "User account not found.",
        {
          status: 404,
        }
      );
    }

    const tokens =
      await exchangeCodeForTokens(code);

    if (!tokens) {
      return new NextResponse(
        "Couldn't complete Gmail connection. Please try again.",
        {
          status: 500,
        }
      );
    }

    const emailAddress =
      await fetchGmailAddress(
        tokens.accessToken
      );

    if (!emailAddress) {
      return new NextResponse(
        "Connected, but couldn't verify the Gmail address.",
        {
          status: 500,
        }
      );
    }

    await prisma.emailAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "gmail",
        },
      },
      update: {
        accessToken:
          tokens.accessToken,
        refreshToken:
          tokens.refreshToken,
        expiresAt:
          tokens.expiresAt,
        emailAddress,
      },
      create: {
        userId,
        provider: "gmail",
        accessToken:
          tokens.accessToken,
        refreshToken:
          tokens.refreshToken,
        expiresAt:
          tokens.expiresAt,
        emailAddress,
      },
    });

    return NextResponse.redirect(
      new URL(
        "/dashboard/settings?gmail=connected",
        process.env.APP_BASE_URL ?? "https://triguard-mgoo.onrender.com"
      )
    );
  } catch (error) {
    console.error(
      "[gmail callback] OAuth error:",
      error
    );

    return new NextResponse(
      "Unable to complete Gmail connection.",
      {
        status: 500,
      }
    );
  }
}
