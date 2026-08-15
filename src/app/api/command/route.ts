import { NextRequest, NextResponse } from "next/server";
import { handleForwardedSms } from "@/lib/handlers/smsForward";
import { getOrCreateUser } from "@/lib/users";
import { parseCommand, routeCommand } from "@/lib/commandRouter";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.testUserId || !body?.text) {
    return NextResponse.json(
      { error: "Body must include testUserId and text" },
      { status: 400 }
    );
  }

  const user = await getOrCreateUser("test", body.testUserId);
  const parsed = parseCommand(body.text);

  const reply = parsed
    ? await routeCommand(user.id, parsed)
    : await handleForwardedSms(user.id, body.text);

  return NextResponse.json({ reply });
}