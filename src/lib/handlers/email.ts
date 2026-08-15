import { handleEmailCommand as runEmailDigest } from "@/lib/handlers/emailDigest";

export async function handleEmailCommand(userId: string, _args: string): Promise<string> {
  return runEmailDigest(userId);
}