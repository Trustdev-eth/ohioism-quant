import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), name), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const i = trimmed.indexOf("=");
        if (i < 0) continue;
        const key = trimmed.slice(0, i).trim();
        let value = trimmed.slice(i + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // missing file is fine
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

function usage() {
  console.error("Usage: npm run member -- <email> <password> [free|basic|pro|admin]");
  process.exit(1);
}

loadEnv();

const [, , emailArg, passwordArg, planArg = "free"] = process.argv;
if (!emailArg || !passwordArg) usage();

const email = String(emailArg).trim().toLowerCase();
const plan = String(planArg).trim().toLowerCase();
const plans = new Set(["free", "basic", "pro", "admin"]);
if (!plans.has(plan)) usage();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "ohioismquant";
if (!uri) {
  console.error("MONGODB_URI is missing. Put the original Atlas URI in .env.local.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const members = db.collection("members");
await members.createIndex({ email: 1 }, { unique: true });

const passwordHash = hashPassword(passwordArg);
const existing = await members.findOne({ email });
if (existing) {
  await members.updateOne({ email }, { $set: { plan, passwordHash } });
  console.log(`Updated ${email} → ${plan}`);
} else {
  await members.insertOne({
    email,
    passwordHash,
    plan,
    createdAt: new Date(),
  });
  console.log(`Created ${email} → ${plan}`);
}

await client.close();
