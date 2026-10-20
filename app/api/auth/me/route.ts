import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { publicMember } from "@/lib/plans";

export async function GET() {
  const member = await getSession();
  if (!member) return NextResponse.json({ member: null });
  if (member.blocked) {
    return NextResponse.json({
      member: null,
      blocked: true,
      blockedReason: member.blockedReason ?? "blocked",
    });
  }
  return NextResponse.json({ member: publicMember(member) });
}
