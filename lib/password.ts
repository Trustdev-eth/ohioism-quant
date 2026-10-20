import { randomBytes, scrypt as scryptCb, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

function compare(password: string, salt: string, hash: string) {
  const next = scryptSync(password, salt, KEYLEN);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    return compare(password, salt, hash);
  }

  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return compare(password, salt, hash);
}
