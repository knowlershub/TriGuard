import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

type TailrideInvoice = {
  id?: unknown;
  documentType?: unknown;
  amount?: unknown;
  currency?: unknown;
  invoiceDate?: unknown;
  receivedDate?: unknown;
  tags?: unknown;

  vendor?: {
    name?: unknown;
  } | null;

  attachment?: {
    url?: unknown;
    filename?: unknown;
    mimeType?: unknown;
    expiresAt?: unknown;
  } | null;

  supportingDocuments?: unknown;
};

type TailrideWebhookPayload = {
  event?: unknown;
  timestamp?: unknown;
  invoice?: TailrideInvoice;
  data?: {
    invoice?: TailrideInvoice;
  };
};

function getWebhookSecret(): string | null {
  return (
    process.env.TAILRIDE_WEBHOOK_SECRET?.trim() ||
    null
  );
}

function verifySignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (
    !timestampHeader ||
    !signatureHeader
  ) {
    return false;
  }

  const timestamp =
    Number(timestampHeader);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const age =
    Math.abs(
      Math.floor(Date.now() / 1000) -
        timestamp
    );

  if (age > MAX_WEBHOOK_AGE_SECONDS) {
    return false;
  }

  const expected =
    "v1=" +
    createHmac("sha256", secret)
      .update(
        `${timestampHeader}.${rawBody}`
      )
      .digest("hex");

  const actualBuffer =
    Buffer.from(signatureHeader);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actualBuffer,
    expectedBuffer
  );
}

function getInvoice(
  payload: TailrideWebhookPayload
): TailrideInvoice | null {
  if (
    payload.invoice &&
    typeof payload.invoice === "object"
  ) {
    return payload.invoice;
  }

  if (
    payload.data?.invoice &&
    typeof payload.data.invoice === "object"
  ) {
    return payload.data.invoice;
  }

  return null;
}

function getString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function getAmount(
  value: unknown
): string | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return null;
  }

  return value.toString();
}

function getDate(
  value: unknown
): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getTailrideTags(
  invoice: TailrideInvoice
): string[] {
  if (!Array.isArray(invoice.tags)) {
    return [];
  }

  return invoice.tags.filter(
    (tag): tag is string =>
      typeof tag === "string" &&
      tag.trim().length > 0
  );
}

function getMerchant(
  invoice: TailrideInvoice
): string | null {
  if (
    invoice.vendor &&
    typeof invoice.vendor.name ===
      "string"
  ) {
    return (
      invoice.vendor.name.trim() || null
    );
  }

  return null;
}

function getOccurredAt(
  invoice: TailrideInvoice
): Date | null {
  return (
    getDate(invoice.invoiceDate) ??
    getDate(invoice.receivedDate)
  );
}

export async function POST(
  req: NextRequest
) {
  try {
    const secret =
      getWebhookSecret();

    if (!secret) {
      console.error(
        "[tailride webhook] Missing TAILRIDE_WEBHOOK_SECRET."
      );

      return NextResponse.json(
        {
          error:
            "Tailride webhook is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const rawBody =
      await req.text();

    const timestamp =
      req.headers.get(
        "x-tailride-timestamp"
      );

    const signature =
      req.headers.get(
        "x-tailride-signature"
      );

    if (
      !verifySignature(
        rawBody,
        timestamp,
        signature,
        secret
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Tailride webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    let payload: TailrideWebhookPayload;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON payload.",
        },
        {
          status: 400,
        }
      );
    }

    const event =
      getString(payload.event);

    if (!event) {
      return NextResponse.json(
        {
          error:
            "Tailride event is missing.",
        },
        {
          status: 400,
        }
      );
    }

    if (event !== "invoice.processed") {
      return NextResponse.json({
        status: "ignored",
        event,
      });
    }

    const invoice =
      getInvoice(payload);

    if (!invoice) {
      return NextResponse.json(
        {
          error:
            "Tailride invoice is missing.",
        },
        {
          status: 400,
        }
      );
    }

    const tailrideId =
      getString(invoice.id);

    if (!tailrideId) {
      return NextResponse.json(
        {
          error:
            "Tailride invoice ID is missing.",
        },
        {
          status: 400,
        }
      );
    }

    const tags =
      getTailrideTags(invoice);

    const intakeTag =
      tags.find((tag) =>
        tag
          .trim()
          .toLowerCase()
          .startsWith("triguard_")
      );

    const connection =
      intakeTag
        ? await prisma.tailrideConnection.findUnique({
            where: {
              intakeTag,
            },
            select: {
              userId: true,
            },
          })
        : null;

    if (!connection) {
      console.error(
        "[tailride webhook] No TriGuard user mapping found."
      );

      return NextResponse.json(
        {
          error:
            "Tailride invoice is not associated with a TriGuard account.",
        },
        {
          status: 422,
        }
      );
    }

    const existing =
      await prisma.tailrideInvoice.findUnique({
        where: {
          tailrideId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (existing) {
      return NextResponse.json({
        status: "duplicate",
        tailrideId,
        recordId: existing.id,
        recordStatus: existing.status,
      });
    }

    const amount =
      getAmount(invoice.amount);

    const currency =
      getString(invoice.currency)?.toUpperCase() ??
      null;

    const occurredAt =
      getOccurredAt(invoice);

    const record =
      await prisma.$transaction(
        async (tx) => {
          const stored =
            await tx.tailrideInvoice.create({
              data: {
                tailrideId,
                event,
                documentType:
                  getString(
                    invoice.documentType
                  ),
                amount,
                currency,
                merchant:
                  getMerchant(invoice),
                occurredAt,
                status: "received",
                userId:
                  connection.userId,
                payload:
                  payload as object,
              },
              select: {
                id: true,
                tailrideId: true,
                status: true,
              },
            });

          const expense =
            await tx.expense.create({
              data: {
                userId:
                  connection.userId,
                amount:
                  amount!,
                currency:
                  currency!,
                category:
                  getTailrideTags(invoice)
                    .filter(
                      (tag) =>
                        !tag
                          .toLowerCase()
                          .startsWith("triguard_")
                    )[0] ??
                  "Other",
                merchant:
                  getMerchant(invoice) ??
                  "Tailride receipt",
                source:
                  "tailride",
                rawInput:
                  `Tailride invoice ${tailrideId}`,
                occurredAt:
                  occurredAt ?? new Date(),
              },
              select: {
                id: true,
              },
            });

          await tx.tailrideInvoice.update({
            where: {
              id: stored.id,
            },
            data: {
              status: "processed",
            },
          });

          return {
            recordId: stored.id,
            tailrideId:
              stored.tailrideId,
            expenseId:
              expense.id,
          };
        }
      );

    console.log(
      "[tailride webhook] Invoice processed:",
      record.tailrideId,
      "expense:",
      record.expenseId
    );

    return NextResponse.json(
      {
        status: "processed",
        id: record.recordId,
        tailrideId:
          record.tailrideId,
        expenseId:
          record.expenseId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[tailride webhook] Processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to process Tailride webhook.",
      },
      {
        status: 500,
      }
    );
  }
}
