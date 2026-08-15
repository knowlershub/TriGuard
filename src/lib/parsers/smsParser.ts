import { BankParser, ParsedTransaction } from "@/lib/parsers/types";
import { gtbankParser } from "@/lib/parsers/banks/gtbank";

const bankParsers: BankParser[] = [gtbankParser];

export type SmsParseResult =
  | { status: "matched"; transaction: ParsedTransaction }
  | { status: "unmatched" };

export function parseSms(raw: string): SmsParseResult {
  for (const bank of bankParsers) {
    if (!bank.matchesSender(raw)) continue;
    const transaction = bank.parse(raw);
    if (transaction) {
      return { status: "matched", transaction };
    }
  }
  return { status: "unmatched" };
}