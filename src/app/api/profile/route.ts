import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

const MAX_DISPLAY_NAME_LENGTH = 100;

export async function PATCH(
  req: NextRequest
) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
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
      displayName,
    } = body;

    if (
      displayName === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Display name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
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

    const normalizedDisplayName =
      displayName.trim();

    if (
      normalizedDisplayName.length >
      MAX_DISPLAY_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Display name is too long.",
        },
        {
          status: 400,
        }
      );
    }

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

    const user =
      await prisma.user.update({
        where: {
          id: resolved.user.id,
        },
        data: {
          displayName:
            normalizedDisplayName ||
            null,
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
