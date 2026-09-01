import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const email = String(
      body?.email ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body?.password ?? ""
    );

    const displayName = String(
      body?.displayName ?? ""
    ).trim();

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
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
        { status: 409 }
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
      { status: 201 }
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
      { status: 500 }
    );
  }
}
