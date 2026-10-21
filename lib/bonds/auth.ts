import "server-only";
import { cookies } from "next/headers";
import { accountByEmail, accountById, findSession, putSession, removeSession } from "./auth-store";
import { newToken, normalizeEmail, tokenHash, verifyPasswordHash } from "./auth-crypto";
import { fileOwnerMode } from "./auth-mode";
import { createFileOwnerSession, validFileOwnerSession, FILE_OWNER_SESSION_SECONDS } from "./file-owner-session";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-bonds_session" : "bonds_session_v2";
const SESSION_SECONDS = 12 * 60 * 60;
export type BondSession = { userId: string; email: string; isOwner: boolean };

export function ownerEmail() { return ownerAccount()?.email ?? null; }
function ownerAccount() {
  const email = normalizeEmail(process.env.BONDS_ADMIN_EMAIL);
  const passwordHash = process.env.BONDS_ADMIN_PASSWORD_HASH;
  return email && passwordHash ? { id: "owner", email, passwordHash } : null;
}
export async function authenticate(email: string, password: string) {
  const owner = ownerAccount();
  const account = owner?.email === email ? owner : fileOwnerMode() ? null : await accountByEmail(email);
  // Do comparable password work even for unknown email addresses.
  const dummy = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
  const valid = await verifyPasswordHash(password, account?.passwordHash ?? dummy);
  return valid && account ? account : null;
}
export async function createSession(account: { id: string; passwordHash: string }) {
  if (fileOwnerMode()) {
    const owner = ownerAccount();
    if (!owner || account.id !== "owner" || account.passwordHash !== owner.passwordHash) throw new Error("Invalid owner account.");
    return createFileOwnerSession(owner);
  }
  const token = newToken();
  await putSession({ tokenHash: tokenHash(token), userId: account.id, credentialVersion: tokenHash(account.passwordHash), expiresAt: Date.now() + SESSION_SECONDS * 1000 });
  return token;
}
export async function getBondSession(): Promise<BondSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (fileOwnerMode()) {
    const owner = ownerAccount();
    return token && owner && await validFileOwnerSession(token, owner) ? { userId: "owner", email: owner.email, isOwner: true } : null;
  }
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = await findSession(tokenHash(token));
  if (!session) return null;
  const account = session.userId === "owner" ? ownerAccount() : await accountById(session.userId);
  if (!account || tokenHash(account.passwordHash) !== session.credentialVersion) return null;
  return { userId: account.id, email: account.email, isOwner: account.id === "owner" };
}
export async function revokeSession() {
  // Stateless file-mode sessions expire within an hour. Logout clears the
  // browser cookie; shared revocation requires the database-backed mode.
  if (fileOwnerMode()) return;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) await removeSession(tokenHash(token));
}
export function sessionCookie(token: string) {
  return { name: COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: fileOwnerMode() ? FILE_OWNER_SESSION_SECONDS : SESSION_SECONDS };
}
export const expiredSessionCookie = { ...sessionCookie(""), maxAge: 0 };
