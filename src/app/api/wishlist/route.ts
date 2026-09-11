import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const items = await prisma.wishlist.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          priority: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error(
      "[wishlist] GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load wishlist.",
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
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();

    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const payload =
      body as Record<string, unknown>;

    const title =
      typeof payload.title === "string"
        ? payload.title.trim()
        : "";

    const targetAmount =
      typeof payload.targetAmount === "number"
        ? payload.targetAmount
        : Number(payload.targetAmount);

    const currency =
      typeof payload.currency === "string"
        ? payload.currency.trim().toUpperCase()
        : "NGN";

    const priority =
      typeof payload.priority === "string"
        ? payload.priority.trim().toLowerCase()
        : "medium";

    if (!title) {
      return NextResponse.json(
        {
          error:
            "Wishlist title is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Target amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (
      !["low", "medium", "high"].includes(
        priority
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Priority must be low, medium, or high.",
        },
        { status: 400 }
      );
    }

    const item = await prisma.wishlist.create({
      data: {
        userId,
        title,
        targetAmount,
        currency,
        priority,
      },
    });

    return NextResponse.json(
      {
        item,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[wishlist] POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save wishlist item.",
      },
      {
        status: 500,
      }
    );
  }
}
