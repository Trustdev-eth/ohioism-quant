import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findMemberById, type Member } from "@/lib/members";

export const SESSION_COOKIE = "oq_session";
export const PLAY_COOKIE = "oq_play";
export const PLAY_TOKEN_COOKIE = "oq_play_tok";
const SESSION_DAYS = 14;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function signSession(member: Pick<Member, "id" | "email" | "plan">) {
  return new SignJWT({ email: member.email, plan: member.plan })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(member.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function getSession(): Promise<Member | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = String(payload.sub ?? "");
    if (!id) return null;
    return findMemberById(id);
  } catch {
    return null;
  }
}

export async function signPlayGrant(lessonId: string) {
  return new SignJWT({ lessonId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secretKey());
}

export async function readPlayGrant(): Promise<string | null> {
  const token = (await cookies()).get(PLAY_TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const lessonId = String(payload.lessonId ?? "");
    return lessonId || null;
  } catch {
    return null;
  }
}

export function playCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2,
  };
}
