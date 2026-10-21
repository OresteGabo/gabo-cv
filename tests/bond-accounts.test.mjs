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

test('auth diagnostics identify database failures without logging credentials or error messages', () => {
  const { reportAuthFailure } = load('lib/bonds/auth-diagnostics.ts');
  const messages = [];
  const originalError = console.error;
  console.error = (...args) => messages.push(args);
  try {
    reportAuthFailure('login', 'rate_limit_storage', { code: '42501', message: 'secret connection string', query: 'private SQL' });
    assert.equal(messages[0][1].reason, 'insufficient_database_permissions');
    assert.equal(messages[0][1].databaseConfigured, true);
    reportAuthFailure('login', 'session_creation', { code: '42703', detail: 'private token' });
    assert.equal(messages[1][1].reason, 'missing_column');
    reportAuthFailure('login', 'session_creation', { code: 'secret-code', message: 'private password' });
    assert.equal(messages[2][1].reason, 'unclassified_server_error');
    const output = JSON.stringify(messages);
    for (const secret of ['secret connection string', 'private SQL', 'private token', 'secret-code', 'private password', process.env.BONDS_ADMIN_PASSWORD_HASH, process.env.BONDS_DATABASE_URL]) {
      assert.equal(output.includes(secret), false);
    }
  } finally { console.error = originalError; }
});

test('passwords use randomized scrypt hashes, reject wrong passwords, and accept legacy owner hashes', async () => {
  const first = await crypto.hashPassword(password), second = await crypto.hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(first.startsWith("scrypt:")); // Safe to paste into dotenv files without dollar expansion.
  assert.ok(await crypto.verifyPasswordHash(password, first));
  assert.equal(await crypto.verifyPasswordHash('wrong password', first), false);
  const salt='ab'.repeat(16), legacy=`${salt}:${scryptSync(password,salt,64).toString('hex')}`;
  assert.ok(await crypto.verifyPasswordHash(password,legacy));
});
test('browser-generated password hashes match server verification without exposing the password', async () => {
  const { createBrowserPasswordHash } = load('lib/bonds/password-setup.ts');
  const first = await createBrowserPasswordHash(password), second = await createBrowserPasswordHash(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.ok(crypto.supportedPasswordHash(first));
  assert.ok(await crypto.verifyPasswordHash(password, first));
  assert.equal(await crypto.verifyPasswordHash('incorrect password', first), false);
  assert.equal(await crypto.verifyPasswordHash(first, first), false);
  assert.equal(await crypto.verifyPasswordHash(password, first.replace(':600000:', ':1:')), false);
  assert.equal(await crypto.verifyPasswordHash(password, first.replace(':600000:', ':999999999:')), false);
  assert.equal(await crypto.verifyPasswordHash(password, first + ':extra'), false);
  await assert.rejects(createBrowserPasswordHash('too short'));
});
test('the two-variable friend account has separate database purchases, restricted APIs, and revocable sessions', async () => {
  const { createBrowserPasswordHash } = load('lib/bonds/password-setup.ts');
  const { configuredFriend } = load('lib/bonds/friend-account.ts');
  const friendPassword = 'gorki isolated QA password only';
  process.env.BONDS_FRIEND_EMAIL = ' GORKI@EXAMPLE.TEST ';
  process.env.BONDS_FRIEND_PASSWORD_HASH = await createBrowserPasswordHash(friendPassword);
  try {
    const account = await auth.authenticate('gorki@example.test', friendPassword);
    assert.ok(account);
    assert.notEqual(account.id, 'owner');
    assert.equal(account.id, configuredFriend().id);
    assert.match(account.id, /^[a-f0-9-]{36}$/);
    assert.equal((await pg.query('SELECT id FROM bond_users WHERE id=$1', [account.id])).rows.length, 0);
    const token = await auth.createSession(account);
    cookieValues.set('bonds_session_v2', token);
    assert.equal((await auth.getBondSession()).isOwner, false);
    assert.equal((await auth.getBondSession()).userId, account.id);
    const ownerPurchase = await db.createPurchase('owner', purchase);
    const friendPurchase = await db.createPurchase(account.id, purchase);
    assert.deepEqual((await db.listPurchases(account.id)).map(row => row.id), [friendPurchase.id]);
    assert.equal(await db.getPurchase(account.id, ownerPurchase.id), null);
    assert.equal(await db.updatePurchase(account.id, ownerPurchase.id, purchase), null);
    assert.equal(await db.deletePurchase(account.id, ownerPurchase.id), false);
    const settings = await load('app/api/bonds/auth/registration/route.ts').GET();
    assert.equal(settings.status, 403);
    assert.deepEqual((await (await load('app/api/bonds/documents/route.ts').GET()).json()).documents, []);
    assert.deepEqual((await (await load('app/api/bonds/equities/route.ts').GET()).json()).holdings, []);
    process.env.BONDS_FRIEND_PASSWORD_HASH = await createBrowserPasswordHash('a changed friend QA password');
    assert.equal(configuredFriend().id, account.id);
    assert.equal(await auth.getBondSession(), null);
    const changed = await auth.authenticate('gorki@example.test', 'a changed friend QA password');
    cookieValues.set('bonds_session_v2', await auth.createSession(changed));
    await auth.revokeSession();
    assert.equal(await auth.getBondSession(), null);
    cookieValues.set('bonds_session_v2', await auth.createSession(changed));
    delete process.env.BONDS_FRIEND_EMAIL;
    assert.equal(await auth.getBondSession(), null);
    process.env.BONDS_FRIEND_EMAIL = process.env.BONDS_ADMIN_EMAIL;
    assert.equal(configuredFriend(), null);
  } finally {
    delete process.env.BONDS_FRIEND_EMAIL;
    delete process.env.BONDS_FRIEND_PASSWORD_HASH;
    cookieValues.clear();
  }
});
test('the standard Neon DATABASE_URL is accepted and explicit bonds configuration takes precedence', async () => {
  const { bondsDatabaseUrl } = load('lib/bonds/database-config.ts');
  const previous = process.env.BONDS_DATABASE_URL, previousDefault = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = 'postgresql://default.invalid/mock';
    assert.equal(bondsDatabaseUrl(), previous);
    delete process.env.BONDS_DATABASE_URL;
    assert.equal(bondsDatabaseUrl(), process.env.DATABASE_URL);
    assert.ok(Array.isArray(await db.listPurchases('owner')));
  } finally {
    process.env.BONDS_DATABASE_URL = previous;
    if (previousDefault === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousDefault;
  }
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
test('a private invitation can let the recipient choose an email, but still creates only one account', async () => {
  const hash = crypto.tokenHash(crypto.newToken()), passwordHash = await crypto.hashPassword(password);
  await store.putInvitation({ tokenHash: hash, email: '', expiresAt: Date.now() + 60000, used: false });
  assert.equal(await store.redeemInvitation(crypto.tokenHash('incorrect invitation'), 'chosen@example.test', passwordHash), null);
  const results = await Promise.all([
    store.redeemInvitation(hash, 'chosen-first@example.test', passwordHash),
    store.redeemInvitation(hash, 'chosen-second@example.test', passwordHash),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await store.activeInvitation(), null);
  await store.putInvitation({ tokenHash: hash, email: '', expiresAt: Date.now() - 1, used: false });
  assert.equal(await store.redeemInvitation(hash, 'expired-choice@example.test', passwordHash), null);
});
test('owner-issued no-email links register a normal account directly, without Vercel credentials', async () => {
  const { NextRequest } = await import('next/server.js');
  const request = (path, data) => new NextRequest(`https://bonds.example.test${path}`, {
    method: 'POST', headers: { origin: 'https://bonds.example.test', 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const registration = load('app/api/bonds/auth/registration/route.ts');
  cookieValues.set('bonds_session_v2', await auth.createSession(await auth.authenticate('owner@example.test', password)));
  const issued = await registration.POST(request('/api/bonds/auth/registration', {}));
  assert.equal(issued.status, 201);
  const { invite } = await issued.json();
  assert.equal((await store.activeInvitation()).email, '');
  cookieValues.clear();
  const register = load('app/api/bonds/auth/register/route.ts').POST;
  const protectedOwner = await register(request('/api/bonds/auth/register', { email: 'owner@example.test', password, invite }));
  assert.equal(protectedOwner.status, 403);
  const created = await register(request('/api/bonds/auth/register', { email: 'gorki-invited@example.test', password, invite, isOwner: true, userId: 'owner' }));
  assert.equal(created.status, 201);
  const user = (await created.json()).user;
  assert.equal(user.isOwner, false);
  assert.notEqual(user.id, 'owner');
  const account = await store.accountByEmail('gorki-invited@example.test');
  assert.equal(account.id, user.id);
  assert.notEqual(account.passwordHash, password);
  assert.ok(await crypto.verifyPasswordHash(password, account.passwordHash));
  cookieValues.set('bonds_session_v2', created.cookies.get('bonds_session_v2').value);
  assert.equal((await auth.getBondSession()).userId, user.id);
  assert.equal(await store.activeInvitation(), null);
  assert.equal((await registration.POST(request('/api/bonds/auth/registration', {}))).status, 403);
  assert.equal((await register(request('/api/bonds/auth/register', { email: 'another-invited@example.test', password, invite }))).status, 403);
  cookieValues.clear();
});
test('account activity totals face value per currency and finds the latest added purchase without mixing users', async () => {
  const firstId = randomUUID(), secondId = randomUUID(), emptyId = randomUUID();
  const oldest = await db.createPurchase(firstId, { ...purchase, faceValue: 1000000, amountInvested: 950000, pricePercent: 95, bondName: 'Older active bond', isin: 'OLD-CODE' });
  const newest = await db.createPurchase(firstId, { ...purchase, purchaseDate: '2025-12-01', faceValue: 2000000, status: 'sold', bondName: 'Latest imported bond', isin: 'LATEST-CODE' });
  const foreign = await db.createPurchase(firstId, { ...purchase, currency: 'USD', faceValue: 1250.50, status: 'matured', bondName: 'USD bond' });
  await db.createPurchase(secondId, { ...purchase, faceValue: 7000000 });
  await pg.query("UPDATE bond_purchases SET created_at='2026-01-01T00:00:00Z' WHERE id=$1", [oldest.id]);
  await pg.query("UPDATE bond_purchases SET created_at='2026-03-01T00:00:00Z' WHERE id=$1", [newest.id]);
  await pg.query("UPDATE bond_purchases SET created_at='2026-02-01T00:00:00Z' WHERE id=$1", [foreign.id]);
  const summaries = await db.accountPortfolioSummaries([firstId, secondId, emptyId]);
  assert.equal(summaries.size, 3);
  assert.equal(summaries.get(firstId).purchaseCount, 3);
  assert.deepEqual(summaries.get(firstId).principalByCurrency, [{ currency: 'RWF', amount: 3000000 }, { currency: 'USD', amount: 1250.50 }]);
  assert.deepEqual(summaries.get(firstId).latestPurchase, { bondName: 'Latest imported bond', isin: 'LATEST-CODE', purchaseDate: '2025-12-01', createdAt: '2026-03-01T00:00:00.000Z' });
  assert.deepEqual(summaries.get(secondId).principalByCurrency, [{ currency: 'RWF', amount: 7000000 }]);
  assert.deepEqual(summaries.get(emptyId), { purchaseCount: 0, principalByCurrency: [], latestPurchase: null });
  assert.equal((await db.accountPortfolioSummaries([firstId])).has(secondId), false);
  assert.equal((await db.accountPortfolioSummaries([])).size, 0);
  await assert.rejects(db.accountPortfolioSummaries(['../owner']));
});
test('only the owner can list accounts or delete a member, their purchases, and all sessions', async () => {
  const { NextRequest } = await import('next/server.js');
  const listing = load('app/api/bonds/auth/accounts/route.ts').GET;
  const deletion = load('app/api/bonds/auth/accounts/[id]/route.ts').DELETE;
  const request = (email, origin = 'https://bonds.example.test') => new NextRequest('https://bonds.example.test/api/bonds/auth/accounts/test', {
    method: 'DELETE', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ email }),
  });
  const context = id => ({ params: Promise.resolve({ id }) });
  const email = 'delete-test@example.test', hash = crypto.tokenHash(crypto.newToken());
  await store.putInvitation({ tokenHash: hash, email, expiresAt: Date.now() + 60000, used: false });
  const member = await store.redeemInvitation(hash, email, await crypto.hashPassword(password));
  const firstSession = await auth.createSession(member), secondSession = await auth.createSession(member);
  const saved = await db.createPurchase(member.id, purchase);
  const ownerSaved = await db.createPurchase('owner', purchase);
  cookieValues.clear();
  assert.equal((await listing()).status, 401);
  assert.equal((await deletion(request(email), context(member.id))).status, 401);
  cookieValues.set('bonds_session_v2', firstSession);
  assert.equal((await listing()).status, 403);
  assert.equal((await deletion(request(email), context(member.id))).status, 403);
  const ownerSession = await auth.createSession(await auth.authenticate('owner@example.test', password));
  cookieValues.set('bonds_session_v2', ownerSession);
  await pg.query('UPDATE bond_users SET disabled_at=now() WHERE id=$1', [member.id]);
  const response = await listing();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const data = await response.json();
  const summary = data.accounts.find(account => account.id === member.id);
  assert.equal(summary.email, email);
  assert.equal(summary.status, 'disabled');
  assert.equal(summary.deletable, true);
  assert.ok(summary.createdAt);
  assert.equal(summary.portfolio.purchaseCount, 1);
  assert.deepEqual(summary.portfolio.principalByCurrency, [{ currency: 'RWF', amount: 1000000 }]);
  assert.equal(summary.portfolio.latestPurchase.bondName, purchase.bondName);
  assert.equal(summary.portfolio.latestPurchase.isin, purchase.isin);
  assert.equal(summary.portfolio.latestPurchase.purchaseDate, purchase.purchaseDate);
  assert.equal(data.accounts.find(account => account.id === 'owner').deletable, false);
  const serialized = JSON.stringify(data);
  for (const secret of ['passwordHash', 'password_hash', member.passwordHash, firstSession, secondSession, 'tokenHash']) assert.equal(serialized.includes(secret), false);
  assert.equal((await deletion(request(email, 'https://evil.example.test'), context(member.id))).status, 403);
  assert.equal((await deletion(request('owner@example.test'), context('owner'))).status, 403);
  assert.equal((await deletion(request('owner@example.test'), context(member.id))).status, 403);
  assert.equal((await deletion(request(email), context('../owner'))).status, 400);
  assert.equal((await deletion(request('wrong@example.test'), context(member.id))).status, 404);
  assert.ok(await db.getPurchase(member.id, saved.id));
  await pg.query('UPDATE bond_users SET disabled_at=NULL WHERE id=$1', [member.id]);
  process.env.BONDS_FRIEND_EMAIL = 'environment-friend@example.test';
  process.env.BONDS_FRIEND_PASSWORD_HASH = await crypto.hashPassword(password);
  const environmentFriend = load('lib/bonds/friend-account.ts').configuredFriend();
  assert.ok((await (await listing()).json()).accounts.some(account => account.id === environmentFriend.id && !account.deletable));
  assert.equal((await deletion(request(environmentFriend.email), context(environmentFriend.id))).status, 409);
  delete process.env.BONDS_FRIEND_EMAIL;
  delete process.env.BONDS_FRIEND_PASSWORD_HASH;
  assert.equal((await deletion(request(email), context(member.id))).status, 200);
  assert.equal(await store.accountById(member.id), null);
  assert.deepEqual(await db.listPurchases(member.id), []);
  assert.equal((await pg.query('SELECT * FROM bond_sessions WHERE user_id=$1', [member.id])).rows.length, 0);
  assert.ok(await db.getPurchase('owner', ownerSaved.id));
  assert.equal((await auth.getBondSession()).isOwner, true);
  for (const token of [firstSession, secondSession]) {
    cookieValues.set('bonds_session_v2', token);
    assert.equal(await auth.getBondSession(), null);
  }
  assert.equal(await auth.authenticate(email, password), null);
  cookieValues.set('bonds_session_v2', ownerSession);
  assert.equal((await deletion(request(email), context(member.id))).status, 404);
  assert.equal(await store.deleteAccount('owner', 'owner@example.test'), false);
  await store.putInvitation({ tokenHash: hash, email, expiresAt: Date.now() + 60000, used: false });
  const replacement = await store.redeemInvitation(hash, email, await crypto.hashPassword(password));
  assert.notEqual(replacement.id, member.id);
  assert.deepEqual(await db.listPurchases(replacement.id), []);
  cookieValues.clear();
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
  const previousMode=process.env.NODE_ENV, previousUrl=process.env.BONDS_DATABASE_URL, previousDefault=process.env.DATABASE_URL;
  try {
    process.env.NODE_ENV='production'; delete process.env.BONDS_DATABASE_URL; delete process.env.DATABASE_URL;
    await assert.rejects(store.activeInvitation(),/required for production/);
    const fresh=makeLoader({ 'next/headers': { cookies:async()=>({get:()=>undefined}) } });
    const cookie=fresh('lib/bonds/auth.ts').sessionCookie('test');
    assert.equal(cookie.secure,true); assert.equal(cookie.name,'__Host-bonds_session'); assert.equal(cookie.path,'/'); assert.equal(cookie.domain,undefined);
  } finally { process.env.NODE_ENV=previousMode; process.env.BONDS_DATABASE_URL=previousUrl; if(previousDefault===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=previousDefault; }
});
