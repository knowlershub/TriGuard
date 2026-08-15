import { prisma } from "@/lib/prisma";
import { checkLeakAlert } from "@/lib/leakAlert";
import { calculateRoundUp } from "@/lib/roundUp";
import { queuePendingEvent } from "@/lib/pendingEvents";

export async function handleExpenseCommand(userId: string, args: string): Promise<string> {
  const trimmed = args.trim();
  const match = trimmed.match(/^(\d+(?:\.\d{1,2})?)\s*(.*)$/);

  if (!match) {
    return "Couldn't read that. Try: /expense 500 data";
  }

  const amount = match[1];
  const description = match[2].trim() || null;

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount,
      category: description,
      source: "manual_text",
      rawInput: trimmed,
      parsedBy: "manual_command",
    },
  });

  const label = description ? ` (${description})` : "";
  const alert = await checkLeakAlert(userId, expense.category);

  const roundUp = calculateRoundUp(Number(expense.amount));
  if (roundUp > 0) {
    await queuePendingEvent(userId, "round_up", {
      expenseId: expense.id,
      roundUpAmount: roundUp,
    });
  }

  return alert
    ? `Logged ₦${expense.amount}${label}.\n${alert}`
    : `Logged ₦${expense.amount}${label}.`;
}