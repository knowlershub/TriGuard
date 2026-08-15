export type ParsedTransaction = {
  amount: string;
  direction: "debit" | "credit";
  description: string | null;
  bank: string;
  confidence: "high" | "medium";
};

export type BankParser = {
  bankId: string;
  matchesSender: (raw: string) => boolean;
  parse: (raw: string) => ParsedTransaction | null;
};