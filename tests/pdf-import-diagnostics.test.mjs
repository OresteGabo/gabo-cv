import test from 'node:test';
import assert from 'node:assert/strict';
import makeLoader from './helpers/load-ts.mjs';
const load=makeLoader();
const diagnostics=load('lib/bonds/pdf-import-diagnostics.ts');
const {BondPdfImportError,bondPdfImportErrorMessage}=load('lib/bonds/pdf-import-errors.ts');
const report={stage:'document-open',code:'unreadable',reason:'missing-map-method',platform:'ios',version:1};

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
