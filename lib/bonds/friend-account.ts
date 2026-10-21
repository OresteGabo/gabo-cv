import "server-only";
import { normalizeEmail, supportedPasswordHash, tokenHash } from "./auth-crypto";

export function configuredFriend() {
  const email = normalizeEmail(process.env.BONDS_FRIEND_EMAIL);
  const passwordHash = process.env.BONDS_FRIEND_PASSWORD_HASH?.trim();
  if (!email || email === normalizeEmail(process.env.BONDS_ADMIN_EMAIL) || !passwordHash || !supportedPasswordHash(passwordHash)) return null;
  // Stable across password changes and deployments, separate from the owner.
  const hex = tokenHash(`bonds-environment-friend:${email}`);
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  return { id, email, passwordHash };
}
