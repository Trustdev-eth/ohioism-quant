import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "oq_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const next = encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/learn", "/learn/:path*", "/admin", "/admin/:path*"],
};
