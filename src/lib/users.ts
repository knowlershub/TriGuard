import { prisma } from "@/lib/prisma";

export async function getOrCreateUser(channel: "whatsapp" | "telegram" | "test", externalId: string) {
  if (channel === "whatsapp") {
    return prisma.user.upsert({
      where: { whatsappId: externalId },
      update: {},
      create: { whatsappId: externalId },
    });
  }

  if (channel === "telegram") {
    return prisma.user.upsert({
      where: { telegramId: externalId },
      update: {},
      create: { telegramId: externalId },
    });
  }

  const testId = `test:${externalId}`;
  return prisma.user.upsert({
    where: { whatsappId: testId },
    update: {},
    create: { whatsappId: testId, displayName: `Test User ${externalId}` },
  });
}