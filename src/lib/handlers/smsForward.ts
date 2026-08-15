import { prisma } from "@/lib/prisma";
import { parseSms } from "@/lib/parsers/smsParser";
import { checkLeakAlert } from "@/lib/leakAlert";
import { calculateRoundUp } from "@/lib/roundUp";
import { queuePendingEvent } from "@/lib/pendingEvents";

export async function handleForwardedSms(userId: string, raw: string): Promise<string> {
  const result = parseSms(raw);

  if (result.status === "unmatched") {
    return "That doesn't look like a command or a bank alert I recognize yet. Try /expense 500 data to log it manually.";
  }

  const { transaction } = result;

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: transaction.amount,
      category: transaction.description,
      source: "sms_forward",
      rawInput: raw,
      parsedBy: `rule:${transaction.bank}`,
    },
  });

  const label = transaction.description ? ` (${transaction.description})` : "";
  const alert = await checkLeakAlert(userId, expense.category);
  const base = `Logged ₦${expense.amount}${label} from ${transaction.bank}.`;

  const roundUp = calculateRoundUp(Number(expense.amount));
  if (roundUp > 0) {
    await queuePendingEvent(userId, "round_up", {
      expenseId: expense.id,
      roundUpAmount: roundUp,
    });
  }

  return alert ? `${base}\n${alert}` : base;
}