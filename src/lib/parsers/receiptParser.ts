export type ParsedReceipt = {
  amount: string | null;
  merchant: string | null;
};

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const amount = extractTotal(lines);
  const merchant = extractMerchant(lines);

  return {
    amount,
    merchant,
  };
}

function extractTotal(lines: string[]): string | null {
  /*
   * Prefer explicitly labelled totals/balances.
   *
   * Examples:
   *   Total: $590
   *   Grand Total ₦2,350.00
   *   Balance Due: $590
   */
  const priorityPatterns = [
    /\bgrand\s+total\b/i,
    /\bbalance\s+due\b/i,
    /\bamount\s+due\b/i,
    /\btotal\s+due\b/i,
    /\btotal\b/i,
  ];

  for (const pattern of priorityPatterns) {
    for (const line of lines) {
      if (!pattern.test(line) || /\bsub\s*total\b/i.test(line)) {
        continue;
      }

      const amount = extractLargestMoneyValue(line);

      if (amount) {
        return amount;
      }
    }
  }

  /*
   * If no explicit total was found, fall back to the largest
   * money value appearing anywhere in the receipt.
   */
  const amounts: number[] = [];

  for (const line of lines) {
    const matches = extractMoneyValues(line);

    for (const value of matches) {
      amounts.push(Number(value));
    }
  }

  if (amounts.length === 0) {
    return null;
  }

  const largest = Math.max(...amounts);

  return largest.toFixed(2);
}

function extractMerchant(lines: string[]): string | null {
  /*
   * Ignore obvious document labels and contact/invoice metadata.
   */
  const ignoredPatterns = [
    /^invoice\b/i,
    /^receipt\b/i,
    /^bill\s+to\b/i,
    /^ship\s+to\b/i,
    /^date\b/i,
    /^issued\s+date\b/i,
    /^due\s+date\b/i,
    /^balance\s+due\b/i,
    /^amount\s+due\b/i,
    /^total\b/i,
    /^subtotal\b/i,
    /^price\b/i,
    /^services?\b/i,
    /^quantity\b/i,
    /^qty\b/i,
    /^phone\b/i,
    /^email\b/i,
  ];

  /*
   * A merchant is usually near the top of the document.
   *
   * We first look for a meaningful text line that does not look
   * like an invoice label, email, phone number, address, or date.
   */
  for (const line of lines.slice(0, 12)) {
    if (line.length < 3 || line.length > 80) {
      continue;
    }

    if (ignoredPatterns.some((pattern) => pattern.test(line))) {
      continue;
    }

    if (/@/.test(line)) {
      continue;
    }

    if (/\(\d{3}\)|\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(line)) {
      continue;
    }

    if (/\bissued\s+date\b|\bbalance\s+due\b/i.test(line)) {
      continue;
    }

    /*
     * Skip lines that are mostly numbers/address information.
     */
    const letters = line.match(/[A-Za-z]/g)?.length ?? 0;
    const digits = line.match(/\d/g)?.length ?? 0;

    if (letters < 3) {
      continue;
    }

    if (digits > letters) {
      continue;
    }

    /*
     * "INVOICE Robert Johnson" is a document label plus a person's
     * name. Strip the label when appropriate.
     */
    const cleaned = line
      .replace(/^invoice\s*[:#-]?\s*/i, "")
      .replace(/^receipt\s*[:#-]?\s*/i, "")
      .trim();

    if (!cleaned) {
      continue;
    }

    return cleaned;
  }

  return null;
}

function extractLargestMoneyValue(line: string): string | null {
  const values = extractMoneyValues(line);

  if (values.length === 0) {
    return null;
  }

  const largest = Math.max(...values.map(Number));

  return largest.toFixed(2);
}

function extractMoneyValues(line: string): string[] {
  /*
   * Supports examples such as:
   *
   * $590
   * $590.00
   * ₦2,350
   * ₦2,350.00
   * 590
   * 590.00
   *
   * We deliberately require either a currency symbol or a decimal
   * format so ordinary numbers such as phone numbers are less likely
   * to be mistaken for money.
   */
  const currencyMatches =
    line.match(
      /(?:[$€£₦]\s*)\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|(?:[$€£₦]\s*)\d+(?:\.\d{1,2})?/g
    ) ?? [];

  const decimalMatches =
    line.match(/\b\d+(?:,\d{3})*(?:\.\d{2})\b/g) ?? [];

  const normalized = [
    ...currencyMatches,
    ...decimalMatches,
  ]
    .map((value) =>
      value
        .replace(/[$€£₦\s]/g, "")
        .replace(/,/g, "")
    )
    .filter((value) => /^\d+(?:\.\d{1,2})?$/.test(value));

  /*
   * Remove duplicates while preserving order.
   */
  return [...new Set(normalized)];
}