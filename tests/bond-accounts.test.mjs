import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID, scryptSync } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import makeLoader from './helpers/load-ts.mjs';

const pg = new PGlite();
const sql = async (strings, ...values) => (await pg.query(strings.reduce((text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''), ''), values)).rows;
const cookieValues = new Map();
const load = makeLoader({ '@neondatabase/serverless': { neon: () => sql }, 'next/headers': { cookies: async () => ({ get: name => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined }) } });
const store = load('lib/bonds/auth-store.ts');
const crypto = load('lib/bonds/auth-crypto.ts');
const auth = load('lib/bonds/auth.ts');
const db = load('lib/bonds/db.ts');
const requestTools = load('lib/bonds/request.ts');
const originalEnv = { ...process.env };
const password = 'a unique test passphrase 2026';
const userA = randomUUID(), userB = randomUUID();
const purchase = { instrumentType:'treasury',issuer:'Government of Rwanda',currency:'RWF',market:'primary',purchaseDate:'2026-01-01',settlementDate:'2026-01-02',bondName:'Isolated test bond',isin:'TEST0000001',tenorYears:3,faceValue:1000000,pricePercent:100,accruedInterestPaid:0,feesPaid:0,amountInvested:1000000,couponRate:0.1,withholdingTaxRate:0.05,maturityDate:'2029-01-02',firstCouponDate:'2026-07-02',couponDates:['2026-07-02'],couponFrequency:2,scheduleConfidence:'estimated',broker:'',accountReference:'',sourceUrl:'',status:'active',notes:'' };

test.before(async () => {
  process.env.BONDS_DATABASE_URL = 'postgresql://test.invalid/mock';
  process.env.BONDS_PORTFOLIO_DATABASE = 'database';
  process.env.BONDS_ADMIN_EMAIL = 'owner@example.test';
  process.env.BONDS_ADMIN_PASSWORD_HASH = await crypto.hashPassword(password);
  await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
});
test.after(async () => { process.env = originalEnv; await pg.close(); });

test('passwords use randomized scrypt hashes, reject wrong passwords, and accept legacy owner hashes', async () => {
  const first = await crypto.hashPassword(password), second = await crypto.hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(first.startsWith("scrypt:")); // Safe to paste into dotenv files without dollar expansion.
  assert.ok(await crypto.verifyPasswordHash(password, first));
  assert.equal(await crypto.verifyPasswordHash('wrong password', first), false);
  const salt='ab'.repeat(16), legacy=`${salt}:${scryptSync(password,salt,64).toString('hex')}`;
  assert.ok(await crypto.verifyPasswordHash(password,legacy));
});
test('invitations bind email, expire, are revoked, and can be redeemed only once', async () => {
  const token=crypto.newToken(), hash=crypto.tokenHash(token), passwordHash=await crypto.hashPassword(password);
  await store.putInvitation({tokenHash:hash,email:'friend@example.test',expiresAt:Date.now()+60000,used:false});
  assert.equal(await store.redeemInvitation(hash,'other@example.test',passwordHash),null);
  const results=await Promise.all([store.redeemInvitation(hash,'friend@example.test',passwordHash),store.redeemInvitation(hash,'friend@example.test',passwordHash)]);
  assert.equal(results.filter(Boolean).length,1);
  assert.equal(await store.activeInvitation(),null);
  await store.putInvitation({tokenHash:hash,email:'expired@example.test',expiresAt:Date.now()-1,used:false});
  assert.equal(await store.redeemInvitation(hash,'expired@example.test',passwordHash),null);
  await store.putInvitation({tokenHash:hash,email:'revoked@example.test',expiresAt:Date.now()+60000,used:false});
  await store.closeInvitations();
  assert.equal(await store.redeemInvitation(hash,'revoked@example.test',passwordHash),null);
});
test('each SQL purchase operation requires the current owner, including mutations by guessed ID', async () => {
  const a=await db.createPurchase(userA,purchase), b=await db.createPurchase(userB,purchase), owner=await db.createPurchase('owner',purchase);
  assert.deepEqual((await db.listPurchases(userA)).map(p=>p.id),[a.id]);
  assert.equal(await db.getPurchase(userB,a.id),null);
  assert.equal(await db.getPurchase(userA,owner.id),null);
  assert.equal(await db.updatePurchase(userB,a.id,{...purchase,faceValue:500000}),null);
  assert.equal(await db.deletePurchase(userB,a.id),false);
  assert.equal((await db.getPurchase(userA,a.id)).faceValue,1000000);
  assert.equal((await db.updatePurchase(userA,a.id,{...purchase,faceValue:500000})).faceValue,500000);
  assert.ok(await db.deletePurchase(userA,a.id));
  assert.ok(await db.getPurchase(userB,b.id));
  await assert.rejects(db.listPurchases(undefined));
});
test('legacy SQL purchases migrate to owner rather than becoming shared', async () => {
  const created=await db.createPurchase('owner',purchase);
  await pg.exec('ALTER TABLE bond_purchases DROP COLUMN owner_id');
  await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
  assert.ok(await db.getPurchase('owner',created.id));
  assert.equal(await db.getPurchase(userA,created.id),null);
  const guest=await db.createPurchase(userB,purchase);
  await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
  assert.ok(await db.getPurchase(userB,guest.id));
  assert.equal(await db.getPurchase('owner',guest.id),null);
});
test('opaque sessions reject old signed tokens, revoke at logout, expire, and invalidate on password changes', async () => {
  const account=await auth.authenticate('owner@example.test',password);
  assert.ok(account);
  const token=await auth.createSession(account);
  assert.equal(token.length,43);
  cookieValues.set('bonds_session_v2',token);
  assert.equal((await auth.getBondSession()).isOwner,true);
  const rows=await pg.query('SELECT token_hash FROM bond_sessions');
  assert.ok(rows.rows.every(row=>row.token_hash!==token));
  await auth.revokeSession();
  assert.equal(await auth.getBondSession(),null);
  cookieValues.set('bonds_session_v2','forged.payload.signature');
  assert.equal(await auth.getBondSession(),null);
  cookieValues.set('bonds_session_v2',await auth.createSession(account));
  process.env.BONDS_ADMIN_PASSWORD_HASH=await crypto.hashPassword('changed owner passphrase 2026');
  assert.equal(await auth.getBondSession(),null);
  await store.putSession({tokenHash:crypto.tokenHash('expired'),userId:'owner',credentialVersion:'x',expiresAt:Date.now()-1});
  assert.equal(await store.findSession(crypto.tokenHash('expired')),null);
  assert.equal(auth.sessionCookie('x').httpOnly,true);
  assert.equal(auth.sessionCookie('x').sameSite,'strict');
});
test('guest sessions have no owner role and disabled accounts lose access immediately', async () => {
  const account=await store.accountByEmail('friend@example.test');
  cookieValues.set('bonds_session_v2',await auth.createSession(account));
  const session=await auth.getBondSession();
  assert.equal(session.isOwner,false);
  assert.equal(session.userId,account.id);
  await pg.query('UPDATE bond_users SET disabled_at=now() WHERE id=$1',[account.id]);
  assert.equal(await auth.getBondSession(),null);
});
test('rate limits persist through attempts and expired windows reset atomically', async () => {
  const key=crypto.tokenHash('test-rate');
  for(let i=0;i<5;i++) assert.equal(await store.consumeAttempt(key,5),false);
  assert.equal(await store.consumeAttempt(key,5),true);
  await pg.query("UPDATE bond_auth_attempts SET reset_at=now()-interval '1 second' WHERE key=$1",[key]);
  assert.equal(await store.consumeAttempt(key,5),false);
});
test('cross-origin writes fail even with a spoofed forwarded host; request streams are bounded', async () => {
  const {NextRequest}=await import('next/server.js');
  const request=new NextRequest('https://bonds.example.test/api/bonds/purchases',{method:'POST',headers:{origin:'https://evil.example.test','x-forwarded-host':'evil.example.test','content-type':'application/json'},body:'{}'});
  assert.equal(requestTools.isSameOriginRequest(request),false);
  const oversized=new NextRequest('https://bonds.example.test/api/bonds/auth/login',{method:'POST',headers:{origin:'https://bonds.example.test','content-type':'application/json'},body:'x'.repeat(5000)});
  assert.equal((await requestTools.readBoundedJsonBody(oversized,4096)).status,413);
});

test('production refuses a missing database and uses secure host-only session cookies', async () => {
  const previousMode=process.env.NODE_ENV, previousUrl=process.env.BONDS_DATABASE_URL;
  try {
    process.env.NODE_ENV='production'; delete process.env.BONDS_DATABASE_URL;
    await assert.rejects(store.activeInvitation(),/required for production/);
    const fresh=makeLoader({ 'next/headers': { cookies:async()=>({get:()=>undefined}) } });
    const cookie=fresh('lib/bonds/auth.ts').sessionCookie('test');
    assert.equal(cookie.secure,true); assert.equal(cookie.name,'__Host-bonds_session'); assert.equal(cookie.path,'/'); assert.equal(cookie.domain,undefined);
  } finally { process.env.NODE_ENV=previousMode; process.env.BONDS_DATABASE_URL=previousUrl; }
});
