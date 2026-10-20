import { getDb } from "@/lib/mongo";
import type { Plan } from "@/lib/plans";

export type OrderStatus = "waiting" | "confirming" | "confirmed" | "sending" | "finished" | "failed" | "expired" | "refunded";

export type Order = {
  orderId: string;
  email: string;
  plan: "basic" | "pro";
  amountUsd: number;
  nowpaymentsInvoiceId?: string;
  invoiceUrl?: string;
  payAddress?: string;
  payAmount?: string;
  payCurrency?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
};

export async function createOrder(input: {
  orderId: string;
  email: string;
  plan: "basic" | "pro";
  amountUsd: number;
  nowpaymentsInvoiceId?: string;
  invoiceUrl?: string;
  status?: string;
}) {
  const db = await getDb();
  const now = new Date();
  const doc = {
    ...input,
    status: input.status ?? "waiting",
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("orders").insertOne(doc);
  return doc;
}

export async function findOrder(orderId: string) {
  const db = await getDb();
  return db.collection("orders").findOne({ orderId });
}

export async function updateOrder(orderId: string, patch: Record<string, unknown>) {
  const db = await getDb();
  await db.collection("orders").updateOne({ orderId }, { $set: { ...patch, updatedAt: new Date() } });
}

export function paidPlanFromOrder(plan: unknown): "basic" | "pro" | null {
  return plan === "basic" || plan === "pro" ? plan : null;
}

export async function listOrders(limit = 200) {
  const db = await getDb();
  const docs = await db.collection("orders").find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((doc) => ({
    orderId: String(doc.orderId ?? ""),
    email: String(doc.email ?? ""),
    plan: String(doc.plan ?? ""),
    amountUsd: Number(doc.amountUsd ?? 0),
    status: String(doc.status ?? ""),
    invoiceUrl: typeof doc.invoiceUrl === "string" ? doc.invoiceUrl : null,
    nowpaymentsInvoiceId: doc.nowpaymentsInvoiceId != null ? String(doc.nowpaymentsInvoiceId) : null,
    payCurrency: typeof doc.payCurrency === "string" ? doc.payCurrency : null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    paidAt: doc.paidAt instanceof Date ? doc.paidAt.toISOString() : null,
  }));
}

export type CheckoutPlan = Extract<Plan, "basic" | "pro">;
