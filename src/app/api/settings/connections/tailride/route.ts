import {
  randomBytes,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

function createIntakeTag(): string {
  return `triguard_${randomBytes(12).toString("hex")}`;
}

export async function GET(
  _req: NextRequest
) {
  try {
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

    let connection =
      await prisma.tailrideConnection.findUnique({
        where: {
          userId: resolved.user.id,
        },
        select: {
          intakeTag: true,
        },
      });

    if (!connection) {
      connection =
        await prisma.tailrideConnection.create({
          data: {
            userId: resolved.user.id,
            intakeTag: createIntakeTag(),
          },
          select: {
            intakeTag: true,
          },
        });
    }

    return NextResponse.json({
      connected: true,
      intakeTag:
        connection.intakeTag,
    });
  } catch (error) {
    console.error(
      "[tailride connection] Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load Tailride connection.",
      },
      {
        status: 500,
      }
    );
  }
}
