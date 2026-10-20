import { getDb } from "@/lib/mongo";

const KEY = "payout";

export async function getPayoutWallet(): Promise<string | null> {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: KEY });
  return typeof doc?.wallet === "string" ? doc.wallet : null;
}

export async function setPayoutWallet(wallet: string) {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: KEY },
    { $set: { key: KEY, wallet, updatedAt: new Date() } },
    { upsert: true },
  );
}
