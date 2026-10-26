import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import makeLoader from './helpers/load-ts.mjs';
const load=makeLoader();
const parser=load('lib/bonds/equity-pdf-parser.ts');
const validation=load('lib/bonds/equity-validation.ts');
const raw=readFileSync('tests/fixtures/equity-purchase.txt','utf8');
const equity=parser.parsePurchasePdfText(raw).fields;

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