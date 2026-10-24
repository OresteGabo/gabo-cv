import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server.js';
import makeLoader from './helpers/load-ts.mjs';
import { ownerPortfolioSeed } from '../scripts/owner-portfolio-seed.mjs';

const pg = new PGlite();
const originalEnv = { ...process.env };
const sql = async (strings, ...values) => (await pg.query(strings.reduce((text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''), ''), values)).rows;
let session = { userId:'owner', isOwner:true };
const cannotWrite = async () => { throw Object.assign(new Error('Read-only deployment'), {code:'EROFS'}); };
const load = makeLoader({
  '@neondatabase/serverless': { neon: () => sql },
  '@/lib/bonds/auth': { getBondSession: async () => session },
  'node:fs/promises': { readFile: async () => '{"purchases":[]}', mkdir:cannotWrite, writeFile:cannotWrite, rename:cannotWrite },
});
const route = load('app/api/bonds/purchases/route.ts');
const db = load('lib/bonds/db.ts');
const pending = { instrumentType:'treasury',issuer:'Government of Rwanda',currency:'RWF',market:'primary',purchaseDate:'2026-10-24',settlementDate:'2026-10-23',bondName:'New 20-year bond',isin:'',tenorYears:20,faceValue:1200000,pricePercent:100,accruedInterestPaid:0,feesPaid:11000,couponRate:0,withholdingTaxRate:.05,maturityDate:'2046-09-28',firstCouponDate:'',couponDates:[],couponFrequency:2,scheduleConfidence:'estimated',broker:'',accountReference:'',sourceUrl:'',status:'submitted',notes:'Pending application.' };
const post = body => route.POST(new NextRequest('https://bonds.example.test/api/bonds/purchases', { method:'POST',headers:{origin:'https://bonds.example.test','content-type':'application/json'},body:JSON.stringify(body) }));
const seed = async purchases => { const query=ownerPortfolioSeed(purchases); return pg.query(query.text,query.values); };

test.before(async () => {
  process.env.BONDS_DATABASE_URL='postgresql://test.invalid/mock';
  // Old deployments use this value: a connected DB must still handle owner writes.
  process.env.BONDS_PORTFOLIO_DATABASE='file';
  await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''));
});
test.beforeEach(async () => { session={userId:'owner',isOwner:true}; await pg.exec('TRUNCATE bond_purchases, bond_data_migrations'); });
test.after(async () => { process.env=originalEnv; await pg.close(); });

test('owner saves October RWF 1,200,000 after settlement even on a read-only deployment', async () => {
  const response=await post(pending);
  assert.equal(response.status,201);
  const saved=(await response.json()).purchase;
  assert.equal(saved.status,'submitted');
  assert.equal(saved.amountInvested,1211000);
  assert.equal(saved.purchaseDate,'2026-10-24');
  assert.equal(saved.settlementDate,'2026-10-23');
  assert.equal((await (await route.GET()).json()).purchases.length,1);
  session={userId:randomUUID(),isOwner:false};
  assert.deepEqual((await (await route.GET()).json()).purchases,[]);
});
test('owner can record an earlier issuance several months later', async () => {
  const response=await post({...pending,purchaseDate:'2027-02-01'});
  assert.equal(response.status,201);
  assert.equal((await response.json()).purchase.status,'submitted');
});
test('catalog normalization cannot confirm an application or reactivate sold holdings', () => {
  const catalog=JSON.parse(readFileSync('lib/bonds/bond-catalog.json','utf8'))[0];
  const purchase={...pending,isin:catalog.isin,bondName:catalog.issuanceNumber};
  const normalize=load('lib/bonds/catalog.ts').canonicalPurchaseFromCatalog;
  assert.equal(normalize(purchase).status,'submitted');
  assert.equal(normalize(purchase).couponRate,0);
  assert.equal(normalize(purchase).scheduleConfidence,'estimated');
  assert.equal(normalize({...purchase,status:'sold'}).status,'sold');
});
test('one-time seed preserves IDs, dates and costs and never overwrites edits or restores deletions', async () => {
  const first={...pending,id:randomUUID(),createdAt:'2026-10-24T00:00:00Z'};
  const second={...first,id:randomUUID(),faceValue:2000000};
  await seed([first,second]);
  let purchases=await db.listPurchases('owner');
  assert.equal(purchases.length,2);
  assert.equal(purchases.find(p=>p.id===first.id).amountInvested,1211000);
  assert.equal(new Date(purchases.find(p=>p.id===first.id).createdAt).toISOString(),'2026-10-24T00:00:00.000Z');
  await db.updatePurchase('owner',first.id,{...pending,faceValue:1500000,amountInvested:1511000});
  await db.deletePurchase('owner',second.id);
  await seed([first,second]);
  purchases=await db.listPurchases('owner');
  assert.equal(purchases.length,1);
  assert.equal(purchases[0].id,first.id);
  assert.equal(purchases[0].faceValue,1500000);
});
test('a failed seed rolls back its completion marker so it can be retried', async () => {
  await pg.exec('BEGIN');
  try { await assert.rejects(seed([{...pending,id:'invalid-uuid'}])); }
  finally { await pg.exec('ROLLBACK'); }
  assert.equal((await pg.query('SELECT * FROM bond_data_migrations')).rows.length,0);
  await seed([{...pending,id:randomUUID()}]);
  assert.equal((await db.listPurchases('owner')).length,1);
});
