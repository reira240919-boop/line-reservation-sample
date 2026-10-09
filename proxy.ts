import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isSessionValueValid } from "@/lib/session";

export function proxy(request: NextRequest) {
  const sessionValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!isSessionValueValid(sessionValue)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
