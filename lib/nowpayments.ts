import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.nowpayments.io/v1";
const UNLOCK_STATUSES = new Set(["finished", "confirmed", "sending"]);

type InvoiceInput = {
  priceAmount: number;
  orderId: string;
  orderDescription: string;
  successUrl: string;
  cancelUrl: string;
  ipnCallbackUrl: string;
};

function apiKey() {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new Error("NOWPAYMENTS_API_KEY is missing");
  return key;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export async function createNowpaymentsInvoice(input: InvoiceInput) {
  const res = await fetch(`${API}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
    },
    body: JSON.stringify({
      price_amount: input.priceAmount,
      price_currency: "usd",
      order_id: input.orderId,
      order_description: input.orderDescription,
      ipn_callback_url: input.ipnCallbackUrl,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }),
  });
  const data = (await res.json()) as {
    id?: string | number;
    invoice_url?: string;
    message?: string;
  };
  if (!res.ok || !data.invoice_url) {
    throw new Error(data.message || "NOWPayments invoice failed");
  }
  return {
    invoiceId: String(data.id ?? ""),
    invoiceUrl: data.invoice_url,
  };
}

export function paymentUnlocksAccess(status: string | undefined | null) {
  return Boolean(status && UNLOCK_STATUSES.has(status.toLowerCase()));
}

export function verifyIpnSignature(rawBody: string, signature: string | null) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const sorted = JSON.stringify(sortKeys(payload));
  const digest = createHmac("sha512", secret).update(sorted).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function ipnCallbackUrl() {
  const base = appUrl();
  if (/localhost|127\.0\.0\.1/i.test(base)) {
    return undefined;
  }
  return `${base}/api/pay/ipn`;
}
