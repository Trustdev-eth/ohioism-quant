import { NextResponse } from "next/server";
import { grantPaidPlan } from "@/lib/members";
import { findOrder, paidPlanFromOrder, updateOrder } from "@/lib/orders";
import { paymentUnlocksAccess, verifyIpnSignature } from "@/lib/nowpayments";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-nowpayments-sig");
  if (!verifyIpnSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const payload = JSON.parse(raw) as {
    order_id?: string;
    payment_status?: string;
    invoice_id?: string | number;
    pay_address?: string;
    pay_amount?: string | number;
    pay_currency?: string;
  };

  const orderId = String(payload.order_id ?? "");
  if (!orderId) return NextResponse.json({ error: "Missing order" }, { status: 400 });

  const order = await findOrder(orderId);
  if (!order) return NextResponse.json({ error: "Unknown order" }, { status: 404 });

  const status = String(payload.payment_status ?? "").toLowerCase();
  await updateOrder(orderId, {
    status,
    payAddress: payload.pay_address,
    payAmount: payload.pay_amount != null ? String(payload.pay_amount) : undefined,
    payCurrency: payload.pay_currency,
    nowpaymentsInvoiceId: payload.invoice_id != null ? String(payload.invoice_id) : order.nowpaymentsInvoiceId,
  });

  if (paymentUnlocksAccess(status)) {
    const plan = paidPlanFromOrder(order.plan);
    if (plan) {
      await grantPaidPlan(String(order.email), plan);
      await updateOrder(orderId, { paidAt: new Date() });
    }
  }

  return NextResponse.json({ ok: true });
}
