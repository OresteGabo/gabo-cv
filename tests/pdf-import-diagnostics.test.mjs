import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import makeLoader from './helpers/load-ts.mjs';

let session = null;
const load = makeLoader({ '@/lib/bonds/auth': { getBondSession: async () => session } });
const diagnostics = load('lib/bonds/pdf-import-diagnostics.ts');
const { BondPdfImportError, bondPdfImportErrorMessage } = load('lib/bonds/pdf-import-errors.ts');
const route = load('app/api/bonds/import-diagnostics/route.ts');
const origin = 'https://bonds.example.test';
const report = { stage: 'document-open', code: 'unreadable', reason: 'missing-map-method', platform: 'ios', version: 1 };
const request = (body, headers = {}) => new NextRequest(`${origin}/api/bonds/import-diagnostics`, {
  method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
});

test('diagnostics discard exception/document text and unrecognized report fields', () => {
  const unknown = new TypeError('privateFilename.pdf: private PDF text; getOrInsertComputed is not a function');
  const known = new BondPdfImportError('unreadable', { stage: 'page-text', reason: diagnostics.pdfFailureReason(unknown) });
  const actual = diagnostics.makePdfImportReport(known, 'metadata', 'Mozilla iPhone private-device-details');
  assert.deepEqual(actual, { ...report, stage: 'page-text' });
  assert.equal(bondPdfImportErrorMessage(known), '❌Wrong file.');
  assert.equal(JSON.stringify(actual).includes('private'), false);
  assert.deepEqual(diagnostics.parsePdfImportReport(actual), actual);
  for (const invalid of [{ ...report, filename: 'private.pdf' }, { ...report, reason: 'private parser text' }, { ...report, stage: 'private stage' }, { ...report, code: 'private code' }, { ...report, platform: 'full user agent' }, { ...report, version: 2 }]) assert.equal(diagnostics.parsePdfImportReport(invalid), null);
});

test('client reports fixed codes only and never waits for or exposes reporting failures', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  try {
    global.fetch = (url, options) => { calls.push({ url, options }); return Promise.reject(new Error('private network diagnostics')); };
    const error = new BondPdfImportError('unreadable', { stage: 'file-read', reason: 'file-unavailable' });
    assert.equal(diagnostics.reportPdfImportFailure(error, 'metadata'), undefined);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/bonds/import-diagnostics');
    assert.ok(diagnostics.parsePdfImportReport(JSON.parse(calls[0].options.body)));
    assert.equal(JSON.stringify(calls).includes('private'), false);
    diagnostics.reportPdfImportFailure(new BondPdfImportError('cancelled'), 'file-read');
    assert.equal(calls.length, 1);
    global.fetch = () => { throw new Error('private sync error'); };
    assert.doesNotThrow(() => diagnostics.reportPdfImportFailure(error, 'metadata'));
  } finally { global.fetch = originalFetch; }
});

test('the endpoint authenticates, checks origin, bounds input and logs no account identifiers', async () => {
  const originalWarn = console.warn;
  const originalOrigin = process.env.BONDS_APP_ORIGIN;
  const logs = [];
  try {
    process.env.BONDS_APP_ORIGIN = origin;
    console.warn = (...args) => logs.push(args);
    session = null;
    assert.equal((await route.POST(request(report))).status, 401);
    session = { userId: 'private-account-id' };
    assert.equal((await route.POST(request(report, { origin: 'https://evil.example.test' }))).status, 403);
    assert.equal((await route.POST(request(report, { 'content-type': 'text/plain' }))).status, 415);
    assert.equal((await route.POST(request({ ...report, contents: 'x'.repeat(2048) }))).status, 413);
    assert.equal((await route.POST(request({ ...report, filename: 'private.pdf' }))).status, 400);
    assert.deepEqual(logs, []);
    const response = await route.POST(request(report));
    assert.equal(response.status, 204);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.deepEqual(logs, [['[purchase-pdf-import]', report]]);
    assert.equal(JSON.stringify(logs).includes('private'), false);
    assert.equal((await route.POST(request(report))).status, 204);
    assert.equal(logs.length, 1);
  } finally {
    console.warn = originalWarn;
    if (originalOrigin === undefined) delete process.env.BONDS_APP_ORIGIN; else process.env.BONDS_APP_ORIGIN = originalOrigin;
    session = null;
  }
});
