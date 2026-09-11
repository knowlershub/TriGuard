import { prisma } from "@/lib/prisma";
import { extractTextFromImage } from "@/lib/ocr/tesseractOcr";
import { parseReceiptText } from "@/lib/parsers/receiptParser";

const RECEIPT_PENDING_MINUTES = 15;

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

export async function handleReceiptImage(
  userId: string,
  imageBuffer: Buffer
): Promise<string> {
  const rawText =
    await extractTextFromImage(
      imageBuffer
    );

  if (!rawText) {
    return [
      "I couldn't read any text from that receipt.",
      "",
      "Please send a clearer photo and try again.",
    ].join("\n");
  }

  const {
    amount,
    merchant,
  } =
    parseReceiptText(rawText);

  if (!amount) {
    return [
      "I found text on the receipt, but I couldn't identify a total amount.",
      "",
      "Please send a clearer receipt photo.",
    ].join("\n");
  }

  /*
   * Cancel older unresolved receipt reviews
   * before creating the newest one.
   */
  await prisma.pendingReceipt.updateMany({
    where: {
      userId,
      status: "pending",
    },
    data: {
      status: "superseded",
    },
  });

  const expiresAt =
    new Date(
      Date.now() +
        RECEIPT_PENDING_MINUTES *
          60 *
          1000
    );

  const pending =
    await prisma.pendingReceipt.create({
      data: {
        userId,
        amount,
        currency: "NGN",
        merchant:
          merchant?.trim() || null,
        rawText:
          rawText.slice(0, 10000),
        status: "pending",
        expiresAt,
      },
    });

  const merchantText =
    pending.merchant
      ? pending.merchant
      : "Unknown merchant";

  return [
    "🧾 Receipt detected",
    "",
    `Merchant: ${merchantText}`,
    `Amount: ${formatMoney(
      Number(pending.amount),
      pending.currency
    )}`,
    "",
    `This review expires in ${RECEIPT_PENDING_MINUTES} minutes.`,
    "",
    "Reply YES to save this as an expense.",
    "Reply NO to discard it.",
  ].join("\n");
}

export async function handlePendingReceiptReply(
  userId: string,
  rawReply: string
): Promise<string | null> {
  const reply =
    rawReply
      .trim()
      .toLowerCase();

  if (
    reply !== "yes" &&
    reply !== "no"
  ) {
    return null;
  }

  const pending =
    await prisma.pendingReceipt.findFirst({
      where: {
        userId,
        status: "pending",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (!pending) {
    return null;
  }

  if (
    pending.expiresAt.getTime() <
    Date.now()
  ) {
    await prisma.pendingReceipt.update({
      where: {
        id: pending.id,
      },
      data: {
        status: "expired",
      },
    });

    return [
      "That receipt review has expired.",
      "",
      "Please send the receipt again.",
    ].join("\n");
  }

  if (reply === "no") {
    await prisma.pendingReceipt.update({
      where: {
        id: pending.id,
      },
      data: {
        status: "rejected",
      },
    });

    return [
      "Receipt discarded.",
      "",
      "It was not added to your expenses.",
    ].join("\n");
  }

  const expense =
    await prisma.expense.create({
      data: {
        userId,
        amount: pending.amount,
        currency: pending.currency,
        merchant:
          pending.merchant,
        category:
          pending.merchant,
        source: "receipt_ocr",
        rawInput:
          pending.rawText,
        parsedBy: "ocr:tesseract",
      },
    });

  await prisma.pendingReceipt.update({
    where: {
      id: pending.id,
    },
    data: {
      status: "confirmed",
    },
  });

  const merchantText =
    expense.merchant
      ? ` at ${expense.merchant}`
      : "";

  return [
    "✅ Receipt saved.",
    "",
    `Logged ${formatMoney(
      Number(expense.amount),
      expense.currency
    )}${merchantText}.`,
  ].join("\n");
}
