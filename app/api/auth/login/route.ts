import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { authenticateMember } from "@/lib/members";
import { publicMember } from "@/lib/plans";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(`login:${ip}`, 12, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  const member = await authenticateMember(email, password);
  if (!member) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (member.blocked) {
    return NextResponse.json({ error: "This account is blocked.", blocked: true }, { status: 403 });
  }

  const token = await signSession(member);
  const res = NextResponse.json({ member: publicMember(member) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
