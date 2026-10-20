import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "ohioismquant";

let client: MongoClient | null = null;
let db: Db | null = null;
let indexesReady = false;

export async function getDb(): Promise<Db> {
  if (db && indexesReady) return db;
  if (!uri) throw new Error("MONGODB_URI is missing");
  if (!client) client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  if (!indexesReady) {
    await Promise.all([
      db.collection("members").createIndex({ email: 1 }, { unique: true }),
      db.collection("videos").createIndex({ lessonId: 1 }, { unique: true }),
      db.collection("orders").createIndex({ orderId: 1 }, { unique: true }),
    ]);
    indexesReady = true;
  }
  return db;
}
