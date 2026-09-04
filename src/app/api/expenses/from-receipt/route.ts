import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

const ALLOWED_CURRENCIES = new Set([
  "NGN",
  "USD",
  "GBP",
  "EUR",
]);

const MAX_AMOUNT = 1_000_000_000_000;
const MAX_MERCHANT_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 100;
const MAX_RAW_TEXT_LENGTH = 10_000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error: "Invalid JSON body.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      testUserId,
      merchant,
      amount,
      currency,
      category,
      occurredAt,
      rawText,
    } = body;

    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return NextResponse.json(
        {
          error: "Amount is required.",
        },
        {
          status: 400,
        }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > MAX_AMOUNT
    ) {
      return NextResponse.json(
        {
          error:
            "Amount must be a positive number within the allowed limit.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedCurrency = String(
      currency || "NGN"
    ).toUpperCase();

    if (
      !ALLOWED_CURRENCIES.has(
        normalizedCurrency
      )
    ) {
      return NextResponse.json(
        {
          error: "Unsupported currency.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      merchant !== undefined &&
      merchant !== null &&
      typeof merchant !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Merchant must be a string.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      category !== undefined &&
      category !== null &&
      typeof category !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Category must be a string.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      rawText !== undefined &&
      rawText !== null &&
      typeof rawText !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Raw text must be a string.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedMerchant =
      typeof merchant === "string"
        ? merchant.trim()
        : "";

    const normalizedCategory =
      typeof category === "string"
        ? category.trim()
        : "";

    const normalizedRawText =
      typeof rawText === "string"
        ? rawText.trim()
        : "";

    if (
      normalizedMerchant.length >
      MAX_MERCHANT_LENGTH
    ) {
      return NextResponse.json(
        {
          error: "Merchant name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedCategory.length >
      MAX_CATEGORY_LENGTH
    ) {
      return NextResponse.json(
        {
          error: "Category is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedRawText.length >
      MAX_RAW_TEXT_LENGTH
    ) {
      return NextResponse.json(
        {
          error: "Receipt text is too long.",
        },
        {
          status: 400,
        }
      );
    }

    let parsedOccurredAt = new Date();

    if (occurredAt) {
      const suppliedDate =
        new Date(occurredAt);

      if (
        Number.isNaN(
          suppliedDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid occurredAt date.",
          },
          {
            status: 400,
          }
        );
      }

      parsedOccurredAt =
        suppliedDate;
    }

    const resolved =
      await resolveApiUser(
        testUserId
          ? String(testUserId)
          : null
      );

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

    const user = resolved.user;

    const expense =
      await prisma.expense.create({
        data: {
          userId: user.id,
          amount: numericAmount,
          currency:
            normalizedCurrency,
          category:
            normalizedCategory || null,
          merchant:
            normalizedMerchant || null,
          source: "receipt_ocr",
          rawInput:
            normalizedRawText || null,
          parsedBy:
            "ocr:tesseract",
          occurredAt:
            parsedOccurredAt,
        },
      });

    return NextResponse.json(
      {
        success: true,
        expense: {
          id: expense.id,
          amount: Number(
            expense.amount
          ),
          currency:
            expense.currency,
          category:
            expense.category,
          merchant:
            expense.merchant,
          source:
            expense.source,
          occurredAt:
            expense.occurredAt.toISOString(),
          createdAt:
            expense.createdAt.toISOString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Receipt expense API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save receipt expense.",
      },
      {
        status: 500,
      }
    );
  }
}
