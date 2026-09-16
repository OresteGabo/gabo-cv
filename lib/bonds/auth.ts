import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bonds_session";
const SESSION_SECONDS = 60 * 60 * 12;
export const TEMPORARY_ADMIN_EMAIL = "orestegabo@icloud.com";
const TEMPORARY_ADMIN_PASSWORD_HASH =
  "22176e6d36c0374353a59bc510c86773:98c0316c06edcd0d4a7c391df19148aa23c6ebdc0b4b8f866c04ae6eb6c62f538cebca99f93fab58eb51d8c83adc26a6c076adc0fdadc46ce71a436eb792319a";
const TEMPORARY_SESSION_SECRET =
  "temporary-bonds-session-secret-replace-before-public-launch";

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function configuredSessionSecret() {
  const secret =
    process.env.BONDS_SESSION_SECRET?.trim() || TEMPORARY_SESSION_SECRET;
  if (secret.length < 32) {
    throw new Error("BONDS_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyPassword(password: string): boolean {
  const stored =
    process.env.BONDS_ADMIN_PASSWORD_HASH?.trim() ||
    TEMPORARY_ADMIN_PASSWORD_HASH;

  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;

  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionToken(email: string): string {
  const secret = configuredSessionSecret();
  const payload = encode(
    JSON.stringify({
      email,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
    } satisfies SessionPayload),
  );
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const secret = configuredSessionSecret();
  const expectedSignature = sign(payload, secret);
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
