import { NextRequest, NextResponse } from "next/server";

import { sendDailyTelegramReports } from "@/lib/dailyTelegramReport";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "[daily notifications] CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          error: "Daily notification scheduler is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization = req.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      console.warn(
        "[daily notifications] Invalid scheduler authorization."
      );

      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    const result = await sendDailyTelegramReports();

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    console.error(
      "[daily notifications] Scheduler error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error: "Failed to send daily Telegram reports.",
      },
      {
        status: 500,
      }
    );
  }
}
