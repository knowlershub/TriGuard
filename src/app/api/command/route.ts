import { NextRequest, NextResponse } from "next/server";

import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { parseCommand, routeCommand } from "@/lib/commandRouter";
import { resolveApiUser } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.text) {
      return NextResponse.json(
        {
          error: "Body must include text",
        },
        {
          status: 400,
        }
      );
    }

    const resolved =
      await resolveApiUser(
        body?.testUserId
          ? String(body.testUserId)
          : null
      );

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

    const parsed = parseCommand(
      String(body.text)
    );

    const reply = parsed
      ? await routeCommand(
          user.id,
          parsed
        )
      : await handleForwardedSms(
          user.id,
          String(body.text)
        );

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.error(
      "[command] API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Command failed.",
      },
      {
        status: 500,
      }
    );
  }
}