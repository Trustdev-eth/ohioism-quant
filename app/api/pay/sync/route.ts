import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findMemberByEmail, grantPaidPlan } from "@/lib/members";
import { listOrdersForEmail, paidPlanFromOrder, updateOrder } from "@/lib/orders";
import { paymentStatusForOrder, paymentUnlocksAccess } from "@/lib/nowpayments";
import { publicMember } from "@/lib/plans";

export async function POST() {
  const member = await getSession();
  if (!member) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (member.blocked) return NextResponse.json({ error: "blocked" }, { status: 403 });

  const orders = await listOrdersForEmail(member.email);
  let granted = false;
  for (const order of orders) {
    const orderId = String(order.orderId ?? "");
    if (!orderId) continue;
    const invoiceId = order.nowpaymentsInvoiceId != null ? String(order.nowpaymentsInvoiceId) : null;
    const paymentId = order.paymentId != null ? String(order.paymentId) : null;
    let status = String(order.status ?? "");
    try {
      status = (await paymentStatusForOrder(orderId, invoiceId, paymentId)) || status;
    } catch {
      // Keep the stored status if NOWPayments is unreachable.
    }
    if (!paymentUnlocksAccess(status)) continue;
    const plan = paidPlanFromOrder(order.plan);
    if (!plan) continue;
    await grantPaidPlan(member.email, plan);
    await updateOrder(orderId, { status, paidAt: new Date() });
    granted = true;
  }

  const updated = (await findMemberByEmail(member.email)) ?? member;
  return NextResponse.json({
    granted,
    member: publicMember(updated),
  });
}
