import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        whatsappId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        sentAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        direction: true,
        messageType: true,
        body: true,
        mediaId: true,
        sentAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      connected: Boolean(user.whatsappId),
      whatsappId: user.whatsappId,
      messages,
    });
  } catch (error) {
    console.error(
      "[inbox whatsapp] GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load WhatsApp messages.",
      },
      {
        status: 500,
      }
    );
  }
}
