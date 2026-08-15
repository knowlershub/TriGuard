import { handleExpenseCommand } from "@/lib/handlers/expense";
import { handleDigestCommand } from "@/lib/handlers/digest";
import { handleTaskCommand } from "@/lib/handlers/task";
import { handleEmailCommand } from "@/lib/handlers/email";
import { handleTasksCommand } from "@/lib/handlers/tasksList";
import { handleDoneCommand } from "@/lib/handlers/done";
import { handleExpensesListCommand } from "@/lib/handlers/expensesList";

export type ParsedCommand = {
  command: string;
  args: string;
};

export function parseCommand(raw: string): ParsedCommand | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\/(\w+)\s*(.*)$/);
  if (!match) return null;

  return {
    command: match[1].toLowerCase(),
    args: match[2],
  };
}

export async function routeCommand(userId: string, parsed: ParsedCommand): Promise<string> {
  switch (parsed.command) {
    case "expense":
      return handleExpenseCommand(userId, parsed.args);
    case "task":
      return handleTaskCommand(userId, parsed.args);
    case "tasks":
      return handleTasksCommand(userId, parsed.args);
    case "done":
      return handleDoneCommand(userId, parsed.args);
    case "expenses":
      return handleExpensesListCommand(userId, parsed.args);
    case "email":
      return handleEmailCommand(userId, parsed.args);
    case "digest":
      return handleDigestCommand(userId, parsed.args);
    default:
      return `Unknown command: /${parsed.command}. Try /expense, /task, /email, or /digest.`;
  }
}