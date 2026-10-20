import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { blockMember, listMembers, setMemberPlan, unblockMember, upsertMember } from "@/lib/members";
import { isAdmin, isPlan, type Plan } from "@/lib/plans";

function serialize(member: Awaited<ReturnType<typeof listMembers>>[number]) {
  return {
    id: member.id,
    email: member.email,
    plan: member.plan,
    createdAt: member.createdAt.toISOString(),
    blocked: Boolean(member.blocked),
    blockedAt: member.blockedAt?.toISOString() ?? null,
    blockedReason: member.blockedReason ?? null,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const members = await listMembers();
  return NextResponse.json({ members: members.map(serialize) });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !isAdmin(session.plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    plan?: string;
    blocked?: boolean;
    password?: string;
  } | null;
  const email = String(body?.email ?? "").trim();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  let plan: Plan | undefined;
  if (typeof body?.plan === "string") {
    if (!isPlan(body.plan)) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    plan = body.plan;
    await setMemberPlan(email, body.plan);
  }
  if (typeof body?.password === "string" && body.password.length >= 8) {
    const current = (await listMembers()).find((item) => item.email === email.toLowerCase());
    await upsertMember({ email, password: body.password, plan: plan ?? current?.plan ?? "free" });
  }
  if (body?.blocked === true) await blockMember(email, "admin");
  if (body?.blocked === false) await unblockMember(email);

  const members = await listMembers();
  const member = members.find((item) => item.email === email.toLowerCase()) ?? members.find((item) => item.email === email);
  return NextResponse.json({ member: member ? serialize(member) : null });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isAdmin(session.plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    plan?: string;
  } | null;
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  const plan = body?.plan;
  if (!email || password.length < 8 || !isPlan(plan)) {
    return NextResponse.json({ error: "Email, password (8+), and plan are required." }, { status: 400 });
  }
  const member = await upsertMember({ email, password, plan });
  return NextResponse.json({ member: serialize(member) });
}
