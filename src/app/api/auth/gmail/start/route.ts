import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthUrl } from "@/lib/googleOAuth";
import { getOrCreateUser } from "@/lib/users";

export async function GET(req: NextRequest) {
  const externalUserId = req.nextUrl.searchParams.get("userId");

  if (!externalUserId) {
    return NextResponse.json(
      { error: "Missing userId query param" },
      { status: 400 }
    );
  }

  const user = await getOrCreateUser(
    "test",
    externalUserId
  );

  const authUrl = getGmailAuthUrl(user.id);

  return NextResponse.redirect(authUrl);
}