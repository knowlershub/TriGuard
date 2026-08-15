const BILL_KEYWORDS = [
  "bill", "subscription", "rent due", "pay by", "renewal", "invoice", "premium due",
];

export function detectsBillMention(text: string): boolean {
  const lower = text.toLowerCase();
  return BILL_KEYWORDS.some((kw) => lower.includes(kw));
}