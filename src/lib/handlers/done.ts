import { prisma } from "@/lib/prisma";

export async function handleDoneCommand(userId: string, args: string): Promise<string> {
  const index = parseInt(args.trim(), 10);

  if (isNaN(index) || index < 1) {
    return "Usage: /done <number> — check /tasks for the current numbering.";
  }

  const tasks = await prisma.task.findMany({
    where: { userId, isDone: false },
    orderBy: { createdAt: "asc" },
  });

  const target = tasks[index - 1];
  if (!target) {
    return `No task #${index} — you have ${tasks.length} open task${tasks.length === 1 ? "" : "s"}. Check /tasks.`;
  }

  await prisma.task.update({
    where: { id: target.id },
    data: { isDone: true },
  });

  return `✅ Marked done: "${target.title}"`;
}