import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated =
    !!req.auth;

  const isDashboardRoute =
    req.nextUrl.pathname.startsWith(
      "/dashboard"
    );

  const isAuthPage =
    req.nextUrl.pathname === "/login" ||
    req.nextUrl.pathname === "/signup";

  if (
    isDashboardRoute &&
    !isAuthenticated
  ) {
    const loginUrl =
      new URL(
        "/login",
        req.nextUrl.origin
      );

    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  if (
    isAuthPage &&
    isAuthenticated
  ) {
    return NextResponse.redirect(
      new URL(
        "/dashboard",
        req.nextUrl.origin
      )
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};