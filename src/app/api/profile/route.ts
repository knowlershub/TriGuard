import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

export async function PATCH(
  req: NextRequest
) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          error: "Invalid JSON body.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      testUserId,
      displayName,
    } = body;

    if (
      displayName !== undefined &&
      typeof displayName !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Display name must be a string.",
        },
        {
          status: 400,
        }
      );
    }

    const resolved =
      await resolveApiUser(
        testUserId
          ? String(testUserId)
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

    const user =
      await prisma.user.update({
        where: {
          id: resolved.user.id,
        },
        data: {
          displayName:
            typeof displayName === "string"
              ? displayName.trim() || null
              : undefined,
        },
      });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        displayName:
          user.displayName,
      },
    });
  } catch (error) {
    console.error(
      "Profile API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update profile.",
      },
      {
        status: 500,
      }
    );
  }
}