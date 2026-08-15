import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthUrl } from "@/lib/googleOAuth";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId query param" }, { status: 400 });
  }

  const authUrl = getGmailAuthUrl(userId);
  return NextResponse.redirect(authUrl);
}