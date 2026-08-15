import { prisma } from "@/lib/prisma";
import { refreshAccessToken } from "@/lib/googleOAuth";

export type GmailMessage = {
  id: string;
  subject: string;
  snippet: string;
  from: string;
};

async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.emailAccount.findUnique({
    where: { userId_provider: { userId, provider: "gmail" } },
  });

  if (!account) return null;

  const expiresIn30Sec = new Date(Date.now() + 30_000);
  if (account.expiresAt > expiresIn30Sec) {
    return account.accessToken;
  }

  const refreshed = await refreshAccessToken(account.refreshToken);
  if (!refreshed) return null;

  await prisma.emailAccount.update({
    where: { userId_provider: { userId, provider: "gmail" } },
    data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
  });

  return refreshed.accessToken;
}

export async function fetchRecentUnreadEmails(
  userId: string,
  maxResults = 5
): Promise<GmailMessage[] | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return null;

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=is:unread`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listRes.ok) {
    console.error(`[gmail] Failed to list messages (${listRes.status})`);
    return null;
  }

  const listData = await listRes.json();
  const ids: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id);

  const messages: GmailMessage[] = [];
  for (const id of ids) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!msgRes.ok) continue;

    const msgData = await msgRes.json();
    const headers: { name: string; value: string }[] = msgData.payload?.headers ?? [];
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
    const from = headers.find((h) => h.name === "From")?.value ?? "(unknown sender)";

    messages.push({ id, subject, from, snippet: msgData.snippet ?? "" });
  }

  return messages;
}