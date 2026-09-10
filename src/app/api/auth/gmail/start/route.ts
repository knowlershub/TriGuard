import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { resolveApiUser } from "@/lib/apiAuth";
import {
  createGmailOAuthState,
  getGoogleAuthUrl,
} from "@/lib/googleOAuth";

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

    const userId = resolved.user.id;

    const state =
      createGmailOAuthState(userId);

    const authUrl =
      getGoogleAuthUrl(state);

    return NextResponse.redirect(
      authUrl
    );
  } catch (error) {
    console.error(
      "Gmail OAuth start error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to start Gmail connection.",
      },
      {
        status: 500,
      }
    );
  }
}
