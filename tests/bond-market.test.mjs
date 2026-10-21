import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import makeLoader from './helpers/load-ts.mjs';

const load = makeLoader();
const quotes = load('lib/bonds/market-quotes.ts');
const table = rows => `<table><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const bondRows = table([
  ['FXD1/2024/20Yrs (Re-opened)<span>TREASURY</span>','102.50','102.70','(0.19%)','3,500,000','3,587,500'],
  ['FXD1/2024/20Yrs (Re-opened) TREASURY','103.20','102.50','(0.68%)','900,000','928,800'],
  ['FXD0/2026/15Yrs TREASURY','0.00','0.00','0%','0','0'],
]);
const listedRows = table([['FXD1/2024/20Yrs TREASURY','RW-TEST','2024-01-01','2044-01-01','13%','13%']]);
const equityRows = 'Last updated - 21 October 14:27 GMT+2' + table([
  ['<img src="logo.png">Bank of Kigali Group PLC <span>BOK</span>','700','690','1%','0','0'],
  ['I&amp;M Bank Rwanda PLC IMR','115','115','0%','8,100','931,500'],
]);
test('parsers retain genuine prices, ignore zero placeholders, and preserve equity symbols', () => {
  assert.equal(quotes.parseBondQuotes(bondRows).length,2);
  assert.equal(quotes.parseBondQuotes(table([['FXD0/2026/15Yrs','0','0','0','0','0']])).length,0);
  assert.equal(quotes.parseBondQuotes('upstream error page').length,0);
  const equities=quotes.parseEquityQuotes(equityRows);
  assert.deepEqual(equities.map(row=>[row.ticker,row.closing,row.volume]),[['BOK',700,0],['IMR',115,8100]]);
  assert.equal(quotes.marketNumber('—'),null);assert.equal(quotes.marketNumber('not 100'),null);
  assert.equal(quotes.marketNumber('1,234.50'),1234.5);
  assert.equal(quotes.publishedEquityDate(equityRows,'2026-10-21T14:00:00Z'),'2026-10-21T12:27:00.000Z');
  assert.equal(quotes.publishedEquityDate('Last updated - 31 December 14:00 GMT+2','2027-01-01T12:00:00Z'),'2026-12-31T12:00:00.000Z');
  assert.equal(quotes.publishedEquityDate('Last updated - 31 February 14:00 GMT+2','2026-03-01T12:00:00Z'),null);
});
test('bond identity handles reopenings and exposes all listed prices without guessing a latest trade', () => {
  const data={quotes:quotes.parseBondQuotes(bondRows),listings:quotes.parseListedBonds(listedRows)};
  assert.deepEqual(quotes.bondQuoteRange({isin:'RW-TEST',bondName:'custom investor label'},data),{low:102.5,high:103.2,rows:2});
  assert.deepEqual(quotes.bondQuoteRange({isin:'',bondName:'FXD1/2024/20YR'},data),{low:102.5,high:103.2,rows:2});
  assert.equal(quotes.bondQuoteRange({isin:'WRONG-CODE',bondName:'FXD1/2024/20YR'},data),null);
  assert.equal(quotes.bondQuoteRange({isin:'',bondName:'FXD1/2025/20YR'},data),null);
  assert.equal(quotes.bondQuoteRange({isin:'',bondName:'FXD1/2024/20YR'},{...data,quotes:data.quotes.map(row=>({...row,volume:0}))}),null);
});
test('equity gains compare closing value against cash cost and never convert currencies or count sold positions', () => {
  const holding={ticker:'BOK',status:'active',currency:'RWF',shares:500,netAmountPayable:340729};
  const result=quotes.equityValuation(holding,quotes.parseEquityQuotes(equityRows));
  assert.equal(result.value,350000);assert.equal(result.gain,9271);
  assert.equal(quotes.equityValuation({...holding,ticker:'UNKNOWN'},quotes.parseEquityQuotes(equityRows)),null);
  assert.equal(quotes.equityValuation({...holding,currency:'USD'},quotes.parseEquityQuotes(equityRows)),null);
  assert.equal(quotes.equityValuation({...holding,status:'sold'},quotes.parseEquityQuotes(equityRows)),null);
});
test('monthly and yearly views use actual observations, deduplicate days, and do not invent missing or future prices', () => {
  const point=(date,closing,ticker='BOK',observedAt=date+'T14:00:00Z')=>({date,closing,ticker,observedAt});
  const values=[point('2025-03-31',600),point('2026-02-28',650),point('2026-03-20',680),point('2026-03-20',690,'BOK','2026-03-20T15:00:00Z'),point('2026-04-01',900),point('2026-03-20',10,'IMR'),point('2026-03-21',0)];
  const now=new Date('2026-03-31T16:00:00Z');
  const month=quotes.equityHistorySeries(values,'BOK','month',now);
  assert.deepEqual(month.map(row=>[row.date,row.closing]),[['2026-02-28',650],['2026-03-20',690]]);
  assert.equal(quotes.equityHistorySeries(values,'BOK','year',now).length,3);
  assert.equal(quotes.equityHistorySeries([],'BOK','all',now).length,0);
});
test('history graphs value only shares already bought, with purchase-cost anchors even before history builds', async () => {
  const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
  const Chart=makeLoader()('component/bonds/StockHistoryChart.tsx').default;
  const holdings=[{ticker:'BOK',status:'active',tradeDate:'2020-01-02',shares:100,netAmountPayable:10000},{ticker:'BOK',status:'active',tradeDate:'2020-01-05',shares:50,netAmountPayable:5500}];
  const point=(date,closing)=>({date,closing,ticker:'BOK',observedAt:date+'T14:00:00Z'});
  const observations=[point('2020-01-01',90),point('2020-01-02',100),point('2020-01-05',110)];
  const html=renderToStaticMarkup(createElement(Chart,{holdings,observations,period:'all',valuationDate:'2020-01-10'}));
  assert.match(html,/<polyline/);assert.match(html,/100 shares at 100/);assert.match(html,/150 shares at 110/);
  assert.equal(html.includes('2020-01-01:'),false);
  const single=renderToStaticMarkup(createElement(Chart,{holdings,observations:[observations[1]],period:'all',valuationDate:'2020-01-10',latestQuote:{closing:110,date:'2020-01-09'}}));
  assert.match(single,/<svg/);assert.match(single,/2020-01-10 \(today\)/);assert.match(single,/using RSE quote dated 2020-01-09/);assert.match(single,/stroke-dasharray/);assert.equal(single.includes('At least two dates'),false);
  const empty=renderToStaticMarkup(createElement(Chart,{holdings,observations:[],period:'all',valuationDate:'2020-01-10'}));
  assert.match(empty,/<svg/);assert.match(empty,/Current RSE value is unavailable/);
  const noHoldings=renderToStaticMarkup(createElement(Chart,{holdings:[],observations:[],period:'all'}));
  assert.match(noHoldings,/No active shares/);
});
test('repeat purchases use share-weighted cash cost and never count later shares in earlier observations', () => {
  const {stockChartData}=makeLoader()('lib/bonds/stock-chart.ts');
  const holdings=[{ticker:'BOK',status:'active',tradeDate:'2026-09-01',shares:100,netAmountPayable:60100},{ticker:'BOK',status:'active',tradeDate:'2026-10-01',shares:300,netAmountPayable:210300},{ticker:'BOK',status:'sold',tradeDate:'2026-08-01',shares:999,netAmountPayable:999999},{ticker:'BOK',status:'active',tradeDate:'2026-11-01',shares:500,netAmountPayable:500000}];
  const observations=[{ticker:'BOK',date:'2026-09-15',closing:650,observedAt:'2026-09-15T14:00:00Z'},{ticker:'BOK',date:'2026-10-21',closing:700,observedAt:'2026-10-21T14:00:00Z'}];
  const data=stockChartData(holdings,observations,'all','2026-10-22',{closing:700,date:'2026-10-21'});
  assert.deepEqual(data.totals,{shares:400,value:270400});assert.equal(data.averageCashCost,676);
  assert.deepEqual(data.quotes.map(point=>[point.date,point.shares,point.value]),[['2026-09-15',100,65000],['2026-10-21',400,280000]]);
  assert.deepEqual(data.cost.map(point=>[point.date,point.value]),[['2026-09-01',60100],['2026-10-01',270400],['2026-10-22',270400]]);
  assert.equal(data.current.date,'2026-10-22');assert.equal(data.current.quoteDate,'2026-10-21');assert.equal(data.current.value,280000);
  assert.equal(observations.length,2);assert.equal(data.quotes.some(point=>point.date==='2026-10-22'),false);
  const month=stockChartData(holdings,observations,'month','2026-10-22',{closing:700,date:'2026-10-21'});
  assert.equal(month.cost[0].date,'2026-09-22');assert.equal(month.cost[0].value,60100);
});
test('a same-day purchase produces a same-day comparison without inventing a previous date', async () => {
  const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
  const Chart=makeLoader()('component/bonds/StockHistoryChart.tsx').default;
  const html=renderToStaticMarkup(createElement(Chart,{holdings:[{ticker:'BOK',status:'active',tradeDate:'2026-10-22',shares:100,netAmountPayable:68000}],observations:[],period:'all',valuationDate:'2026-10-22',latestQuote:{closing:700,date:'2026-10-21'}}));
  assert.match(html,/Same-day purchase and valuation/);assert.match(html,/RWF 70,000/);assert.equal(html.includes('NaN'),false);assert.equal(html.includes('2026-10-20'),false);
});
test('RSE loading deduplicates concurrent requests, bounds pagination, caches quotes, and handles partial pages', async () => {
  const originalFetch=global.fetch;
  const calls=[];
  global.fetch=async(url,options)=>{
    calls.push(String(url));assert.equal(options.next.revalidate,900);
    if(String(url).includes('page_bonds-trades=2'))throw new Error('temporary page failure');
    if(String(url).includes('outstanding-bonds'))return new Response(listedRows);
    return new Response(bondRows+(String(url).includes('?')?'':'<a href="?page_bonds-trades=3">3</a>'));
  };
  try {
    const service=makeLoader()('lib/bonds/rse-quotes.ts');
    const [a,b]=await Promise.all([service.getBondQuotes(),service.getBondQuotes()]);
    assert.equal(a,b);assert.equal(a.source.status,'partial');assert.equal(a.quotes.length,4);
    const count=calls.length;await service.getBondQuotes();assert.equal(calls.length,count);
    assert.equal(quotes.rsePageCount('page_bonds-trades=1000'),8);
    assert.equal(a.source.publishedAt,null);
  } finally {global.fetch=originalFetch;}
});
test('upstream failures return an unavailable state and cached successes are marked stale', async () => {
  const originalFetch=global.fetch,originalNow=Date.now;
  let fail=false,offset=0;
  global.fetch=async()=>{if(fail)throw new Error('unavailable');return new Response(equityRows);};
  Date.now=()=>originalNow()+offset;
  try {
    const service=makeLoader()('lib/bonds/rse-quotes.ts');
    const fresh=await service.getEquityQuotes();assert.equal(fresh.source.status,'available');
    offset=16*60000;fail=true;
    const stale=await service.getEquityQuotes();assert.equal(stale.source.stale,true);assert.equal(stale.quotes.length,2);
    const unavailable=await makeLoader()('lib/bonds/rse-quotes.ts').getEquityQuotes();
    assert.equal(unavailable.source.status,'error');assert.deepEqual(unavailable.quotes,[]);
  } finally {global.fetch=originalFetch;Date.now=originalNow;}
});
test('quote responses finish before optional observation writes and invalid requests never fetch upstream', async () => {
  const {NextRequest,NextResponse}=await import('next/server.js');
  const afters=[];let fetched=0,writes=0;
  const fixture={source:{status:'available',checkedAt:'2026-10-21T14:00:00Z',publishedAt:null,stale:false},quotes:quotes.parseEquityQuotes(equityRows)};
  const route=makeLoader({
    'next/server':{NextRequest,NextResponse,after:callback=>afters.push(callback)},
    '@/lib/bonds/rse-quotes':{getBondQuotes:async()=>{fetched++;return {quotes:[]};},getEquityQuotes:async()=>{fetched++;return fixture;}},
    '@/lib/bonds/equity-observations':{recordEquityQuotes:async()=>{writes++;}},
  })('app/api/bonds/rse/quotes/route.ts');
  assert.equal((await route.GET(new NextRequest('https://bonds.example.test/api/bonds/rse/quotes?kind=invalid'))).status,400);
  assert.equal(fetched,0);
  const response=await route.GET(new NextRequest('https://bonds.example.test/api/bonds/rse/quotes?kind=equities'));
  assert.equal(response.status,200);assert.equal((await response.json()).quotes[0].ticker,'BOK');assert.equal(writes,0);
  assert.equal(afters.length,1);await afters[0]();assert.equal(writes,1);
  const history=makeLoader({'@/lib/bonds/equity-observations':{listEquityObservations:async tickers=>({available:true,observations:tickers.map(ticker=>({ticker,date:'2026-10-21',closing:700}))})}})('app/api/bonds/rse/equity-history/route.ts');
  for(const value of ['', '../owner', 'BOK;DROP TABLE']) assert.equal((await history.GET(new NextRequest('https://bonds.example.test/api/bonds/rse/equity-history?tickers='+encodeURIComponent(value)))).status,400);
  const result=await history.GET(new NextRequest('https://bonds.example.test/api/bonds/rse/equity-history?tickers=BOK,BOK'));
  assert.deepEqual((await result.json()).observations,[{ticker:'BOK',date:'2026-10-21',closing:700}]);
});
test('daily public quote observations are idempotent, reject older overwrites, and remain separate by symbol', async () => {
  const pg=new PGlite(), originalEnv={...process.env};
  const sql=async(strings,...values)=>(await pg.query(strings.reduce((text,part,index)=>text+part+(index<values.length?`$${index+1}`:''),''),values)).rows;
  try {
    process.env.BONDS_DATABASE_URL='postgresql://test.invalid/mock';
    await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''));
    const store=makeLoader({'@neondatabase/serverless':{neon:()=>sql}})('lib/bonds/equity-observations.ts');
    const data={source:{status:'available',checkedAt:'2026-10-21T14:00:00Z',publishedAt:'2026-10-21T12:27:00Z',stale:false},quotes:quotes.parseEquityQuotes(equityRows)};
    await store.recordEquityQuotes(data);await store.recordEquityQuotes(data);
    assert.equal((await store.listEquityObservations(['BOK','IMR'])).observations.length,2);
    await store.recordEquityQuotes({...data,source:{...data.source,checkedAt:'2026-10-21T13:00:00Z'},quotes:[{ticker:'BOK',closing:1}]});
    assert.equal((await store.listEquityObservations(['BOK'])).observations[0].closing,700);
    await store.recordEquityQuotes({...data,source:{...data.source,checkedAt:'2026-10-22T14:00:00Z',publishedAt:'2026-10-22T12:00:00Z'}});
    assert.equal((await store.listEquityObservations(['BOK'])).observations.length,2);
    assert.deepEqual((await store.listEquityObservations(['NOTHELD'])).observations,[]);
    delete process.env.BONDS_DATABASE_URL;delete process.env.DATABASE_URL;
    assert.equal((await store.listEquityObservations(['BOK'])).available,false);
  } finally {process.env=originalEnv;await pg.close();}
});
test('optional work waits for document load, visible page, quiet resources and an idle slot, and cancels cleanly', async () => {
  const originals={window:global.window,document:global.document,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout,performance:Object.getOwnPropertyDescriptor(global,'performance')};
  let now=1000,lastEnd=900,count=0,nextId=0;const timers=new Map(),idles=[];
  global.window={requestIdleCallback:callback=>{idles.push(callback);return 1;},cancelIdleCallback:()=>idles.splice(0)};
  global.document={readyState:'loading',visibilityState:'visible'};
  global.setTimeout=callback=>{timers.set(++nextId,callback);return nextId;};global.clearTimeout=id=>timers.delete(id);
  Object.defineProperty(global,'performance',{configurable:true,value:{now:()=>now,getEntriesByType:()=>[{responseEnd:lastEnd}]}});
  const tick=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
  const controller=new AbortController();
  try {
    const {deferMarketTask}=makeLoader()('lib/bonds/deferred-market.ts');
    deferMarketTask(async()=>{count++;},controller.signal);
    tick();assert.equal(count,0);assert.equal(idles.length,0);
    document.readyState='complete';document.visibilityState='hidden';now=3000;tick();assert.equal(idles.length,0);
    document.visibilityState='visible';lastEnd=2900;tick();assert.equal(idles.length,0);
    now=4000;tick();assert.equal(count,0);assert.equal(idles.length,1);
    idles.shift()({timeRemaining:()=>30});await Promise.resolve();assert.equal(count,1);
    const cancelled=new AbortController();deferMarketTask(async()=>{count++;},cancelled.signal);cancelled.abort();assert.equal(timers.size,0);
  } finally {controller.abort();global.window=originals.window;global.document=originals.document;global.setTimeout=originals.setTimeout;global.clearTimeout=originals.clearTimeout;Object.defineProperty(global,'performance',originals.performance);}
});
