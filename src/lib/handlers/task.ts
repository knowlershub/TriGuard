import { prisma } from "@/lib/prisma";
import { enrichTask } from "@/lib/taskEnrichment";
import { detectsBillMention } from "@/lib/billDetection";
import { queuePendingEvent } from "@/lib/pendingEvents";

export async function handleTaskCommand(userId: string, args: string): Promise<string> {
  const trimmed = args.trim();

  if (!trimmed) {
    return "Couldn't read that. Try: /task Meeting with John tomorrow at 3pm";
  }

  const { title, dueAt, priority } = enrichTask(trimmed);

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      dueAt,
      priority,
      source: "manual_command",
    },
  });

  const dueLabel = task.dueAt
    ? ` (due ${task.dueAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })})`
    : "";
  const priorityLabel = task.priority !== "medium" ? ` [${task.priority} priority]` : "";

  if (detectsBillMention(trimmed)) {
    await queuePendingEvent(userId, "bill_detected", {
      taskId: task.id,
      snippet: trimmed,
    });
  }

  return `Added task: "${task.title}"${dueLabel}${priorityLabel}`;
}