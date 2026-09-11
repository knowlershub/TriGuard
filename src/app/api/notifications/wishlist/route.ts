import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  buildWishlistRemindersForConnectedUsers,
  markWishlistReminderSent,
} from "@/lib/wishlistReminder";
import {
  sendWhatsAppMessage,
} from "@/lib/whatsapp";

export const dynamic =
  "force-dynamic";

function isAuthorized(
  req: NextRequest
) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization =
    req.headers.get(
      "authorization"
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

async function processReminders() {
  const reminders =
    await buildWishlistRemindersForConnectedUsers();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of reminders) {
    if (
      !reminder.whatsappId ||
      !reminder.wishlistId ||
      !reminder.message
    ) {
      skipped += 1;
      continue;
    }

    try {
      const delivered =
        await sendWhatsAppMessage(
          reminder.whatsappId,
          reminder.message
        );

      if (!delivered) {
        failed += 1;
        continue;
      }

      await markWishlistReminderSent(
        reminder.wishlistId
      );

      sent += 1;
    } catch (error) {
      failed += 1;

      console.error(
        `[wishlist notifications] Failed for user ${reminder.userId}:`,
        error
      );
    }
  }

  return {
    evaluated: reminders.length,
    sent,
    skipped,
    failed,
  };
}

export async function GET(
  req: NextRequest
) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const result =
      await processReminders();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "[wishlist notifications] GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process Wishlist reminders.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  return GET(req);
}
