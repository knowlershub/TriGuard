import { handleExpenseCommand } from "@/lib/handlers/expense";
import { handleDigestCommand } from "@/lib/handlers/digest";
import { handleTaskCommand } from "@/lib/handlers/task";
import { handleEmailCommand } from "@/lib/handlers/email";
import { handleTasksCommand } from "@/lib/handlers/tasksList";
import { handleDoneCommand } from "@/lib/handlers/done";
import { handleExpensesListCommand } from "@/lib/handlers/expensesList";
import { handleWishlistCommand } from "@/lib/handlers/wishlist";

export type ParsedCommand = {
  command: string;
  args: string;
};

const HELP_TEXT = `
🤖 Minderra Bot — Commands

💰 EXPENSES

/expense <amount> <description>
Add a new expense.

Example:
/expense 5000 groceries

/expenses
View your recent expenses.

Example:
/expenses

⭐ WISHLIST

/wishlist add <item> <amount>
Save something you want to buy.

Example:
/wishlist add Sony headphones 180000

/wishlist list
View unfinished wishlist goals.

/wishlist save <item> <amount>
Add money you've saved toward a goal.

/wishlist done <item>
Mark a wishlist goal as completed.

/wishlist reminder
Check whether recent discretionary spending is getting in the way.

✅ TASKS

/task <task description>
Create a new task.

Example:
/task Buy groceries

/tasks
View your current tasks.

Example:
/tasks

/done <task>
Mark a task as completed.

Example:
/done Buy groceries


📧 EMAIL

/email <message>
Send or process an email command.

Example:
/email Show me my latest emails


📊 REPORTS

/digest
Get your spending/activity digest.

Example:
/digest


📸 RECEIPTS

You can also send a receipt photo directly to this bot.

Minderra will:
• Download the receipt
• Read the receipt using OCR
• Extract the expense information
• Save the expense to your account


🔗 TELEGRAM CONNECTION

/start
Start or connect your Telegram account to Minderra.

The safest way to connect is:
Minderra Settings → Connect Telegram → open the generated Telegram link.

/id
Show your Telegram account ID.

Example:
/id


❓ HELP

/help
Show this command guide.

Tips:
• Commands start with /
• You can send normal text when you are not using a command.
• For receipts, send the receipt photo directly.
`.trim();

export function parseCommand(raw: string): ParsedCommand | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\/(\w+)\s*(.*)$/);

  if (!match) {
    return null;
  }

  return {
    command: match[1].toLowerCase(),
    args: match[2],
  };
}

export async function routeCommand(
  userId: string,
  parsed: ParsedCommand
): Promise<string> {
  switch (parsed.command) {
    case "help":
      return HELP_TEXT;

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


    case "wishlist":
      return handleWishlistCommand(
        userId,
        parsed.args
      );

    case "email":
      return handleEmailCommand(userId, parsed.args);

    case "digest":
      return handleDigestCommand(userId, parsed.args);

    default:
      return `Unknown command: /${parsed.command}.

Try /help to see all available Minderra commands.`;
  }
}
