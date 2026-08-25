import { prisma } from "@/lib/prisma";

export type DigestData = {
  todayExpenses: { amount: number; category: string | null }[];
  dueTasks: { title: string; dueAt: Date | null; priority: string }[];
  pendingEvents: { eventType: string; payload: string }[];
};

/**
 * Fetches the raw digest data (today's spending, due tasks, pending
 * cross-module events) without any string formatting — used by both the
 * WhatsApp /digest command (formatted below) and the /api/digest JSON
 * endpoint (for the dashboard), so both stay in sync off one set of
 * queries instead of duplicating them.
 */
export async function getDigestData(userId: string): Promise<DigestData> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayExpenses, dueTasks, pendingEvents] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, occurredAt: { gte: startOfToday } },
      select: { amount: true, category: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        isDone: false,
        OR: [{ dueAt: { lte: endOfToday() } }, { dueAt: null }],
      },
      select: { title: true, dueAt: true, priority: true },
      orderBy: { dueAt: "asc" },
    }),
    prisma.pendingCrossModuleEvent.findMany({
      where: { userId, status: "pending_module" },
      select: { eventType: true, payload: true },
    }),
  ]);

  return {
    todayExpenses: todayExpenses.map((e) => ({ amount: Number(e.amount), category: e.category })),
    dueTasks,
    pendingEvents,
  };
}

/**
 * Builds the chat-friendly digest reply for the WhatsApp /digest command.
 */
export async function generateDailyDigest(userId: string): Promise<string> {
  const { todayExpenses, dueTasks, pendingEvents } = await getDigestData(userId);

  const sections: string[] = ["🗓️ Daily Digest"];

  sections.push(formatSpendingSection(todayExpenses));
  sections.push(formatTasksSection(dueTasks));
  sections.push(formatPendingEventsSection(pendingEvents));

  return sections.join("\n\n");
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatSpendingSection(
  expenses: { amount: number; category: string | null }[]
): string {
  if (expenses.length === 0) return "💰 Spending today: nothing logged yet.";

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category ?? "uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + e.amount);
  }

  const lines = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `  - ${cat}: ₦${amt.toFixed(2)}`);

  return `💰 Spending today: ₦${total.toFixed(2)}\n${lines.join("\n")}`;
}

function formatTasksSection(
  tasks: { title: string; dueAt: Date | null; priority: string }[]
): string {
  if (tasks.length === 0) return "✅ Tasks: nothing due today.";

  const lines = tasks.map((t) => {
    const due = t.dueAt
      ? t.dueAt.toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })
      : "no due date";
    const flag = t.priority === "high" ? " ⚠️" : "";
    return `  - ${t.title} (${due})${flag}`;
  });

  return `✅ Tasks due today:\n${lines.join("\n")}`;
}

function formatPendingEventsSection(
  events: { eventType: string; payload: string }[]
): string {
  if (events.length === 0) return "📥 Nothing queued for future modules.";

  const roundUps = events.filter((e) => e.eventType === "round_up");
  const bills = events.filter((e) => e.eventType === "bill_detected");
  const subs = events.filter((e) => e.eventType === "subscription_detected");

  const parts: string[] = [];

  if (roundUps.length > 0) {
    const totalRoundUp = roundUps.reduce((sum, e) => {
      try {
        return sum + (JSON.parse(e.payload).roundUpAmount ?? 0);
      } catch {
        return sum;
      }
    }, 0);
    parts.push(`  - ${roundUps.length} round-up${roundUps.length > 1 ? "s" : ""} queued (₦${totalRoundUp.toFixed(2)} total) — waiting on AutiSave`);
  }
  if (bills.length > 0) {
    parts.push(`  - ${bills.length} bill mention${bills.length > 1 ? "s" : ""} flagged — waiting on BillGuard`);
  }
  if (subs.length > 0) {
    parts.push(`  - ${subs.length} subscription${subs.length > 1 ? "s" : ""} flagged — waiting on SubManager`);
  }

  return `📥 Queued for future modules:\n${parts.join("\n")}`;
}