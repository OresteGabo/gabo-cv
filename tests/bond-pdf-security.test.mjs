import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import makeLoader from './helpers/load-ts.mjs';

const terms = `NATIONAL BANK OF RWANDA
ISSUANCE NUMBER FXD1/2026/20YR
BOND CODE RWTEST000001
TENOR 20 Years
PRICE 100
Coupon Interest rate 12.00%
SETTLEMENT DATE 14/08/2026
REDEMPTION DATE 01/08/2046`;

// Real PDF objects and cross-reference offsets, including compressed action streams.
function pdfBytes({ text = terms, catalog = '', page = '', extra = [] } = {}) {
  const escape = value => value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const content = text.split('\n').map((line, i) => `BT /F1 12 Tf 40 ${770-i*18} Td (${escape(line)}) Tj ET`).join('\n');
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R ${catalog} >>`,
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R ${page} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`, ...extra,
  ];
  let result = Buffer.from('%PDF-1.7\n');const offsets=[0];
  objects.forEach((object, i) => { offsets.push(result.length);result=Buffer.concat([result,Buffer.from(`${i+1} 0 obj\n`),Buffer.isBuffer(object)?object:Buffer.from(object),Buffer.from('\nendobj\n')]); });
  const xref=result.length;
  return Buffer.concat([result,Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)]);
}
const file = (bytes = pdfBytes(), name = 'result.pdf', type = 'application/pdf') => new File([bytes], name, {type});

function scenario({ document = {}, page = {}, fail, failCleanup = false, ocrWorker } = {}) {
  const calls={reader:0,text:0,destroy:0,options:null};
  const workerOptions = {};
  const doc={numPages:1,getJSActions:async()=>null,getAttachments:async()=>null,getFieldObjects:async()=>null,
    getPage:async()=>({getJSActions:async()=>null,getAnnotations:async()=>[],getTextContent:async()=>{calls.text++;return {items:terms.split('\n').map((str,i)=>({str,transform:[1,0,0,1,0,770-i*18]}))};},cleanup(){},...page}),...document};
  const load=makeLoader({'tesseract.js':{PSM:{SPARSE_TEXT:11},createWorker:async()=>ocrWorker},'pdfjs-dist/legacy/build/pdf.mjs':{version:'6.4.299',GlobalWorkerOptions:workerOptions,VerbosityLevel:{ERRORS:0},AnnotationMode:{DISABLE:0},AnnotationType:{WIDGET:20},
    getDocument(options){calls.reader++;calls.options=options;if(fail)throw fail;return {promise:Promise.resolve(doc),destroy:async()=>{calls.destroy++;if(failCleanup)throw new Error('private cleanup diagnostics');}};}}});
  return {calls,workerOptions,importPdf:load('lib/bonds/pdf-import.ts').importBondPdf,policy:load('lib/bonds/pdf-import-errors.ts')};
}

test('renamed executables, HTML, empty/oversized files and invalid PDF envelopes fail before the reader loads', async () => {
  const {importPdf,calls}=scenario();
  for(const input of [file(Buffer.from('MZ executable'),'renamed.pdf'),file(Buffer.from('<html>not a pdf</html>')),file(Buffer.alloc(0)),file(pdfBytes(),'result.exe'),file(pdfBytes(),'result.pdf','text/html'),file(Buffer.concat([pdfBytes(),Buffer.from('MZ executable after EOF')]))]) {
    await assert.rejects(importPdf(input,new AbortController().signal,()=>{}));
  }
  await assert.rejects(importPdf({name:'big.pdf',type:'application/pdf',size:11*1024*1024,arrayBuffer(){throw new Error('must not read oversized data');}},new AbortController().signal,()=>{}));
  assert.equal(calls.reader,0);
});

test('scanned results keep OCR local, disable rendered annotations, bound canvas dimensions and terminate workers', async () => {
  const originalDocument=global.document;let renders=0,terminated=0;const canvas={width:0,height:0};
  const worker={setParameters:async()=>{},recognize:async()=>({data:{text:terms}}),terminate:async()=>{terminated++;}};
  const make=pages=>scenario({ocrWorker:worker,document:{numPages:pages},page:{getTextContent:async()=>({items:[]}),getViewport:({scale})=>({width:100000*scale,height:10*scale}),render:options=>{renders++;assert.equal(options.annotationMode,0);assert.ok(options.canvas.width<=4096);assert.ok(options.canvas.height<=4096);assert.ok(options.canvas.width*options.canvas.height<=8000000);return {promise:Promise.resolve()};}}});
  try {
    global.document={createElement:()=>canvas};
    const normal=make(1);assert.equal((await normal.importPdf(file(),new AbortController().signal,()=>{})).usedOcr,true);
    assert.equal(renders,1);assert.equal(terminated,1);assert.equal(canvas.width,0);assert.equal(canvas.height,0);
    await assert.rejects(make(6).importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='scan_limit');
    const active=scenario();const controller=new AbortController();
    await assert.rejects(active.importPdf(file(),controller.signal,message=>{if(message.startsWith('Reading page'))controller.abort();}),error=>error.code==='cancelled');
    assert.ok(active.calls.destroy>=1);
  } finally {global.document=originalDocument;}
});

test('document, form and page/annotation scripts or attachments are rejected before text extraction', async () => {
  for(const fixture of [
    {document:{getJSActions:async()=>new Map([['OpenAction',['untrusted code']]])}},
    {document:{getAttachments:async()=>new Map([['payload.exe',{}]])}},
    {document:{getFieldObjects:async()=>new Map([['field',[{id:'test',type:'text',actions:new Map([['Keystroke',['untrusted code']]])}]]])}},
    {page:{getJSActions:async()=>new Map([['PageOpen',['untrusted code']]])}},
    {page:{getAnnotations:async()=>[{actions:new Map([['MouseUp',['untrusted code']]])}]}},
    {page:{getAnnotations:async()=>[{file:{filename:'payload.exe'}}]}},
    {page:{getAnnotations:async()=>[{attachment:{}}]}},
    {page:{getAnnotations:async()=>[{unsafeUrl:'javascript:untrusted()'}]}},
  ]) {
    const {importPdf,calls}=scenario(fixture);
    await assert.rejects(importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='unsafe_content');
    assert.equal(calls.text,0);assert.equal(calls.destroy,1);
  }
});

test('every PDF failure uses the same fixed public message while preserving internal rejection codes', () => {
  const {policy}=scenario();
  for (const code of ['file_type','file_size','invalid_pdf','unreadable','password','unsafe_content','page_limit','scan_limit','text_limit','not_bond_result','cancelled']) {
    const error=new policy.BondPdfImportError(code);
    assert.equal(error.code,code);
    assert.equal(error.message,'❌Wrong file.');
    error.message='private parser diagnostics';
    assert.equal(policy.bondPdfImportErrorMessage(error),'❌Wrong file.');
  }
  for (const cause of [null, undefined, new Error('private details'), {code:'unreadable',message:'private details'}]) assert.equal(policy.bondPdfImportErrorMessage(cause),'❌Wrong file.');
});

test('unexpected reader errors and cleanup failures never expose raw diagnostics or replace a safe failure', async () => {
  for(const cause of [new TypeError('this.#nb.getOrInsertComputed is not a function'),new Error('<script>private document content</script>')]) {
    const {importPdf,policy}=scenario({fail:cause});
    await assert.rejects(importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='unreadable'&&!error.message.includes(cause.message));
    assert.equal(policy.bondPdfImportErrorMessage(cause),policy.bondPdfImportErrorMessage(null));
    const known=new policy.BondPdfImportError('invalid_pdf');known.message='private engine details';
    assert.equal(policy.bondPdfImportErrorMessage(known),'❌Wrong file.');
    assert.equal(policy.bondPdfImportErrorMessage({code:'invalid_pdf',message:'private'}),policy.bondPdfImportErrorMessage(null));
  }
  const {importPdf}=scenario({document:{numPages:11},failCleanup:true});
  await assert.rejects(importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='page_limit');
});

test('plain results remain importable; cancellation, password protection and unrelated documents have safe errors', async () => {
  const normal=scenario();const result=await normal.importPdf(file(),new AbortController().signal,()=>{});
  assert.equal(result.fields.bondName,'FXD1/2026/20YR');assert.equal(normal.calls.options.enableXfa,false);assert.equal(normal.calls.options.disableFontFace,true);
  const signed=scenario({page:{getAnnotations:async()=>[{annotationType:20,fieldType:'Sig',actions:null}]}});
  assert.equal((await signed.importPdf(file(),new AbortController().signal,()=>{})).fields.bondName,'FXD1/2026/20YR');
  const cancelled=new AbortController();cancelled.abort();await assert.rejects(normal.importPdf(file(),cancelled.signal,()=>{}),error=>error.code==='cancelled');
  const password=new Error('private encrypted document details');password.name='PasswordException';
  await assert.rejects(scenario({fail:password}).importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='password');
  const unrelated=scenario({page:{getTextContent:async()=>({items:[{str:'A long ordinary invoice. Coupon Interest rate 12%. This document is not an investor bond result and has no security identity.',transform:[1,0,0,1,0,700]}]})}});
  await assert.rejects(unrelated.importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='not_bond_result');
  const excessive=scenario({page:{getTextContent:async()=>({items:[{str:'x'.repeat(200001),transform:[1,0,0,1,0,700]}]})}});
  await assert.rejects(excessive.importPdf(file(),new AbortController().signal,()=>{}),error=>error.code==='text_limit');
});

test('worker requests include the API version and failures retain only fixed stage/reason codes', async () => {
  const normal = scenario();
  await normal.importPdf(file(), new AbortController().signal, () => {});
  const workerUrl = new URL(normal.workerOptions.workerSrc, 'https://bonds.example.test');
  assert.equal(workerUrl.searchParams.get('v'), '6.4.299');
  for (const [fixture, stage, reason] of [
    [{ fail: new TypeError('private getOrInsertComputed details') }, 'document-open', 'missing-map-method'],
    [{ fail: new Error('The API version "new" does not match the Worker version "old"') }, 'document-open', 'worker-version'],
    [{ page: { getTextContent: async () => { throw new TypeError('privateMethod is not a function: private document contents'); } } }, 'page-text', 'missing-browser-api'],
  ]) {
    await assert.rejects(scenario(fixture).importPdf(file(), new AbortController().signal, () => {}), error => {
      assert.deepEqual(error.diagnostic, { stage, reason });
      assert.equal(error.message, '❌Wrong file.');
      assert.equal(JSON.stringify(error).includes('private'), false);
      return true;
    });
  }
});

test('the upload component shows a safe error and resets its busy state when a dependency throws diagnostics', async () => {
  const React=await import('react');const originalWindow=global.window;
  const states=[];let cursor=0,imports=0,completed=0;const busy=[];
  const load=makeLoader({react:{...React,useEffect(){},useRef:value=>({current:value}),useState:initial=>{const index=cursor++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];}},
    '@/lib/bonds/pdf-import':{importBondPdf:async()=>{imports++;throw new TypeError('this.#nb.getOrInsertComputed is not a function: private document details');}}});
  const Upload=load('component/bonds/BondPdfUpload.tsx').BondPdfUpload;
  const find=(node,predicate)=>{
    if(!node||typeof node!=='object')return null;
    if(predicate(node))return node;
    for(const child of [node.props?.children].flat(Infinity)){const found=find(child,predicate);if(found)return found;}
    return null;
  };
  const render=()=>{cursor=0;return Upload({onImport:()=>completed++,onBusyChange:value=>busy.push(value)});};
  try {
    global.window={setTimeout,clearTimeout};
    const input=find(render(),node=>node.type==='input'&&node.props.type==='file');
    input.props.onChange({currentTarget:{files:[file()],value:'result.pdf'}});
    await new Promise(resolve=>setImmediate(resolve));
    const alert=find(render(),node=>node.props?.role==='alert');
    assert.equal(alert.props.children,'❌Wrong file.');assert.equal(alert.props.children.includes('getOrInsertComputed'),false);assert.equal(alert.props.children.includes('private document'),false);
    assert.equal(imports,1);assert.equal(completed,0);assert.deepEqual(busy,[true,false]);assert.equal(states[0],false);
    for (const files of [[file(), file()], []]) {
      const dropzone=find(render(),node=>node.props?.['data-testid']==='bond-pdf-dropzone');
      dropzone.props.onDrop({preventDefault(){},stopPropagation(){},dataTransfer:{files,items:[]}});
      assert.equal(find(render(),node=>node.props?.role==='alert').props.children,'❌Wrong file.');
    }
    assert.equal(imports,1);
  } finally {global.window=originalWindow;}
});

test('the picker retains its selection while file bytes are read and snapshots them before importing PDF code', async () => {
  const React = await import('react');
  const originalWindow = global.window;
  const states = [], references = [];
  let cursor = 0, refCursor = 0, releaseRead, imported = 0;
  const bytes = pdfBytes();
  const selected = file(bytes, 'icloud-contract.pdf', 'application/octet-stream');
  const target = { files: [selected], value: 'icloud-contract.pdf' };
  selected.arrayBuffer = () => new Promise(resolve => {
    assert.equal(target.value, 'icloud-contract.pdf');
    releaseRead = () => {
      assert.equal(target.value, 'icloud-contract.pdf');
      resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    };
  });
  const load = makeLoader({ react: {
    ...React, useEffect() {},
    useRef(value) { const index = refCursor++; return references[index] ??= { current: value }; },
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
  }, '@/lib/bonds/pdf-import': { importBondPdf: async (_file, _signal, _progress, snapshot) => {
    imported++;
    assert.deepEqual(Buffer.from(snapshot), bytes);
    assert.equal(target.value, 'icloud-contract.pdf');
    return { kind: 'bond', fields: {}, missingFields: [], warnings: [], usedOcr: false };
  } } });
  const Upload = load('component/bonds/BondPdfUpload.tsx').BondPdfUpload;
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
    return null;
  };
  try {
    global.window = { setTimeout, clearTimeout };
    const render = () => { cursor = 0; refCursor = 0; return Upload({ onImport() {}, onBusyChange() {} }); };
    find(render(), node => node.type === 'input').props.onChange({ currentTarget: target });
    assert.equal(imported, 0);
    assert.equal(target.value, 'icloud-contract.pdf');
    releaseRead();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(imported, 1);
    assert.equal(target.value, '');
    assert.equal(find(render(), node => node.props?.role === 'alert'), null);
  } finally { global.window = originalWindow; }
});

test('provider reads accept generic PDF metadata, retry failed or partial Blob reads, and abort the fallback', async () => {
  const { readBondPdfBytes } = makeLoader()('lib/bonds/pdf-file.ts');
  const originalReader = global.FileReader;
  const bytes = pdfBytes();
  let fallbackReads = 0, aborted = 0;
  class Reader {
    result = null;
    readAsArrayBuffer() {
      fallbackReads++;
      queueMicrotask(() => {
        this.result = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        this.onload?.();
      });
    }
    abort() { aborted++; this.onabort?.(); }
  }
  try {
    global.FileReader = Reader;
    for (const type of ['application/pdf', 'application/octet-stream', '']) {
      const selected = file(bytes, 'result.pdf', type);
      assert.deepEqual(Buffer.from(await readBondPdfBytes(selected, new AbortController().signal)), bytes);
    }
    assert.equal(fallbackReads, 0);
    for (const initial of [async () => { throw new DOMException('private provider details', 'NotReadableError'); }, async () => new ArrayBuffer(0), async () => new ArrayBuffer(7)]) {
      const selected = file(bytes);
      selected.arrayBuffer = initial;
      assert.deepEqual(Buffer.from(await readBondPdfBytes(selected, new AbortController().signal)), bytes);
    }
    assert.equal(fallbackReads, 3);
    global.FileReader = class extends Reader { readAsArrayBuffer() {} };
    const controller = new AbortController();
    const selected = file(bytes);
    selected.arrayBuffer = async () => new ArrayBuffer(0);
    const reading = readBondPdfBytes(selected, controller.signal);
    await new Promise(resolve => setImmediate(resolve));
    controller.abort();
    await assert.rejects(reading, error => error.code === 'cancelled');
    assert.equal(aborted, 1);
    global.FileReader = class extends Reader { readAsArrayBuffer() { this.result = new ArrayBuffer(2); this.onload(); } };
    await assert.rejects(readBondPdfBytes(selected, new AbortController().signal));
    // Generic MIME metadata never lets renamed HTML/executables into the parser.
    for (const contents of ['MZ executable', '<html>not a PDF</html>']) await assert.rejects(readBondPdfBytes(file(Buffer.from(contents), 'result.pdf', 'application/octet-stream'), new AbortController().signal));
  } finally { global.FileReader = originalReader; }
});

test('real PDF parser rejects malformed structure, unrelated content, compressed JavaScript and embedded executables', async () => {
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',import.meta.url).href;
  // Replace only browser asset transport with local paths; use the real parser/security APIs.
  const load=makeLoader({'pdfjs-dist/legacy/build/pdf.mjs':{...pdfjs,GlobalWorkerOptions:{},getDocument:options=>pdfjs.getDocument({...options,useWorkerFetch:false,standardFontDataUrl:new URL('../node_modules/pdfjs-dist/standard_fonts/',import.meta.url).pathname})}});
  const {importBondPdf}=load('lib/bonds/pdf-import.ts');
  const run=bytes=>importBondPdf(file(bytes),new AbortController().signal,()=>{});
  assert.equal((await run(pdfBytes())).fields.couponRate,0.12);
  assert.equal((await run(pdfBytes({catalog:'/AcroForm << /Fields [6 0 R] >>',page:'/Annots [6 0 R]',extra:['<< /Type /Annot /Subtype /Widget /FT /Sig /T (Signature) /Rect [0 0 10 10] /P 3 0 R >>']}))).fields.couponRate,0.12);
  await assert.rejects(run(Buffer.from('%PDF-1.7\nnot a real PDF structure\n%%EOF')),error=>error.code==='unreadable');
  await assert.rejects(run(pdfBytes({text:'Ordinary invoice with no bond allocation. '.repeat(5)})),error=>error.code==='not_bond_result');
  const compressed=deflateSync(Buffer.from('globalThis.__pdfImportExecuted = true;'));
  const stream=Buffer.concat([Buffer.from(`<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`),compressed,Buffer.from('\nendstream')]);
  for(const [index,fixture] of [
    {catalog:'/OpenAction 6 0 R',extra:['<< /S /JavaScript /JS 7 0 R >>',stream]},
    {page:'/AA << /O 6 0 R >>',extra:['<< /S /JavaScript /JS 7 0 R >>',stream]},
    {page:'/Annots [6 0 R]',extra:['<< /Type /Annot /Subtype /Link /Rect [0 0 50 50] /A 7 0 R >>','<< /S /JavaScript /JS 8 0 R >>',stream]},
    {catalog:'/AcroForm << /Fields [6 0 R] >>',page:'/Annots [6 0 R]',extra:['<< /Type /Annot /Subtype /Widget /FT /Sig /T (Signature) /Rect [0 0 10 10] /P 3 0 R /AA << /K 7 0 R >> >>','<< /S /JavaScript /JS 8 0 R >>',stream]},
    {catalog:'/Names << /EmbeddedFiles << /Names [(payload.exe) 6 0 R] >> >>',extra:['<< /Type /Filespec /F (payload.exe) /EF << /F 7 0 R >> >>','<< /Type /EmbeddedFile /Length 2 >>\nstream\nMZ\nendstream']},
    {page:'/Annots [6 0 R]',extra:['<< /Type /Annot /Subtype /FileAttachment /Rect [0 0 50 50] /FS 7 0 R >>','<< /Type /Filespec /F (payload.exe) /EF << /F 8 0 R >> >>','<< /Type /EmbeddedFile /Length 2 >>\nstream\nMZ\nendstream']},
  ].entries()) await assert.rejects(run(pdfBytes(fixture)),error=>error.code==='unsafe_content',`unsafe fixture ${index}`);
  assert.equal(globalThis.__pdfImportExecuted,undefined);
});

test('compatibility builds provide the missing Map method in both main and worker contexts', () => {
  for(const path of ['legacy/build/pdf.mjs','legacy/build/pdf.worker.mjs']) {
    const url=new URL(`../node_modules/pdfjs-dist/${path}`,import.meta.url).href;
    const child=spawnSync(process.execPath,['--input-type=module','-e',`delete Map.prototype.getOrInsertComputed;await import(${JSON.stringify(url)});if(typeof Map.prototype.getOrInsertComputed!=="function")process.exit(1);`],{encoding:'utf8',timeout:15000});
    assert.equal(child.status,0,child.stderr);
  }
  assert.match(readFileSync('scripts/prepare-bond-import.mjs','utf8'),/pdfjs-dist\/legacy\/build\/pdf\.worker\.min\.mjs/);
});
