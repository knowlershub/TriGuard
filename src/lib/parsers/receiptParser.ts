export type ParsedReceipt = {
  amount: string | null;
  merchant: string | null;
};

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const amount = extractTotal(lines);
  const merchant = extractMerchant(lines);

  return { amount, merchant };
}

function extractTotal(lines: string[]): string | null {
  const totalLine = lines.find((l) => /\btotal\b/i.test(l) && !/subtotal/i.test(l));
  const searchLines = totalLine ? [totalLine] : lines;

  for (const line of searchLines) {
    const numbers = line.match(/[\d,]+\.\d{2}/g);
    if (numbers && numbers.length > 0) {
      return numbers[numbers.length - 1].replace(/,/g, "");
    }
  }

  return null;
}

function extractMerchant(lines: string[]): string | null {
  const candidate = lines
    .slice(0, 5)
    .find((l) => /[a-zA-Z]{3,}/.test(l) && !/\d{4,}/.test(l));

  return candidate ?? null;
}