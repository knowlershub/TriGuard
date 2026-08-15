import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchGmailAddress } from "@/lib/googleOAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(`Gmail connection failed: ${error}`, { status: 400 });
  }

  if (!code || !userId) {
    return new NextResponse("Missing code or state in callback.", { status: 400 });
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens) {
    return new NextResponse(
      "Couldn't complete Gmail connection — token exchange failed. Check server logs.",
      { status: 500 }
    );
  }

  const emailAddress = await fetchGmailAddress(tokens.accessToken);
  if (!emailAddress) {
    return new NextResponse("Connected, but couldn't verify the Gmail address.", { status: 500 });
  }

  await prisma.emailAccount.upsert({
    where: { userId_provider: { userId, provider: "gmail" } },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      emailAddress,
    },
    create: {
      userId,
      provider: "gmail",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      emailAddress,
    },
  });

  return new NextResponse(
    `Gmail connected: ${emailAddress}. You can close this tab and return to WhatsApp.`,
    { status: 200 }
  );
}