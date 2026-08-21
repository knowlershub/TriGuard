import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const DEFAULT_PREFERENCES = {
  emailNotifications: true,
  leakAlerts: true,
  taskReminders: true,
  subscriptionAlerts: true,
  dailyDigest: true,
};

async function getUser(testUserId: string) {
  return getOrCreateUser("test", testUserId);
}

export async function GET(req: NextRequest) {
  try {
    const testUserId = req.nextUrl.searchParams.get("testUserId");

    if (!testUserId) {
      return NextResponse.json(
        { error: "Missing testUserId." },
        { status: 400 }
      );
    }

    const user = await getUser(testUserId);

    const preferences =
      await prisma.notificationPreference.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          ...DEFAULT_PREFERENCES,
        },
        update: {},
      });

    return NextResponse.json({
      preferences: {
        emailNotifications: preferences.emailNotifications,
        leakAlerts: preferences.leakAlerts,
        taskReminders: preferences.taskReminders,
        subscriptionAlerts: preferences.subscriptionAlerts,
        dailyDigest: preferences.dailyDigest,
      },
    });
  } catch (error) {
    console.error("Notification preferences GET error:", error);

    return NextResponse.json(
      {
        error: "Failed to load notification settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.testUserId) {
      return NextResponse.json(
        { error: "Missing testUserId." },
        { status: 400 }
      );
    }

    const user = await getUser(String(body.testUserId));

    const current =
      await prisma.notificationPreference.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          ...DEFAULT_PREFERENCES,
        },
        update: {},
      });

    const preferences =
      await prisma.notificationPreference.update({
        where: {
          userId: user.id,
        },
        data: {
          emailNotifications:
            typeof body.emailNotifications === "boolean"
              ? body.emailNotifications
              : current.emailNotifications,

          leakAlerts:
            typeof body.leakAlerts === "boolean"
              ? body.leakAlerts
              : current.leakAlerts,

          taskReminders:
            typeof body.taskReminders === "boolean"
              ? body.taskReminders
              : current.taskReminders,

          subscriptionAlerts:
            typeof body.subscriptionAlerts === "boolean"
              ? body.subscriptionAlerts
              : current.subscriptionAlerts,

          dailyDigest:
            typeof body.dailyDigest === "boolean"
              ? body.dailyDigest
              : current.dailyDigest,
        },
      });

    return NextResponse.json({
      success: true,
      preferences: {
        emailNotifications: preferences.emailNotifications,
        leakAlerts: preferences.leakAlerts,
        taskReminders: preferences.taskReminders,
        subscriptionAlerts: preferences.subscriptionAlerts,
        dailyDigest: preferences.dailyDigest,
      },
    });
  } catch (error) {
    console.error("Notification preferences PATCH error:", error);

    return NextResponse.json(
      {
        error: "Failed to save notification settings.",
      },
      { status: 500 }
    );
  }
}