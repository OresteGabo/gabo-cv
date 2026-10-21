import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import makeLoader from './helpers/load-ts.mjs';

const originalEnv = { ...process.env };
let key = randomBytes(32).toString('hex');
const cookies = new Map();
const overrides = {
  '@neondatabase/serverless': { neon: () => { throw new Error('File owner mode must not connect to Postgres'); } },
  'next/headers': { cookies: async () => ({ get: name => cookies.has(name) ? { value: cookies.get(name) } : undefined }) },
  'node:fs/promises': { readFile: async () => JSON.stringify({ key }) },
};
const load = makeLoader(overrides);
const auth = load('lib/bonds/auth.ts');
const crypto = load('lib/bonds/auth-crypto.ts');
const password = 'isolated owner regression password';
let configuredHash;

test.before(async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.BONDS_DATABASE_URL;
  delete process.env.BONDS_ADMIN_EMAIL;
  delete process.env.BONDS_ADMIN_PASSWORD_HASH;
  delete process.env.BONDS_APP_ORIGIN;
  process.env.BONDS_PORTFOLIO_DATABASE = 'file';
  configuredHash = await crypto.hashPassword(password);
});
test.after(() => { process.env = originalEnv; });

test('JSON authentication needs no database and never falls back to exposed credentials', async () => {
  assert.equal(auth.ownerEmail(), null);
  assert.equal(await auth.authenticate('stranger@example.test', password), null);
  assert.equal(await auth.getBondSession(), null);
  const { NextRequest } = await import('next/server.js');
  const response = await load('app/api/bonds/auth/login/route.ts').POST(new NextRequest('https://bonds.example.test/api/bonds/auth/login', {
    method: 'POST', headers: { origin: 'https://bonds.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'qa-owner@example.test', password }),
  }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/);
});
test('private owner configuration works without a database and requires both credential values', async () => {
  process.env.BONDS_ADMIN_EMAIL = 'qa-owner@example.test';
  assert.equal(auth.ownerEmail(), null);
  process.env.BONDS_ADMIN_PASSWORD_HASH = configuredHash;
  assert.equal(await auth.authenticate('stranger@example.test', password), null);
  const account = await auth.authenticate('qa-owner@example.test', password);
  assert.equal(account.id, 'owner');
  assert.equal(await auth.authenticate(account.email, 'incorrect'), null);
});
test('signed owner cookies work across separate server instances without writable shared files', async () => {
  const account = await auth.authenticate('qa-owner@example.test', password);
  const token = await auth.createSession(account);
  assert.ok(token.startsWith('fo1.'));
  assert.notEqual(token, await auth.createSession(account));
  cookies.set('__Host-bonds_session', token);
  const otherServer = makeLoader(overrides)('lib/bonds/auth.ts');
  assert.deepEqual(await otherServer.getBondSession(), { userId: 'owner', email: account.email, isOwner: true });
  assert.equal(otherServer.sessionCookie(token).maxAge, 3600);
  assert.equal(otherServer.sessionCookie(token).httpOnly, true);
  assert.equal(otherServer.sessionCookie(token).secure, true);
  await assert.rejects(auth.createSession({ id: 'guest', passwordHash: configuredHash }));
});
test('tampering, expiry, credential changes, deployment key rotation, and old signed cookies reject access', async () => {
  const account = await auth.authenticate('qa-owner@example.test', password);
  const token = await auth.createSession(account);
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
  payload.sub = 'guest';
  cookies.set('__Host-bonds_session', `fo1.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${parts[2]}`);
  assert.equal(await auth.getBondSession(), null);
  cookies.set('__Host-bonds_session', token);
  const now = Date.now;
  try { Date.now = () => now() + 3600_001; assert.equal(await auth.getBondSession(), null); }
  finally { Date.now = now; }
  process.env.BONDS_ADMIN_PASSWORD_HASH = await crypto.hashPassword('a different owner passphrase');
  assert.equal(await auth.getBondSession(), null);
  process.env.BONDS_ADMIN_PASSWORD_HASH = configuredHash;
  key = randomBytes(32).toString('hex');
  assert.equal(await auth.getBondSession(), null);
  for (const forged of ['payload.signature', 'x'.repeat(43), `${token}.extra`, `fo1.${'x'.repeat(1500)}.${parts[2]}`]) {
    cookies.set('__Host-bonds_session', forged);
    assert.equal(await auth.getBondSession(), null);
  }
});
test('JSON production keeps registration closed and allows sign-in immediately after repeated failed attempts', async () => {
  const { NextRequest } = await import('next/server.js');
  const request = new NextRequest('https://bonds.example.test/api/bonds/auth/register', {
    method: 'POST', headers: { origin: 'https://bonds.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'guest@example.test', password, isOwner: true }),
  });
  const response = await load('app/api/bonds/auth/register/route.ts').POST(request);
  assert.equal(response.status, 403);
  const login = load('app/api/bonds/auth/login/route.ts').POST;
  const signIn = supplied => login(new NextRequest('https://bonds.example.test/api/bonds/auth/login', {
    method: 'POST', headers: { origin: 'https://bonds.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'qa-owner@example.test', password: supplied }),
  }));
  for (let i = 0; i < 7; i++) assert.equal((await signIn('incorrect password')).status, 401);
  const success = await signIn(password);
  assert.equal(success.status, 200);
  assert.equal((await success.json()).user.isOwner, true);
});
test('database mode never accepts file-owner tokens or silently falls back during a database outage', async () => {
  const account = await auth.authenticate('qa-owner@example.test', password);
  const token = await auth.createSession(account);
  process.env.BONDS_DATABASE_URL = 'postgresql://test.invalid/test';
  cookies.set('__Host-bonds_session', token);
  assert.equal(await auth.getBondSession(), null);
  await assert.rejects(auth.createSession(account), /must not connect/);
  delete process.env.BONDS_DATABASE_URL;
  process.env.BONDS_PORTFOLIO_DATABASE = 'database';
  await assert.rejects(auth.createSession(account), /required for production/);
});
