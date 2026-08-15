import { generateDailyDigest } from "@/lib/dailyDigest";

export async function handleDigestCommand(userId: string, _args: string): Promise<string> {
  return generateDailyDigest(userId);
}