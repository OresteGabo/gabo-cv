import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server.js';
import makeLoader from './helpers/load-ts.mjs';

const pg = new PGlite();
const sql = async (strings, ...values) => (await pg.query(strings.reduce((text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''), ''), values)).rows;
let session = { userId: randomUUID(), isOwner: false };
const load = makeLoader({ '@neondatabase/serverless': { neon: () => sql }, '@/lib/bonds/auth': { getBondSession: async () => session } });
const parser = load('lib/bonds/equity-pdf-parser.ts');
const validation = load('lib/bonds/equity-validation.ts');
const identity = load('lib/bonds/purchase-identity.ts');
const equities = load('lib/bonds/equities.ts');
const db = load('lib/bonds/db.ts');
const raw = readFileSync('tests/fixtures/equity-purchase.txt', 'utf8');
const equity = parser.parsePurchasePdfText(raw).fields;
const bond = { instrumentType:'treasury',issuer:'Government of Rwanda',currency:'RWF',market:'primary',purchaseDate:'2026-01-01',settlementDate:'2026-01-02',bondName:'Import test bond',isin:'TEST0000001',tenorYears:3,faceValue:1000000,pricePercent:100,accruedInterestPaid:0,feesPaid:0,amountInvested:1000000,couponRate:0.1,withholdingTaxRate:0.05,maturityDate:'2029-01-02',firstCouponDate:'2026-07-02',couponDates:['2026-07-02'],couponFrequency:2,scheduleConfidence:'estimated',broker:'',accountReference:'',sourceUrl:'',status:'active',notes:'' };
const originalEnv = { ...process.env };
const schema = readFileSync('db/bonds-schema.sql', 'utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', '');
const request = (path, body, origin = 'https://bonds.example.test') => new NextRequest(`https://bonds.example.test${path}`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
test.before(async () => {
  process.env.BONDS_DATABASE_URL = 'postgresql://test.invalid/mock';
  process.env.BONDS_PORTFOLIO_DATABASE = 'database';
  await pg.exec(schema);
});
test.beforeEach(async () => { session = { userId: randomUUID(), isOwner: false }; await pg.exec('TRUNCATE bond_purchases, equity_purchases'); });
test.after(async () => { process.env = originalEnv; await pg.close(); });

test('accepts broker zero-padding after EOF while rejecting executable or HTML trailers', () => {
  const { validateBondPdfEnvelope } = load('lib/bonds/pdf-import-errors.ts');
  const bytes = Buffer.from('%PDF-1.4\nbody\n%%EOF\n');
  assert.doesNotThrow(() => validateBondPdfEnvelope(Buffer.concat([bytes, Buffer.alloc(20000)])));
  for (const trailer of ['MZ executable', '<script>untrusted()</script>']) assert.throws(() => validateBondPdfEnvelope(Buffer.concat([bytes, Buffer.from(trailer), Buffer.alloc(20000)])));
});

test('detects an RSE equity purchase and extracts dates, fees and totals without mixing percentage columns', () => {
  const result = parser.parsePurchasePdfText(raw);
  assert.equal(result.kind, 'equity');
  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.fields.securityName, 'BANK OF KIGALI');
  assert.equal(result.fields.ticker, 'BOK');
  assert.equal(result.fields.tradeDate, '2026-09-24');
  assert.equal(result.fields.settlementDate, '2026-09-28');
  assert.equal(result.fields.shares, 500);
  assert.equal(result.fields.pricePerShare, 670);
  assert.equal(result.fields.brokerageCommission, 5025);
  assert.equal(result.fields.netAmountPayable, 340728.5);
  assert.ok(validation.parseEquityPurchase(result.fields));
  assert.equal(parser.parsePurchasePdfText(raw, true).usedOcr, true);
});
test('unknown tickers and missing fees require review; sale notes, unsupported currencies and unrelated PDFs are rejected', () => {
  const unknown = parser.parsePurchasePdfText(raw.replace('RW000A1JCYA', 'RW000UNKNOWN'));
  assert.equal(unknown.fields.ticker, '');
  assert.ok(unknown.missingFields.includes('ticker'));
  assert.equal(validation.parseEquityPurchase(unknown.fields), null);
  assert.ok(parser.parsePurchasePdfText(raw.replace(/Brokerage Commission[^\n]+\n/, '')).missingFields.includes('brokerage commission'));
  for (const invalid of [raw.replace('EQUITY PURCHASE', 'EQUITY SALE'), raw.replace('in RWF', 'in USD'), 'unrelated text', raw + '\nNATIONAL BANK OF RWANDA\nISSUANCE NUMBER FXD1/2026/20YR\nTENOR 20 Years\nCoupon Interest rate 12.00%']) {
    assert.throws(() => parser.parsePurchasePdfText(invalid), error => error.code === 'not_bond_result');
  }
  for (const change of [{ tradeDate:'2026-02-30' }, { settlementDate:'2025-01-01' }, { shares:500.1 }, { netAmountPayable:1 }, { totalCharges:0 }, { currency:'USD' }, { pricePerShare:NaN }, { ticker:'<script>' }]) assert.equal(validation.parseEquityPurchase({ ...equity, ...change }), null);
});
test('one PDF containing two purchase notes is rejected rather than saving a partial transaction', () => {
  assert.throws(() => parser.parsePurchasePdfText(raw + '\n' + raw.replace('TEST-2026#01', 'TEST-2026#02')), error => error.code === 'not_bond_result');
});
test('share API enforces session/origin and saves only validated account-scoped purchases', async () => {
  const route = load('app/api/bonds/equities/route.ts');
  const account = session;
  session = null;
  assert.equal((await route.GET()).status, 401);
  assert.equal((await route.POST(request('/api/bonds/equities', equity))).status, 401);
  session = account;
  assert.equal((await route.POST(request('/api/bonds/equities', equity, 'https://evil.example'))).status, 403);
  assert.equal((await route.POST(request('/api/bonds/equities', { ...equity, shares:1 }))).status, 400);
  const first = await route.POST(request('/api/bonds/equities', { ...equity, owner_id:'owner' }));
  assert.equal(first.status, 201);
  const saved = (await first.json()).holding;
  assert.equal((await route.POST(request('/api/bonds/equities', equity))).status, 409);
  assert.deepEqual((await (await route.GET()).json()).holdings.map(row => row.id), [saved.id]);
  session = { userId:randomUUID(), isOwner:false };
  assert.deepEqual((await (await route.GET()).json()).holdings, []);
  assert.equal((await route.POST(request('/api/bonds/equities', equity))).status, 201);
});
test('parallel share imports save once and contract/report identities survive changed numbers', async () => {
  const attempts = await Promise.allSettled([equities.createEquityPurchase(session.userId, equity), equities.createEquityPurchase(session.userId, equity)]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(identity.isDuplicatePurchaseError(attempts.find(result => result.status === 'rejected').reason));
  await assert.rejects(equities.createEquityPurchase(session.userId, { ...equity, shares:1000 }), identity.isDuplicatePurchaseError);
  await assert.rejects(equities.createEquityPurchase(session.userId, { ...equity, contractNote:'OTHER', shares:1000 }), identity.isDuplicatePurchaseError);
  await equities.createEquityPurchase(session.userId, { ...equity, contractNote:'OTHER', tradeReportId:'OTHER', tradeDate:'2026-09-25' });
  assert.equal((await equities.listEquityHoldings(session.userId)).length, 2);
  assert.ok((await equities.listEquityHoldings('owner')).some(row => row.id === 'equity-20260004454-01'));
  await assert.rejects(equities.createEquityPurchase('owner', { ...equity, contractNote:'20260004454#01', tradeReportId:'' }), identity.isDuplicatePurchaseError);
});
test('bond duplicates are blocked atomically, including alternate trade dates for the same primary allocation', async () => {
  const attempts = await Promise.allSettled([db.createPurchase(session.userId, bond), db.createPurchase(session.userId, bond)]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  await assert.rejects(db.createPurchase(session.userId, { ...bond, purchaseDate:'2025-12-31', feesPaid:11000, amountInvested:1011000 }), identity.isDuplicatePurchaseError);
  await db.createPurchase(randomUUID(), bond);
  const second = await db.createPurchase(session.userId, { ...bond, faceValue:2000000 });
  await assert.rejects(db.updatePurchase(session.userId, second.id, bond), identity.isDuplicatePurchaseError);
  const api = load('app/api/bonds/purchases/route.ts');
  assert.equal((await api.POST(request('/api/bonds/purchases', bond))).status, 409);
});
test('schema backfills duplicate protection on legacy rows without deleting duplicates; repeat builds preserve it', async () => {
  const original = await db.createPurchase(session.userId, bond);
  await pg.exec('DROP INDEX bond_purchases_duplicate_idx');
  await pg.query('UPDATE bond_purchases SET dedup_key=NULL');
  const duplicate = await db.createPurchase(session.userId, bond);
  await pg.query('UPDATE bond_purchases SET dedup_key=NULL');
  // Production runner splits plain statements, so exercise precisely that path.
  for (const statement of schema.split(';').map(part => part.trim()).filter(Boolean)) await pg.exec(statement);
  assert.equal((await db.listPurchases(session.userId)).length, 2);
  assert.ok(await db.getPurchase(session.userId, original.id));
  assert.ok(await db.getPurchase(session.userId, duplicate.id));
  await assert.rejects(db.createPurchase(session.userId, bond), identity.isDuplicatePurchaseError);
  await pg.exec(schema);
  await assert.rejects(db.createPurchase(session.userId, bond), identity.isDuplicatePurchaseError);
});
test('local portfolios serialize duplicate checks and keep each member separate', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'gabo-purchase-test-'));
  const oldCwd = process.cwd;
  const url = process.env.BONDS_DATABASE_URL;
  try {
    process.cwd = () => temporary;
    delete process.env.BONDS_DATABASE_URL;
    delete process.env.DATABASE_URL;
    process.env.BONDS_PORTFOLIO_DATABASE = 'file';
    const attempts = await Promise.allSettled([db.createPurchase(session.userId, bond), db.createPurchase(session.userId, bond)]);
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
    const shares = await Promise.allSettled([equities.createEquityPurchase(session.userId, equity), equities.createEquityPurchase(session.userId, equity)]);
    assert.equal(shares.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((await equities.listEquityHoldings(session.userId)).length, 1);
    assert.deepEqual(await equities.listEquityHoldings(randomUUID()), []);
    await assert.rejects(equities.listEquityHoldings('../owner'));
  } finally { process.cwd = oldCwd; process.env.BONDS_DATABASE_URL = url; process.env.BONDS_PORTFOLIO_DATABASE = 'database'; await rm(temporary, { recursive:true, force:true }); }
});
