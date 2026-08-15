import { BankParser, ParsedTransaction } from "@/lib/parsers/types";

export const gtbankParser: BankParser = {
  bankId: "gtbank",

  matchesSender(raw: string): boolean {
    return /gtbank/i.test(raw) && !/gtbank\./i.test(raw);
  },

  parse(raw: string): ParsedTransaction | null {
    const amountMatch = raw.match(/NGN\s?([\d,]+\.\d{2})/i);
    if (!amountMatch) return null;

    const direction: "debit" | "credit" = /\bDR\b/i.test(raw)
      ? "debit"
      : /\bCR\b/i.test(raw)
        ? "credit"
        : "debit";

    const descMatch = raw.match(/Desc:?\s*([^.]+?)(?=\s*(Bal|Ref|Available|$))/i);
    const description = descMatch ? descMatch[1].trim() : null;

    return {
      amount: amountMatch[1].replace(/,/g, ""),
      direction,
      description,
      bank: "gtbank",
      confidence: "high",
    };
  },
};