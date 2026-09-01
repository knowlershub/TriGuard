import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/users";

export async function resolveAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Authentication required.",
      status: 401,
    } as const;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    return {
      error: "User account not found.",
      status: 404,
    } as const;
  }

  return {
    user,
    status: 200,
  } as const;
}

export async function resolveApiUser(
  testUserId?: string | null
) {
  const authenticated =
    await resolveAuthenticatedUser();

  if (authenticated.status === 200) {
    return authenticated;
  }

  const isDevelopment =
    process.env.NODE_ENV !== "production";

  if (isDevelopment && testUserId) {
    const user =
      await getOrCreateUser(
        "test",
        String(testUserId)
      );

    return {
      user,
      status: 200,
    } as const;
  }

  return authenticated;
}

/**
 * Legacy resolver retained for existing development callers.
 */
export async function resolveUserId(
  userId: string | null
) {
  if (!userId) {
    return {
      error: "Missing userId query param",
      status: 400,
    } as const;
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    return {
      error: `No user found with id ${userId}`,
      status: 404,
    } as const;
  }

  return {
    user,
    status: 200,
  } as const;
}