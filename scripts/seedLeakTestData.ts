/**
 * One-off dev script: seeds backdated expenses for a test user so the
 * leak-alert cold-start guard has enough prior-month history to compare
 * against. Not part of the app — just a testing convenience.
 *
 * Usage: npx tsx scripts/seedLeakTestData.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { whatsappId: "test:bob" },
    update: {},
    create: { whatsappId: "test:bob", displayName: "Test User bob" },
  });

  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: "600",
      category: "data",
      source: "manual_text",
      parsedBy: "seed_script",
      occurredAt: new Date("2026-06-15"),
    },
  });

  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: "700",
      category: "data",
      source: "manual_text",
      parsedBy: "seed_script",
      occurredAt: new Date("2026-07-15"),
    },
  });

  console.log(`Seeded 2 backdated "data" expenses for user ${user.id} (whatsappId: test:bob)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());