import { prisma } from "@/lib/prisma";
import { fetchRecentUnreadEmails } from "@/lib/gmail";
import { summarizeEmail } from "@/lib/emailSummarizerGemini";
import { queuePendingEvent } from "@/lib/pendingEvents";

const db = prisma as any;

export async function handleEmailCommand(userId: string): Promise<string> {
  const account = await db.emailAccount.findUnique({
    where: { userId_provider: { userId, provider: "gmail" } },
  });

  if (!account) {
    const authUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/auth/gmail/start?userId=${userId}`;
    return `Gmail isn't connected yet. Connect it here: ${authUrl}`;
  }

  const emails = await fetchRecentUnreadEmails(userId, 5);
  if (emails === null) {
    return "Couldn't reach Gmail — your connection may have expired. Try reconnecting.";
  }
  if (emails.length === 0) {
    return "No unread emails right now — inbox is clear.";
  }

  const digestLines: string[] = [];

  for (const email of emails) {
    const summary = await summarizeEmail(email.subject, email.from, email.snippet);

    if (!summary) {
      await prisma.emailLog.create({
        data: { userId, subject: email.subject, summary: null, detectedType: null, routedTo: null },
      });
      digestLines.push(`• ${email.subject} — (couldn't summarize)`);
      continue;
    }

    let routedTo: string | null = null;

    if (summary.detectedType === "action_item") {
      await prisma.task.create({
        data: {
          userId,
          title: `Re: ${email.subject}`,
          source: "inbox_routing",
        },
      });
      routedTo = "TaskSnap";
    } else if (summary.detectedType === "subscription") {
      await queuePendingEvent(userId, "subscription_detected", {
        subject: email.subject,
        from: email.from,
      });
      routedTo = "SubManager (pending)";
    } else if (summary.detectedType === "bill") {
      routedTo = "Minderra";
    }

    await prisma.emailLog.create({
      data: {
        userId,
        subject: email.subject,
        summary: summary.bullets.join(" | "),
        detectedType: summary.detectedType,
        routedTo,
      },
    });

    const tag = routedTo ? ` [→ ${routedTo}]` : "";
    digestLines.push(`• ${email.subject}${tag}\n  ${summary.bullets.join("\n  ")}`);
  }

  return `📬 Inbox digest (${emails.length} unread):\n\n${digestLines.join("\n\n")}`;
}