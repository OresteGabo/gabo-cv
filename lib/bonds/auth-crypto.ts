import "server-only";
import { createHash, randomBytes, scrypt, pbkdf2, timingSafeEqual } from "node:crypto";
import { PASSWORD_SETUP_ITERATIONS, PASSWORD_SETUP_PREFIX } from "./password-setup";

export const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
function derive(password: string, salt: string, modern: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, modern ? { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 } : {}, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derive(password, salt, true)).toString("hex")}`;
}
export async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  if (typeof password !== "string" || password.length > 128) return false;
  if (stored.startsWith("pbkdf2-sha256:")) {
    const match = /^pbkdf2-sha256:600000:([a-f0-9]{32}):([a-f0-9]{64})$/i.exec(stored);
    if (!match) return false;
    const actual = await new Promise<Buffer>((resolve, reject) => pbkdf2(password, Buffer.from(match[1], "hex"), PASSWORD_SETUP_ITERATIONS, 32, "sha256", (error, key) => error ? reject(error) : resolve(key)));
    return timingSafeEqual(actual, Buffer.from(match[2], "hex"));
  }
  const modern = stored.startsWith("scrypt:") || stored.startsWith("scrypt$");
  const [salt, hex] = modern ? stored.slice(7).split(stored[6]) : stored.split(":");
  if (!/^[a-f0-9]{32}$/i.test(salt ?? "") || !/^[a-f0-9]{128}$/i.test(hex ?? "")) return false;
  const actual = await derive(password, salt, modern);
  return timingSafeEqual(actual, Buffer.from(hex, "hex"));
}

export function supportedPasswordHash(stored: string) {
  if (stored.startsWith(PASSWORD_SETUP_PREFIX)) return /^pbkdf2-sha256:600000:[a-f0-9]{32}:[a-f0-9]{64}$/i.test(stored);
  return /^(?:scrypt:)?[a-f0-9]{32}:[a-f0-9]{128}$/i.test(stored)
    || /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/i.test(stored);
}
