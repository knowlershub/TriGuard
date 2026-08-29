import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

const DEFAULT_PREFERENCES = {
  emailNotifications: true,
  leakAlerts: true,
  taskReminders: true,
  subscriptionAlerts: true,
  dailyDigest: true,
};

function serializePreferences(
  preferences: {
    emailNotifications: boolean;
    leakAlerts: boolean;
    taskReminders: boolean;
    subscriptionAlerts: boolean;
    dailyDigest: boolean;
  }
) {
  return {
    emailNotifications:
      preferences.emailNotifications,
    leakAlerts:
      preferences.leakAlerts,
    taskReminders:
      preferences.taskReminders,
    subscriptionAlerts:
      preferences.subscriptionAlerts,
    dailyDigest:
      preferences.dailyDigest,
  };
}

export async function GET(
  req: NextRequest
) {
  try {
    const testUserId =
      req.nextUrl.searchParams.get(
        "testUserId"
      );

    const resolved =
      await resolveApiUser(testUserId);

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

    const preferences =
      await prisma.notificationPreference.upsert(
        {
          where: {
            userId: resolved.user.id,
          },
          update: {},
          create: {
            userId: resolved.user.id,
            ...DEFAULT_PREFERENCES,
          },
        }
      );

    return NextResponse.json({
      preferences:
        serializePreferences(
          preferences
        ),
    });
  } catch (error) {
    console.error(
      "Notification preferences GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load notification settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  req: NextRequest
) {
  try {
    const body =
      await req.json().catch(
        () => null
      );

    if (!body) {
      return NextResponse.json(
        {
          error:
            "Invalid JSON body.",
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

    const preferences =
      await prisma.notificationPreference.upsert(
        {
          where: {
            userId: resolved.user.id,
          },
          update: {
            emailNotifications:
              Boolean(
                body.emailNotifications
              ),
            leakAlerts:
              Boolean(
                body.leakAlerts
              ),
            taskReminders:
              Boolean(
                body.taskReminders
              ),
            subscriptionAlerts:
              Boolean(
                body.subscriptionAlerts
              ),
            dailyDigest:
              Boolean(
                body.dailyDigest
              ),
          },
          create: {
            userId: resolved.user.id,
            emailNotifications:
              body.emailNotifications ===
              undefined
                ? true
                : Boolean(
                    body.emailNotifications
                  ),
            leakAlerts:
              body.leakAlerts ===
              undefined
                ? true
                : Boolean(
                    body.leakAlerts
                  ),
            taskReminders:
              body.taskReminders ===
              undefined
                ? true
                : Boolean(
                    body.taskReminders
                  ),
            subscriptionAlerts:
              body.subscriptionAlerts ===
              undefined
                ? true
                : Boolean(
                    body.subscriptionAlerts
                  ),
            dailyDigest:
              body.dailyDigest ===
              undefined
                ? true
                : Boolean(
                    body.dailyDigest
                  ),
          },
        }
      );

    return NextResponse.json({
      preferences:
        serializePreferences(
          preferences
        ),
    });
  } catch (error) {
    console.error(
      "Notification preferences PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save notification settings.",
      },
      {
        status: 500,
      }
    );
  }
}