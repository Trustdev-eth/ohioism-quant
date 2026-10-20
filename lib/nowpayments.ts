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

function isLocalHost(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value);
}

export function appUrl(request?: Request) {
  const host = (request?.headers.get("x-forwarded-host") || request?.headers.get("host") || "")
    .split(",")[0]
    .trim();
  const protoHeader = (request?.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (host && !isLocalHost(host)) {
    const proto = protoHeader === "http" ? "http" : "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  const env = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (env && !isLocalHost(env)) return env;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://ohioismquant.vip";
}

export function ipnCallbackUrl(request?: Request) {
  const base = appUrl(request);
  if (isLocalHost(base)) return "https://ohioismquant.vip/api/pay/ipn";
  return `${base}/api/pay/ipn`;
}

type PaymentRow = {
  order_id?: string;
  invoice_id?: string | number;
  payment_id?: string | number;
  payment_status?: string;
};

function paymentRows(payload: unknown): PaymentRow[] {
  if (Array.isArray(payload)) return payload as PaymentRow[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: PaymentRow[] }).data;
  }
  return [];
}

function statusForMatch(rows: PaymentRow[], orderId: string, invoiceId?: string | null) {
  const matches = rows.filter((row) => {
    if (String(row.order_id ?? "") === orderId) return true;
    return Boolean(invoiceId) && String(row.invoice_id ?? "") === String(invoiceId);
  });
  const unlocked = matches.find((row) => paymentUnlocksAccess(row.payment_status));
  const status = unlocked?.payment_status || matches[0]?.payment_status;
  return status ? String(status).toLowerCase() : null;
}

export async function paymentStatusForOrder(
  orderId: string,
  invoiceId?: string | null,
  paymentId?: string | null,
) {
  const headers = { "x-api-key": apiKey() };
  if (paymentId) {
    const res = await fetch(`${API}/payment/${encodeURIComponent(paymentId)}`, { headers, cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { payment_status?: string; order_id?: string };
      if (!data.order_id || String(data.order_id) === orderId) {
        if (data.payment_status) return String(data.payment_status).toLowerCase();
      }
    }
  }
  if (invoiceId) {
    const invoiceQueries = [
      `${API}/payment/?invoiceid=${encodeURIComponent(invoiceId)}&limit=50`,
      `${API}/payment/?invoiceId=${encodeURIComponent(invoiceId)}&limit=50`,
    ];
    for (const url of invoiceQueries) {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.status === 401 || res.status === 403) break;
      if (!res.ok) continue;
      const status = statusForMatch(paymentRows(await res.json()), orderId, invoiceId);
      if (status) return status;
    }
  }
  return null;
}
