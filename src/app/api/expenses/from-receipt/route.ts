import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveApiUser } from "@/lib/apiAuth";

const ALLOWED_CURRENCIES = new Set([
  "NGN",
  "USD",
  "GBP",
  "EUR",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
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
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Amount must be a positive number.",
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
            typeof category === "string" &&
            category.trim()
              ? category.trim()
              : null,
          merchant:
            typeof merchant === "string" &&
            merchant.trim()
              ? merchant.trim()
              : null,
          source: "receipt_ocr",
          rawInput:
            typeof rawText ===
              "string" &&
            rawText.trim()
              ? rawText.trim()
              : null,
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