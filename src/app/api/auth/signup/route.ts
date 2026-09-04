import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_DISPLAY_NAME_LENGTH = 100;

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json().catch(() => null);

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

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        {
          error: "Email address is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Password is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
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

    const existingAccount =
      await prisma.webAccount.findUnique({
        where: { email },
      });

    if (existingAccount) {
      return NextResponse.json(
        {
          error:
            "An account with that email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result =
      await prisma.$transaction(async (tx) => {
        const user =
          await tx.user.create({
            data: {
              displayName:
                displayName || null,
            },
          });

        const account =
          await tx.webAccount.create({
            data: {
              userId: user.id,
              email,
              passwordHash,
            },
          });

        return {
          user,
          account,
        };
      });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          displayName:
            result.user.displayName,
          email: result.account.email,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[signup] Failed to create account:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create your account.",
      },
      {
        status: 500,
      }
    );
  }
}
