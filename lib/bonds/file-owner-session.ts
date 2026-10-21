import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { newToken, tokenHash } from "./auth-crypto";

export const FILE_OWNER_SESSION_SECONDS = 60 * 60;
type Owner = { id: string; email: string; passwordHash: string };

async function signingKey() {
  const value = JSON.parse(await readFile(join(process.cwd(), ".data", "bonds-deployment-key.json"), "utf8"));
  if (typeof value.key !== "string" || !/^[a-f0-9]{64}$/.test(value.key)) throw new Error("Invalid deployment session key. Rebuild the application.");
  return Buffer.from(value.key, "hex");
}
function signature(payload: string, key: Buffer) {
  return createHmac("sha256", key).update(`bonds-file-owner-v1:${payload}`).digest();
}
export async function createFileOwnerSession(owner: Owner) {
  if (owner.id !== "owner") throw new Error("File sessions are restricted to the owner.");
  const payload = Buffer.from(JSON.stringify({ sub: "owner", credential: tokenHash(`${owner.email}:${owner.passwordHash}`), expiresAt: Date.now() + FILE_OWNER_SESSION_SECONDS * 1000, nonce: newToken() })).toString("base64url");
  return `fo1.${payload}.${signature(payload, await signingKey()).toString("base64url")}`;
}
export async function validFileOwnerSession(token: string, owner: Owner | null) {
  if (!owner || owner.id !== "owner" || token.length > 1024) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "fo1" || !/^[A-Za-z0-9_-]+$/.test(parts[1]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[2])) return false;
  const expected = signature(parts[1], await signingKey());
  const actual = Buffer.from(parts[2], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload.sub === "owner" && payload.credential === tokenHash(`${owner.email}:${owner.passwordHash}`)
      && Number.isSafeInteger(payload.expiresAt) && payload.expiresAt > Date.now()
      && payload.expiresAt <= Date.now() + FILE_OWNER_SESSION_SECONDS * 1000
      && typeof payload.nonce === "string" && /^[A-Za-z0-9_-]{43}$/.test(payload.nonce);
  } catch { return false; }
}
