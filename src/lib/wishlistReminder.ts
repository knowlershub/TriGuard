import { prisma } from "@/lib/prisma";

const LOOKBACK_DAYS = 7;
const REMINDER_COOLDOWN_DAYS = 7;

const DISCRETIONARY_CATEGORIES = new Set([
  "food",
  "dining",
  "eating out",
  "entertainment",
  "shopping",
  "fun",
  "lifestyle",
  "personal",
  "gifts",
]);

export type WishlistReminderResult = {
  shouldRemind: boolean;
  userId: string;
  whatsappId: string | null;
  wishlistId: string | null;
  title: string | null;
  remainingAmount: number;
  currency: string | null;
  discretionarySpend: number;
  message: string | null;
  lastRemindedAt: Date | null;
};

function formatMoney(
  amount: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  } catch {
    return `${currency} ${Math.round(
      amount
    ).toLocaleString()}`;
  }
}

function normalizeCategory(
  value: string | null
) {
  return (
    value
      ?.trim()
      .toLowerCase() ?? ""
  );
}

function getLookbackDate() {
  return new Date(
    Date.now() -
      LOOKBACK_DAYS *
        24 *
        60 *
        60 *
        1000
  );
}

function getCooldownDate() {
  return new Date(
    Date.now() -
      REMINDER_COOLDOWN_DAYS *
        24 *
        60 *
        60 *
        1000
  );
}

export async function buildWishlistReminder(
  userId: string
): Promise<WishlistReminderResult> {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        whatsappId: true,
      },
    });

  if (!user) {
    throw new Error(
      "User account not found."
    );
  }

  const wishlist =
    await prisma.wishlist.findMany({
      where: {
        userId,
        status: "active",
        remindOnLeak: true,
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
      take: 10,
    });

  if (wishlist.length === 0) {
    return {
      shouldRemind: false,
      userId,
      whatsappId: user.whatsappId,
      wishlistId: null,
      title: null,
      remainingAmount: 0,
      currency: null,
      discretionarySpend: 0,
      message: null,
      lastRemindedAt: null,
    };
  }

  const expenses =
    await prisma.expense.findMany({
      where: {
        userId,
        occurredAt: {
          gte: getLookbackDate(),
          lte: new Date(),
        },
      },
      select: {
        amount: true,
        currency: true,
        category: true,
      },
    });

  const discretionarySpend =
    expenses.reduce(
      (total, expense) => {
        if (
          expense.currency !== "NGN"
        ) {
          return total;
        }

        const category =
          normalizeCategory(
            expense.category
          );

        if (
          !DISCRETIONARY_CATEGORIES.has(
            category
          )
        ) {
          return total;
        }

        return (
          total +
          Number(expense.amount)
        );
      },
      0
    );

  const cooldownDate =
    getCooldownDate();

  const selected =
    wishlist.find((item) => {
      const target =
        Number(item.targetAmount);

      const saved =
        Number(item.savedAmount);

      const remaining =
        Math.max(
          target - saved,
          0
        );

      if (remaining <= 0) {
        return false;
      }

      const threshold =
        Math.max(
          5000,
          target * 0.05
        );

      if (
        discretionarySpend <
        threshold
      ) {
        return false;
      }

      if (
        item.lastRemindedAt &&
        item.lastRemindedAt >
          cooldownDate
      ) {
        return false;
      }

      return true;
    });

  if (!selected) {
    return {
      shouldRemind: false,
      userId,
      whatsappId: user.whatsappId,
      wishlistId: null,
      title: null,
      remainingAmount: 0,
      currency: null,
      discretionarySpend,
      message: null,
      lastRemindedAt: null,
    };
  }

  const target =
    Number(
      selected.targetAmount
    );

  const saved =
    Number(
      selected.savedAmount
    );

  const remaining =
    Math.max(
      target - saved,
      0
    );

  const message = [
    "⭐ Minderra wishlist check",
    "",
    `You've spent about ${formatMoney(
      discretionarySpend,
      "NGN"
    )} on discretionary spending over the last ${LOOKBACK_DAYS} days.`,
    "",
    `"${selected.title}" still needs ${formatMoney(
      remaining,
      selected.currency
    )}.`,
    "",
    "A little less discretionary spending could help you finish that goal sooner.",
  ].join("\n");

  return {
    shouldRemind: true,
    userId,
    whatsappId: user.whatsappId,
    wishlistId: selected.id,
    title: selected.title,
    remainingAmount: remaining,
    currency: selected.currency,
    discretionarySpend,
    message,
    lastRemindedAt:
      selected.lastRemindedAt,
  };
}

export async function markWishlistReminderSent(
  wishlistId: string
) {
  await prisma.wishlist.update({
    where: {
      id: wishlistId,
    },
    data: {
      lastRemindedAt: new Date(),
    },
  });
}

export async function buildWishlistRemindersForConnectedUsers() {
  const users =
    await prisma.user.findMany({
      where: {
        whatsappId: {
          not: null,
        },
        Wishlist: {
          some: {
            status: "active",
            remindOnLeak: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

  const results: WishlistReminderResult[] =
    [];

  for (const user of users) {
    try {
      const result =
        await buildWishlistReminder(
          user.id
        );

      if (result.shouldRemind) {
        results.push(result);
      }
    } catch (error) {
      console.error(
        `[wishlistReminder] Failed for user ${user.id}:`,
        error
      );
    }
  }

  return results;
}
