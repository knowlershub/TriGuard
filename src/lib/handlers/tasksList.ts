import { prisma } from "@/lib/prisma";

export async function handleTasksCommand(userId: string, _args: string): Promise<string> {
  const tasks = await prisma.task.findMany({
    where: { userId, isDone: false },
    orderBy: { createdAt: "asc" },
  });

  if (tasks.length === 0) {
    return "No open tasks — you're all caught up.";
  }

  const lines = tasks.map((t, i) => {
    const due = t.dueAt
      ? ` (due ${t.dueAt.toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })})`
      : "";
    const flag = t.priority === "high" ? " ⚠️" : "";
    return `${i + 1}. ${t.title}${due}${flag}`;
  });

  return `📋 Open tasks:\n${lines.join("\n")}\n\nMark one done with /done <number>`;
}