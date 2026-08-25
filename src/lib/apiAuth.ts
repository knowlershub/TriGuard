import { prisma } from "@/lib/prisma";

export async function resolveUserId(userId: string | null) {
  if (!userId) {
    return { error: "Missing userId query param", status: 400 } as const;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: `No user found with id ${userId}`, status: 404 } as const;
  }

  return { user, status: 200 } as const;
}