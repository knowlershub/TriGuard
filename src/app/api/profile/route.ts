import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/users";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const testUserId = body.testUserId;
    const displayName = body.displayName;

    if (!testUserId) {
      return NextResponse.json(
        { error: "Missing testUserId." },
        { status: 400 }
      );
    }

    if (typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Display name must be a string." },
        { status: 400 }
      );
    }

    const normalizedName = displayName.trim();

    if (!normalizedName) {
      return NextResponse.json(
        { error: "Display name cannot be empty." },
        { status: 400 }
      );
    }

    if (normalizedName.length > 80) {
      return NextResponse.json(
        { error: "Display name must be 80 characters or fewer." },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(
      "test",
      String(testUserId)
    );

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        displayName: normalizedName,
      },
      select: {
        id: true,
        displayName: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}