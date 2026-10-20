import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { isAdmin } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orders = await listOrders();
  return NextResponse.json({ orders });
}
