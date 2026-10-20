import { NextResponse } from "next/server";
import { SESSION_COOKIE, PLAY_COOKIE, PLAY_TOKEN_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(PLAY_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(PLAY_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
