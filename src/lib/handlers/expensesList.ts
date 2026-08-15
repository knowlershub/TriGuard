import { prisma } from "@/lib/prisma";

export async function handleExpensesListCommand(userId: string, _args: string): Promise<string> {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  if (expenses.length === 0) {
    return "No expenses logged yet.";
  }

  const lines = expenses.map((e) => {
    const date = e.occurredAt.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    const label = e.category ? ` — ${e.category}` : "";
    return `${date}: ₦${e.amount}${label}`;
  });

  return `🧾 Last ${expenses.length} expenses:\n${lines.join("\n")}`;
}