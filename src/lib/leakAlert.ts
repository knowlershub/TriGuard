import { prisma } from "@/lib/prisma";

const LEAK_THRESHOLD_PCT = 0.15; // 15%, per the original spec
const MIN_PRIOR_MONTHS_FOR_ALERT = 2; // cold-start guard — see note below

/**
 * Checks whether this month's spending in a category is a "leak" — i.e.
 * meaningfully above the user's own historical average for that category.
 *
 * Cold-start handling: a single prior month isn't a real average (one
 * unusually cheap/expensive month would trigger false alerts constantly),
 * so we require at least MIN_PRIOR_MONTHS_FOR_ALERT months of history
 * before ever firing. New users just get silent logging until they have
 * enough history — no guessed baseline, no misleading alert.
 *
 * Returns an alert message if the leak threshold is crossed, otherwise null.
 */
export async function checkLeakAlert(
  userId: string,
  category: string | null
): Promise<string | null> {
  if (!category) return null;

  const expenses = await prisma.expense.findMany({
    where: { userId, category },
    select: { amount: true, occurredAt: true },
  });

  const monthTotals = new Map<string, number>();
  for (const e of expenses) {
    const key = monthKey(e.occurredAt);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + Number(e.amount));
  }

  const currentMonth = monthKey(new Date());
  const currentTotal = monthTotals.get(currentMonth) ?? 0;

  const priorMonthTotals = [...monthTotals.entries()]
    .filter(([key]) => key !== currentMonth)
    .map(([, total]) => total);

  if (priorMonthTotals.length < MIN_PRIOR_MONTHS_FOR_ALERT) {
    return null;
  }

  const average =
    priorMonthTotals.reduce((sum, t) => sum + t, 0) / priorMonthTotals.length;

  if (average <= 0) return null;

  const percentOver = (currentTotal - average) / average;

  if (percentOver > LEAK_THRESHOLD_PCT) {
    const pctLabel = Math.round(percentOver * 100);
    return `⚠️ You've spent ${pctLabel}% more on ${category} this month than your usual average.`;
  }

  return null;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}