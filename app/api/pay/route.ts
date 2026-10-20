import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkoutAmountUsd } from "@/lib/plans";
import { createOrder } from "@/lib/orders";
import { appUrl, createNowpaymentsInvoice, ipnCallbackUrl } from "@/lib/nowpayments";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const member = await getSession();
  if (!member) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (member.blocked) return NextResponse.json({ error: "This account is blocked." }, { status: 403 });

  const limit = rateLimit(`pay:${member.email}`, 6, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many checkout attempts." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const target = body?.plan === "pro" ? "pro" : body?.plan === "basic" ? "basic" : null;
  if (!target) return NextResponse.json({ error: "Choose Basic or Pro." }, { status: 400 });

  const amountUsd = checkoutAmountUsd(member.plan, target);
  if (amountUsd == null) {
    return NextResponse.json({ error: "That plan is already included on this account." }, { status: 400 });
  }

  const orderId = `oq_${randomUUID()}`;
  const base = appUrl(request);
  let invoice;
  try {
    invoice = await createNowpaymentsInvoice({
      priceAmount: amountUsd,
      orderId,
      orderDescription: `OhioismQuant ${target} — ${member.email}`,
      successUrl: `${base}/account?paid=1&order=${orderId}`,
      cancelUrl: `${base}/account?canceled=1`,
      ipnCallbackUrl: ipnCallbackUrl(request),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NOWPayments invoice failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await createOrder({
    orderId,
    email: member.email,
    plan: target,
    amountUsd,
    nowpaymentsInvoiceId: invoice.invoiceId,
    invoiceUrl: invoice.invoiceUrl,
    status: "waiting",
  });

  return NextResponse.json({ invoiceUrl: invoice.invoiceUrl, orderId });
}
