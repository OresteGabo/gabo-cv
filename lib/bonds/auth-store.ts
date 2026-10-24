import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { neon } from "@neondatabase/serverless";
import { bondsDatabaseUrl } from "./database-config";

export type Account = { id: string; email: string; passwordHash: string; createdAt?: string };
export type AccountSummary = { id: string; email: string; createdAt: string | null; status: "active" | "disabled" };
export type StoredSession = { tokenHash: string; userId: string; credentialVersion: string; expiresAt: number };
type Invitation = { tokenHash: string; email: string; expiresAt: number; used: boolean };
type LocalAuth = { users: Account[]; sessions: StoredSession[]; invitation: Invitation | null; attempts: Record<string, { count: number; resetAt: number }> };
let queue: Promise<unknown> = Promise.resolve();

function sqlClient() {
  const url = bondsDatabaseUrl();
  if (url) return neon(url);
  if (process.env.NODE_ENV === "production") throw new Error("BONDS_DATABASE_URL is required for production accounts.");
  return null;
}

async function local<T>(change: (data: LocalAuth) => T, write = false): Promise<T> {
  const operation = queue.then(async () => {
    const fileName = (process.env.BONDS_AUTH_FILE_NAME || "bonds-auth.json").replace(/[^a-zA-Z0-9._-]/g, "_");
    // Keep development credentials outside Next's watched source tree. Local
    // auth writes must not trigger a reload in the middle of issuing a cookie.
    const projectKey = createHash("sha256").update(process.cwd()).digest("hex").slice(0, 20);
    const path = join(tmpdir(), "gabo-bonds-auth", projectKey, fileName);
    let data: LocalAuth;
    try { data = JSON.parse(await readFile(path, "utf8")); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      data = { users: [], sessions: [], invitation: null, attempts: {} };
    }
    const result = change(data);
    if (write) {
      data.sessions = data.sessions.filter((session) => session.expiresAt > Date.now());
      for (const [key, value] of Object.entries(data.attempts)) if (value.resetAt <= Date.now()) delete data.attempts[key];
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      const temp = `${path}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(data), { mode: 0o600 });
      await rename(temp, path);
    }
    return result;
  });
  queue = operation.catch(() => undefined);
  return operation;
}

export async function accountByEmail(email: string): Promise<Account | null> {
  const sql = sqlClient();
  if (!sql) return local((data) => data.users.find((user) => user.email === email) ?? null);
  const rows = await sql`SELECT id, email, password_hash AS "passwordHash" FROM bond_users WHERE email = ${email} AND disabled_at IS NULL`;
  return (rows[0] as Account) ?? null;
}
export async function accountById(id: string): Promise<Account | null> {
  const sql = sqlClient();
  if (!sql) return local((data) => data.users.find((user) => user.id === id) ?? null);
  const rows = await sql`SELECT id, email, password_hash AS "passwordHash" FROM bond_users WHERE id = ${id} AND disabled_at IS NULL`;
  return (rows[0] as Account) ?? null;
}
export async function listAccounts(): Promise<AccountSummary[]> {
  const sql = sqlClient();
  if (!sql) return local((data) => data.users.map((user) => ({ id: user.id, email: user.email, createdAt: user.createdAt ?? null, status: "active" as const })).sort((a, b) => a.email.localeCompare(b.email)));
  const rows = await sql`SELECT id, email, created_at::text AS "createdAt", CASE WHEN disabled_at IS NULL THEN 'active' ELSE 'disabled' END AS status FROM bond_users ORDER BY created_at DESC, email`;
  return rows as AccountSummary[];
}
export async function deleteAccount(id: string, email: string): Promise<boolean> {
  // The environment owner is never a deletable database account.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return false;
  const sql = sqlClient();
  if (!sql) {
    const removed = await local((data) => {
      if (!data.users.some((user) => user.id === id && user.email === email)) return false;
      data.users = data.users.filter((user) => user.id !== id);
      data.sessions = data.sessions.filter((session) => session.userId !== id);
      if (data.invitation?.email === email) data.invitation = null;
      return true;
    }, true);
    if (removed) await Promise.all([rm(join(process.cwd(), ".data", "bonds-users", `${id}.json`), { force: true }), rm(join(process.cwd(), ".data", "bonds-users", `${id}-equities.json`), { force: true })]);
    return removed;
  }
  // Delete the account, its purchases, and every session in one atomic statement.
  const rows = await sql`
    WITH removed AS (
      DELETE FROM bond_users WHERE id = ${id} AND email = ${email} RETURNING id
    ), purchases AS (
      DELETE FROM bond_purchases WHERE owner_id IN (SELECT id FROM removed)
    ), equities AS (
      DELETE FROM equity_purchases WHERE owner_id IN (SELECT id FROM removed)
    ), statement_items AS (
      DELETE FROM bond_statement_items WHERE owner_id IN (SELECT id FROM removed)
    ), sessions AS (
      DELETE FROM bond_sessions WHERE user_id IN (SELECT id FROM removed)
    ), invitation AS (
      DELETE FROM bond_registration WHERE email = ${email} AND EXISTS (SELECT 1 FROM removed)
    ) SELECT id FROM removed`;
  return rows.length > 0;
}
export async function putSession(session: StoredSession) {
  const sql = sqlClient();
  if (!sql) return local((data) => { data.sessions.push(session); }, true);
  await sql`INSERT INTO bond_sessions (token_hash, user_id, credential_version, expires_at) VALUES (${session.tokenHash}, ${session.userId}, ${session.credentialVersion}, to_timestamp(${session.expiresAt / 1000}))`;
}
export async function findSession(hash: string): Promise<StoredSession | null> {
  const sql = sqlClient();
  if (!sql) return local((data) => data.sessions.find((session) => session.tokenHash === hash && session.expiresAt > Date.now()) ?? null);
  const rows = await sql`SELECT token_hash AS "tokenHash", user_id AS "userId", credential_version AS "credentialVersion", extract(epoch FROM expires_at)::float8 * 1000 AS "expiresAt" FROM bond_sessions WHERE token_hash = ${hash} AND expires_at > now()`;
  return (rows[0] as StoredSession) ?? null;
}
export async function removeSession(hash: string) {
  const sql = sqlClient();
  if (!sql) return local((data) => { data.sessions = data.sessions.filter((session) => session.tokenHash !== hash); }, true);
  await sql`DELETE FROM bond_sessions WHERE token_hash = ${hash}`;
}
export async function activeInvitation(): Promise<Invitation | null> {
  const sql = sqlClient();
  if (!sql) return local((data) => data.invitation && !data.invitation.used && data.invitation.expiresAt > Date.now() ? data.invitation : null);
  const rows = await sql`SELECT token_hash AS "tokenHash", email, extract(epoch FROM expires_at)::float8 * 1000 AS "expiresAt", false AS used FROM bond_registration WHERE id = true AND used_at IS NULL AND expires_at > now()`;
  return (rows[0] as Invitation) ?? null;
}
export async function putInvitation(invitation: Invitation) {
  const sql = sqlClient();
  if (!sql) return local((data) => { data.invitation = invitation; }, true);
  await sql`INSERT INTO bond_registration (id, token_hash, email, expires_at) VALUES (true, ${invitation.tokenHash}, ${invitation.email}, to_timestamp(${invitation.expiresAt / 1000})) ON CONFLICT (id) DO UPDATE SET token_hash = EXCLUDED.token_hash, email = EXCLUDED.email, expires_at = EXCLUDED.expires_at, used_at = NULL`;
}
export async function closeInvitations() {
  const sql = sqlClient();
  if (!sql) return local((data) => { data.invitation = null; }, true);
  await sql`DELETE FROM bond_registration`;
}
export async function redeemInvitation(hash: string, email: string, passwordHash: string): Promise<Account | null> {
  const id = randomUUID();
  const sql = sqlClient();
  if (!sql) return local((data) => {
    const invitation = data.invitation;
    if (!invitation || invitation.used || invitation.tokenHash !== hash || (invitation.email && invitation.email !== email) || invitation.expiresAt <= Date.now() || data.users.some((user) => user.email === email)) return null;
    const user = { id, email, passwordHash, createdAt: new Date().toISOString() };
    data.users.push(user);
    invitation.used = true;
    return user;
  }, true);
  // Lock the invitation and consume it in the same statement as account creation.
  const rows = await sql`
    WITH usable AS (
      SELECT id FROM bond_registration WHERE id = true AND token_hash = ${hash} AND (email = '' OR email = ${email}) AND used_at IS NULL AND expires_at > now() FOR UPDATE
    ), created AS (
      INSERT INTO bond_users (id, email, password_hash) SELECT ${id}, ${email}, ${passwordHash} FROM usable ON CONFLICT (email) DO NOTHING RETURNING id, email, password_hash AS "passwordHash"
    ), consumed AS (
      UPDATE bond_registration SET used_at = now() WHERE id IN (SELECT id FROM usable) AND EXISTS (SELECT 1 FROM created) RETURNING id
    ) SELECT created.* FROM created CROSS JOIN consumed`;
  return (rows[0] as Account) ?? null;
}
export async function consumeAttempt(key: string, limit: number, windowMs = 15 * 60_000) {
  const sql = sqlClient();
  if (!sql) return local((data) => {
    const now = Date.now();
    const entry = data.attempts[key];
    if (!entry || entry.resetAt <= now) { data.attempts[key] = { count: 1, resetAt: now + windowMs }; return false; }
    entry.count++;
    return entry.count > limit;
  }, true);
  const rows = await sql`WITH expired AS (DELETE FROM bond_auth_attempts WHERE reset_at <= now() AND key <> ${key}) INSERT INTO bond_auth_attempts (key, count, reset_at) VALUES (${key}, 1, now() + (${windowMs} * interval '1 millisecond')) ON CONFLICT (key) DO UPDATE SET count = CASE WHEN bond_auth_attempts.reset_at <= now() THEN 1 ELSE bond_auth_attempts.count + 1 END, reset_at = CASE WHEN bond_auth_attempts.reset_at <= now() THEN EXCLUDED.reset_at ELSE bond_auth_attempts.reset_at END RETURNING count`;
  return Number(rows[0].count) > limit;
}
