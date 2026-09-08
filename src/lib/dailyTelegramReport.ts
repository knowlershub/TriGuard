import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

const NIGERIA_TIME_ZONE = "Africa/Lagos";

type DailyReportResult = {
  scanned: number;
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
};

function getNigeriaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NIGERIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine Nigeria calendar date.");
  }

  return { year, month, day };
}

function getNigeriaDayRange(date = new Date()) {
  const { year, month, day } = getNigeriaDateParts(date);

  const start = new Date(
    `${year}-${month}-${day}T00:00:00+01:00`
  );

  const end = new Date(
    `${year}-${month}-${day}T23:59:59.999+01:00`
  );

  return { start, end };
}

function formatMoney(amount: number): string {
  return `₦${amount.toFixed(2)}`;
}

function buildSpendingReport(
  expenses: {
    amount: number;
    category: string | null;
    merchant: string | null;
  }[],
  date: Date
): string {
  const { year, month, day } = getNigeriaDateParts(date);

  const formattedDate = new Intl.DateTimeFormat("en-NG", {
    timeZone: NIGERIA_TIME_ZONE,
    dateStyle: "full",
  }).format(date);

  if (expenses.length === 0) {
    return [
      "📊 TriGuard Daily Spending Report",
      "",
      formattedDate,
      "",
      "💰 Total spent: ₦0.00",
      "",
      "No expenses were logged yesterday.",
      "",
      "Keep tracking your spending — every naira counts.",
    ].join("\n");
  }

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const byCategory = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category?.trim() || "Uncategorized";

    byCategory.set(
      category,
      (byCategory.get(category) ?? 0) + expense.amount
    );
  }

  const categoryLines = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) =>
        `• ${category}: ${formatMoney(amount)}`
    );

  const merchantLines = expenses
    .filter((expense) => expense.merchant?.trim())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(
      (expense) =>
        `• ${expense.merchant}: ${formatMoney(expense.amount)}`
    );

  return [
    "📊 TriGuard Daily Spending Report",
    "",
    formattedDate,
    "",
    `💰 Total spent: ${formatMoney(total)}`,
    `🧾 Transactions: ${expenses.length}`,
    "",
    "📂 By category",
    ...categoryLines,
    ...(merchantLines.length > 0
      ? ["", "🏪 Top merchants", ...merchantLines]
      : []),
    "",
    `Keep an eye on your spending today. — TriGuard`,
  ].join("\n");
}

export async function sendDailyTelegramReports(
  now = new Date()
): Promise<DailyReportResult> {
  const { start, end } = getNigeriaDayRange(now);

  const previousDayStart = new Date(
    start.getTime() - 24 * 60 * 60 * 1000
  );

  const previousDayEnd = new Date(
    start.getTime() - 1
  );

  const users = await prisma.user.findMany({
    where: {
      telegramId: {
        not: null,
      },
      notificationPreference: {
        dailyDigest: true,
      },
    },
    select: {
      id: true,
      telegramId: true,
    },
  });

  const result: DailyReportResult = {
    scanned: users.length,
    eligible: users.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const user of users) {
    if (!user.telegramId) {
      result.skipped += 1;
      continue;
    }

    try {
      const expenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          occurredAt: {
            gte: previousDayStart,
            lte: previousDayEnd,
          },
        },
        select: {
          amount: true,
          category: true,
          merchant: true,
        },
        orderBy: {
          occurredAt: "desc",
        },
      });

      const report = buildSpendingReport(
        expenses.map((expense) => ({
          amount: Number(expense.amount),
          category: expense.category,
          merchant: expense.merchant,
        })),
        new Date(start.getTime() - 1)
      );

      await sendTelegramMessage(
        user.telegramId,
        report
      );

      result.sent += 1;
    } catch (error) {
      result.failed += 1;

      console.error(
        `[daily telegram report] Failed for user ${user.id}:`,
        error
      );
    }
  }

  return result;
}
