import { prisma } from "@/lib/prisma";

const CURRENCIES = new Set([
  "NGN",
  "USD",
  "GBP",
  "EUR",
]);

const PRIORITIES = new Set([
  "low",
  "medium",
  "high",
]);

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

function money(
  amount: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function normalizeTitle(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function findAmount(
  tokens: string[]
): number | null {
  for (const token of tokens) {
    const normalized = token.replace(
      /,/g,
      ""
    );

    const value = Number(normalized);

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      return value;
    }
  }

  return null;
}

export async function handleWishlistCommand(
  userId: string,
  rawArgs: string
): Promise<string> {
  const args = rawArgs.trim();

  if (!args) {
    return [
      "⭐ WISHLIST",
      "",
      "/wishlist add <item> <amount>",
      "/wishlist list",
      "/wishlist save <item> <amount>",
      "/wishlist done <item>",
      "/wishlist reminder",
      "",
      "Example:",
      "/wishlist add Sony headphones 180000",
    ].join("\n");
  }

  const firstSpace =
    args.indexOf(" ");

  const action =
    firstSpace === -1
      ? args.toLowerCase()
      : args
          .slice(0, firstSpace)
          .toLowerCase();

  const rest =
    firstSpace === -1
      ? ""
      : args
          .slice(firstSpace + 1)
          .trim();

  switch (action) {
    case "add":
      return addWishlistItem(
        userId,
        rest
      );

    case "list":
      return listWishlist(
        userId
      );

    case "save":
      return saveWishlistAmount(
        userId,
        rest
      );

    case "done":
      return completeWishlistItem(
        userId,
        rest
      );

    case "reminder":
      return getWishlistReminder(
        userId
      );

    default:
      return [
        `Unknown wishlist action: ${action}`,
        "",
        "Use:",
        "/wishlist add <item> <amount>",
        "/wishlist list",
        "/wishlist save <item> <amount>",
        "/wishlist done <item>",
        "/wishlist reminder",
      ].join("\n");
  }
}

async function addWishlistItem(
  userId: string,
  rawArgs: string
) {
  const tokens =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);

  if (tokens.length < 2) {
    return [
      "I need the item and target amount.",
      "",
      "Example:",
      "/wishlist add Sony headphones 180000",
    ].join("\n");
  }

  let currency = "NGN";

  const lastToken =
    tokens.at(-1)?.toUpperCase();

  if (
    lastToken &&
    CURRENCIES.has(lastToken)
  ) {
    currency = lastToken;
    tokens.pop();
  }

  const amountIndex = tokens.findIndex(
    (token) => {
      const value = Number(
        token.replace(/,/g, "")
      );

      return (
        Number.isFinite(value) &&
        value > 0
      );
    }
  );

  if (amountIndex === -1) {
    return [
      "I couldn't find the target amount.",
      "",
      "Example:",
      "/wishlist add Sony headphones 180000",
    ].join("\n");
  }

  const amount = Number(
    tokens[amountIndex].replace(
      /,/g,
      ""
    )
  );

  const title = normalizeTitle(
    [
      ...tokens.slice(
        0,
        amountIndex
      ),
      ...tokens.slice(
        amountIndex + 1
      ),
    ].join(" ")
  );

  if (!title) {
    return "Please provide the item name.";
  }

  const existing =
    await prisma.wishlist.findFirst({
      where: {
        userId,
        status: "active",
        title: {
          equals: title,
          mode: "insensitive",
        },
      },
    });

  if (existing) {
    return [
      `You already have "${existing.title}" on your wishlist.`,
      `Target: ${money(
        Number(existing.targetAmount),
        existing.currency
      )}`,
      `Saved: ${money(
        Number(existing.savedAmount),
        existing.currency
      )}`,
    ].join("\n");
  }

  const item =
    await prisma.wishlist.create({
      data: {
        userId,
        title,
        targetAmount: amount,
        currency,
        priority: "medium",
      },
    });

  return [
    "⭐ Added to your wishlist.",
    "",
    item.title,
    `Target: ${money(
      Number(item.targetAmount),
      item.currency
    )}`,
    "Saved: 0",
    "",
    "Minderra will keep this unfinished goal in view.",
  ].join("\n");
}

async function listWishlist(
  userId: string
) {
  const items =
    await prisma.wishlist.findMany({
      where: {
        userId,
        status: "active",
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  if (items.length === 0) {
    return [
      "⭐ Your wishlist is empty.",
      "",
      "Example:",
      "/wishlist add Sony headphones 180000",
    ].join("\n");
  }

  const lines = [
    "⭐ YOUR WISHLIST",
    "",
  ];

  for (const item of items) {
    const target =
      Number(item.targetAmount);

    const saved =
      Number(item.savedAmount);

    const remaining =
      Math.max(
        target - saved,
        0
      );

    const progress =
      target > 0
        ? Math.round(
            (saved / target) *
              100
          )
        : 0;

    lines.push(
      `• ${item.title}`,
      `  Saved: ${money(
        saved,
        item.currency
      )} / ${money(
        target,
        item.currency
      )}`,
      `  Remaining: ${money(
        remaining,
        item.currency
      )}`,
      `  Progress: ${progress}%`,
      ""
    );
  }

  return lines.join("\n").trim();
}

async function saveWishlistAmount(
  userId: string,
  rawArgs: string
) {
  const tokens =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);

  const amount =
    findAmount(tokens);

  if (!amount) {
    return [
      "I need the amount you're adding to the savings.",
      "",
      "Example:",
      "/wishlist save headphones 20000",
    ].join("\n");
  }

  const amountIndex =
    tokens.findIndex(
      (token) =>
        Number(
          token.replace(/,/g, "")
        ) === amount
    );

  const title =
    normalizeTitle(
      [
        ...tokens.slice(
          0,
          amountIndex
        ),
        ...tokens.slice(
          amountIndex + 1
        ),
      ].join(" ")
    );

  if (!title) {
    return "Tell me which wishlist item you're saving for.";
  }

  const item =
    await prisma.wishlist.findFirst({
      where: {
        userId,
        status: "active",
        title: {
          contains: title,
          mode: "insensitive",
        },
      },
    });

  if (!item) {
    return [
      `I couldn't find an active wishlist item matching "${title}".`,
      "",
      "Use /wishlist list to see your active goals.",
    ].join("\n");
  }

  const target =
    Number(item.targetAmount);

  const currentSaved =
    Number(item.savedAmount);

  const newSaved =
    Math.min(
      currentSaved + amount,
      target
    );

  const remaining =
    Math.max(
      target - newSaved,
      0
    );

  const updated =
    await prisma.wishlist.update({
      where: {
        id: item.id,
      },
      data: {
        savedAmount: newSaved,
        ...(newSaved >= target
          ? {
              status: "completed",
            }
          : {}),
      },
    });

  if (updated.status === "completed") {
    return [
      "🎉 Wishlist goal completed!",
      "",
      item.title,
      `Target: ${money(
        target,
        item.currency
      )}`,
      `Saved: ${money(
        newSaved,
        item.currency
      )}`,
      "",
      "You've finished saving for this item.",
    ].join("\n");
  }

  return [
    "⭐ Wishlist savings updated.",
    "",
    item.title,
    `Added: ${money(
      amount,
      item.currency
    )}`,
    `Saved: ${money(
      newSaved,
      item.currency
    )}`,
    `Still needed: ${money(
      remaining,
      item.currency
    )}`,
  ].join("\n");
}

async function completeWishlistItem(
  userId: string,
  rawArgs: string
) {
  const title =
    normalizeTitle(rawArgs);

  if (!title) {
    return [
      "Tell me which wishlist item is completed.",
      "Example: /wishlist done headphones",
    ].join("\n");
  }

  const item =
    await prisma.wishlist.findFirst({
      where: {
        userId,
        status: "active",
        title: {
          contains: title,
          mode: "insensitive",
        },
      },
    });

  if (!item) {
    return [
      `I couldn't find an active wishlist item matching "${title}".`,
    ].join("\n");
  }

  await prisma.wishlist.update({
    where: {
      id: item.id,
    },
    data: {
      status: "completed",
    },
  });

  return [
    "✅ Wishlist item marked completed.",
    "",
    item.title,
  ].join("\n");
}

async function getWishlistReminder(
  userId: string
) {
  const activeItems =
    await prisma.wishlist.findMany({
      where: {
        userId,
        status: "active",
        remindOnLeak: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

  if (activeItems.length === 0) {
    return [
      "⭐ You don't have any unfinished wishlist goals right now.",
    ].join("\n");
  }

  const now = new Date();

  const sevenDaysAgo =
    new Date(
      now.getTime() -
        7 * 24 * 60 * 60 * 1000
    );

  const expenses =
    await prisma.expense.findMany({
      where: {
        userId,
        occurredAt: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
      select: {
        amount: true,
        currency: true,
        category: true,
      },
    });

  const discretionary =
    expenses.filter(
      (expense) =>
        expense.category &&
        DISCRETIONARY_CATEGORIES.has(
          expense.category
            .trim()
            .toLowerCase()
        )
    );

  const discretionaryTotal =
    discretionary.reduce(
      (
        sum,
        expense
      ) => {
        if (
          expense.currency !== "NGN"
        ) {
          return sum;
        }

        return (
          sum +
          Number(expense.amount)
        );
      },
      0
    );

  const priorityItem =
    activeItems[0];

  const remaining =
    Math.max(
      Number(
        priorityItem.targetAmount
      ) -
        Number(
          priorityItem.savedAmount
        ),
      0
    );

  if (
    discretionaryTotal <= 0 ||
    remaining <= 0
  ) {
    return [
      "⭐ Wishlist check",
      "",
      `${priorityItem.title} still needs ${money(
        remaining,
        priorityItem.currency
      )}.`,
      "No discretionary spending warning is triggered right now.",
    ].join("\n");
  }

  return [
    "⚠️ Wishlist reminder",
    "",
    `You've spent about ${money(
      discretionaryTotal,
      "NGN"
    )} on discretionary categories in the last 7 days.`,
    "",
    `${priorityItem.title} still needs ${money(
      remaining,
      priorityItem.currency
    )}.`,
    "",
    "A little less discretionary spending could help you finish that goal sooner.",
  ].join("\n");
}
