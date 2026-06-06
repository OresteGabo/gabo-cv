import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bonds_session";
const SESSION_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  const secret = process.env.BONDS_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BONDS_SESSION_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyPassword(password: string): boolean {
  const stored = process.env.BONDS_ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;

  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionToken(email: string): string {
  const payload = encode(
    JSON.stringify({
      email,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
    } satisfies SessionPayload),
  );
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionPayload;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export async function getBondSession() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export const expiredSessionCookie = {
  name: COOKIE_NAME,
  value: "",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 0,
};
