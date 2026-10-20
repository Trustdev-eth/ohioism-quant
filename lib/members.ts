import { ObjectId, type WithId, type Document } from "mongodb";
import { getDb } from "@/lib/mongo";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isPlan, type Plan } from "@/lib/plans";

export type { Plan };

export type Member = {
  id: string;
  email: string;
  passwordHash: string;
  plan: Plan;
  createdAt: Date;
  blocked?: boolean;
  blockedAt?: Date;
  blockedReason?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fromDoc(doc: WithId<Document> | null): Member | null {
  if (!doc) return null;
  const plan = isPlan(doc.plan) ? doc.plan : "free";
  return {
    id: String(doc._id),
    email: String(doc.email ?? ""),
    passwordHash: String(doc.passwordHash ?? ""),
    plan,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt ?? Date.now()),
    blocked: Boolean(doc.blocked),
    blockedAt: doc.blockedAt instanceof Date ? doc.blockedAt : undefined,
    blockedReason: typeof doc.blockedReason === "string" ? doc.blockedReason : undefined,
  };
}

export async function findMemberByEmail(email: string): Promise<Member | null> {
  const db = await getDb();
  const doc = await db.collection("members").findOne({ email: normalizeEmail(email) });
  return fromDoc(doc);
}

export async function findMemberById(id: string): Promise<Member | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection("members").findOne({ _id: new ObjectId(id) });
  return fromDoc(doc);
}

export async function createMember(input: { email: string; password: string; plan?: Plan }): Promise<Member> {
  const email = normalizeEmail(input.email);
  const db = await getDb();
  const now = new Date();
  const doc = {
    email,
    passwordHash: await hashPassword(input.password),
    plan: input.plan ?? "free",
    createdAt: now,
  };
  const result = await db.collection("members").insertOne(doc);
  return {
    id: String(result.insertedId),
    email,
    passwordHash: doc.passwordHash,
    plan: doc.plan,
    createdAt: now,
  };
}

export async function authenticateMember(email: string, password: string): Promise<Member | null> {
  const member = await findMemberByEmail(email);
  if (!member) return null;
  const ok = await verifyPassword(password, member.passwordHash);
  return ok ? member : null;
}

export async function grantPaidPlan(email: string, plan: "basic" | "pro"): Promise<Member | null> {
  const db = await getDb();
  const current = await findMemberByEmail(email);
  if (!current) return null;
  if (current.plan === "admin") return current;
  if (current.plan === "pro") return current;
  if (current.plan === "basic" && plan === "basic") return current;
  await db.collection("members").updateOne({ email: normalizeEmail(email) }, { $set: { plan } });
  return findMemberByEmail(email);
}

export async function setMemberPlan(email: string, plan: Plan): Promise<Member | null> {
  const db = await getDb();
  await db.collection("members").updateOne({ email: normalizeEmail(email) }, { $set: { plan } });
  return findMemberByEmail(email);
}

export async function blockMember(email: string, reason: string): Promise<boolean> {
  const current = await findMemberByEmail(email);
  if (!current || current.plan === "admin") return false;
  const db = await getDb();
  await db.collection("members").updateOne(
    { email: normalizeEmail(email) },
    { $set: { blocked: true, blockedAt: new Date(), blockedReason: reason } },
  );
  return true;
}

export async function unblockMember(email: string): Promise<void> {
  const db = await getDb();
  await db.collection("members").updateOne(
    { email: normalizeEmail(email) },
    { $unset: { blocked: "", blockedAt: "", blockedReason: "" } },
  );
}

export async function listMembers(limit = 200): Promise<Member[]> {
  const db = await getDb();
  const docs = await db.collection("members").find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((doc) => fromDoc(doc)).filter((member): member is Member => Boolean(member));
}

export async function upsertMember(input: { email: string; password?: string; plan: Plan }): Promise<Member> {
  const email = normalizeEmail(input.email);
  const existing = await findMemberByEmail(email);
  const db = await getDb();
  const update: Document = { plan: input.plan };
  if (input.password) update.passwordHash = await hashPassword(input.password);
  if (existing) {
    await db.collection("members").updateOne({ email }, { $set: update });
    const member = await findMemberByEmail(email);
    if (!member) throw new Error("Member update failed");
    return member;
  }
  return createMember({ email, password: input.password || crypto.randomUUID(), plan: input.plan });
}
