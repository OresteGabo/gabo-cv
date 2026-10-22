import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import makeLoader from './helpers/load-ts.mjs';

const load = makeLoader();
const quotes = load('lib/bonds/market-quotes.ts');
const equityMarket = load('lib/bonds/equity-market.ts');
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
const allEquityRows = 'Last updated - 21 October 2026 14:27 GMT+2' + table([
  ['BRALIRWA PLC BLR','526','550','-4.36%','47100','24774600'],
  ['I&amp;M Bank Rwanda PLC IMR','115','115','0%','8100','931500'],
  ['CIMERWA PLC CMR','165','165','0%','0','0'],
  ['RH Bophelo PLC RHB','526','526','0%','0','0'],
  ['Nation Media Group PLC NMG','1200','1200','0%','0','0'],
  ['Uchumi Supermarket PLC USL','104','104','0%','0','0'],
  ['Bank of Kigali Group PLC BOK','700','700','0%','0','0'],
  ['Kenya Commercial Bank PLC KCB','500','500','0%','0','0'],
  ['MTN Rwanda PLC MTNR','200','200','0%','13200','2640000'],
  ['Equity Bank Group PLC EQTY','900','900','0%','0','0'],
]);
test('the requested ten companies match RSE symbols and changes retain their financial sign', () => {
  const values = quotes.parseEquityQuotes(allEquityRows);
  assert.equal(values.length,10);
  assert.deepEqual(values.map(row=>row.ticker),equityMarket.RSE_EQUITIES.map(row=>row.ticker));
  const change = equityMarket.equityPriceChange(values[0]);
  assert.equal(change.amount,-24);assert.ok(Math.abs(change.percent-(-24/550*100))<0.00001);
  assert.deepEqual(equityMarket.equityPriceChange(values[6]),{amount:0,percent:0});
  assert.equal(equityMarket.equityPriceChange(undefined),null);
  for(const previous of [null,0,NaN]) assert.equal(equityMarket.equityPriceChange({...values[0],previous}),null);
  assert.equal(equityMarket.equityMarketDate('2026-10-21T22:30:00Z'),'2026-10-22');
  assert.equal(equityMarket.equityMarketDate(null),null);
});
test('daily table keeps only actual prices, leaves missing companies blank and uses Kigali dates', () => {
  const point=(date,closing,ticker='BOK',observedAt=date+'T14:00:00Z')=>({date,closing,ticker,observedAt});
  const observations=[point('2026-10-20',700),point('2026-10-20',710,'BOK','2026-10-21T15:00:00Z'),point('2026-10-22',115,'IMR'),point('2026-10-23',999),point('2026-10-21',0),point('2026-09-01',500),point('2026-10-21',900,'UNKNOWN'),point('2026-02-30',100)];
  const now=new Date('2026-10-21T23:00:00Z');
  const rows=equityMarket.equityDailyRows(observations,['BOK','IMR'],'month',now);
  assert.deepEqual(rows.map(row=>row.date),['2026-10-22','2026-10-20']);
  assert.deepEqual([...rows[0].prices],[['IMR',115]]);
  assert.equal(rows[1].prices.get('BOK'),710);assert.equal(rows[1].prices.has('IMR'),false);
  assert.deepEqual(equityMarket.equityDailyRows([],['BOK'],'month',now),[]);
  const year=equityMarket.equityDailyRows(observations,['BOK'],'year',now);
  assert.equal(year.some(row=>row.date==='2026-02-30'),false);
  assert.equal(year.at(-1).date,'2026-09-01');
});
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
    assert.deepEqual(await store.recordEquityQuotes(data),{status:'saved',marketDate:'2026-10-21',written:2});
    assert.equal((await store.recordEquityQuotes(data)).written,0);
    assert.equal((await store.listEquityObservations(['BOK','IMR'])).observations.length,2);
    await store.recordEquityQuotes({...data,source:{...data.source,checkedAt:'2026-10-21T13:00:00Z'},quotes:[{ticker:'BOK',closing:1}]});
    assert.equal((await store.listEquityObservations(['BOK'])).observations[0].closing,700);
    await store.recordEquityQuotes({...data,source:{...data.source,checkedAt:'2026-10-22T14:00:00Z',publishedAt:'2026-10-22T12:00:00Z'}});
    assert.equal((await store.listEquityObservations(['BOK'])).observations.length,2);
    for(const source of [{...data.source,publishedAt:null},{...data.source,publishedAt:'invalid'},{...data.source,publishedAt:'2026-10-23T12:00:00Z'},{...data.source,stale:true},{...data.source,status:'partial'}]) {
      assert.notEqual((await store.recordEquityQuotes({...data,source})).status,'saved');
    }
    assert.equal((await store.listEquityObservations(['BOK'])).observations.length,2);
    await store.recordEquityCollectionRun('2026-10-22T18:00:00Z','saved','2026-10-22');
    await store.recordEquityCollectionRun('2026-10-23T18:00:00Z','unusable-source',null);
    await store.recordEquityCollectionRun('2026-10-21T18:00:00Z','saved','2026-10-21');
    const health=(await pg.query('SELECT status, succeeded_at::text, market_date::text FROM equity_market_collection')).rows;
    assert.equal(health.length,1);assert.equal(health[0].status,'unusable-source');assert.equal(health[0].market_date,'2026-10-22');assert.match(health[0].succeeded_at,/2026-10-22/);
    assert.deepEqual((await store.listEquityObservations(['NOTHELD'])).observations,[]);
    const allData={source:{...data.source,checkedAt:'2026-10-22T18:00:00Z',publishedAt:'2026-10-22T12:27:00Z'},quotes:quotes.parseEquityQuotes(allEquityRows)};
    assert.equal((await store.recordEquityQuotes(allData)).written,10);
    const nextDay={...allData,source:{...allData.source,checkedAt:'2026-10-23T18:00:00Z',publishedAt:'2026-10-23T12:27:00Z'}};
    assert.equal((await store.recordEquityQuotes(nextDay)).written,10);
    assert.equal((await store.recordEquityQuotes(nextDay)).written,0);
    const fullHistory=await store.listEquityObservations(equityMarket.RSE_EQUITIES.map(company=>company.ticker),'month',new Date('2026-10-24T10:00:00Z'));
    const days=equityMarket.equityDailyRows(fullHistory.observations,equityMarket.RSE_EQUITIES.map(company=>company.ticker),'month',new Date('2026-10-24T10:00:00Z'));
    assert.deepEqual(days.slice(0,2).map(day=>[day.date,day.prices.size]),[['2026-10-23',10],['2026-10-22',10]]);
    assert.equal(days[0].prices.get('BOK'),days[1].prices.get('BOK'));
    delete process.env.BONDS_DATABASE_URL;delete process.env.DATABASE_URL;
    assert.equal((await store.listEquityObservations(['BOK'])).available,false);
  } finally {process.env=originalEnv;await pg.close();}
});
test('long histories keep all raw rows and return real monthly endpoints, with daily month/year views', async () => {
  const pg=new PGlite(), originalEnv={...process.env};
  const sql=async(strings,...values)=>(await pg.query(strings.reduce((text,part,index)=>text+part+(index<values.length?`$${index+1}`:''),''),values)).rows;
  try {
    process.env.BONDS_DATABASE_URL='postgresql://test.invalid/mock';
    await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''));
    await pg.exec(`INSERT INTO equity_market_observations (ticker,observed_date,closing_price,observed_at)
      SELECT 'BOK', day::date, 700, day FROM generate_series('2022-01-01'::timestamp,'2026-10-22'::timestamp,'1 day') day`);
    const store=makeLoader({'@neondatabase/serverless':{neon:()=>sql}})('lib/bonds/equity-observations.ts');
    const now=new Date('2026-10-22T18:00:00Z');
    const all=await store.listEquityObservations(['BOK'],'all',now);
    assert.equal(all.resolution,'monthly');assert.equal(all.observations[0].date,'2022-01-01');assert.equal(all.observations.at(-1).date,'2026-10-22');assert.ok(all.observations.length<120);
    const year=await store.listEquityObservations(['BOK'],'year',now);
    assert.equal(year.resolution,'daily');assert.equal(year.observations.length,366);
    const month=await store.listEquityObservations(['BOK'],'month',now);
    assert.equal(month.resolution,'daily');assert.equal(month.observations.length,31);
    assert.ok((await pg.query('SELECT count(*)::int AS count FROM equity_market_observations')).rows[0].count>1700);
    assert.equal(quotes.equityHistorySeries(year.observations.concat(all.observations),'BOK','all',now)[0].date,'2022-01-01');
  } finally {process.env=originalEnv;await pg.close();}
});
test('scheduled fetching bypasses both caches and never returns a stale success', async () => {
  const originalFetch=global.fetch;let calls=0,fail=false;
  global.fetch=async(url,options)=>{
    calls++;assert.equal(String(url),'https://rse.rw/equities-market');
    if(calls>1) {assert.equal(options.cache,'no-store');assert.equal(options.next,undefined);}
    if(fail)throw new Error('offline');
    return new Response(equityRows+'<a href="?page_bonds-trades=3">3</a>');
  };
  try {
    const service=makeLoader()('lib/bonds/rse-quotes.ts');
    await service.getEquityQuotes();await service.getEquityQuotes();assert.equal(calls,1);
    await service.getEquityQuotes({fresh:true});assert.equal(calls,2);
    fail=true;const failed=await service.getEquityQuotes({fresh:true});assert.equal(failed.source.status,'error');assert.equal(failed.source.stale,false);assert.deepEqual(failed.quotes,[]);
  } finally {global.fetch=originalFetch;}
});
test('daily cron fails closed, retries upstream once, awaits persistence and reports failures', async () => {
  const {NextRequest}=await import('next/server.js');const originalEnv={...process.env};
  let fetches=0,writes=0,failWrite=false,sourceStatus='available';const health=[],freshOptions=[];
  const route=makeLoader({
    '@/lib/bonds/rse-quotes':{getEquityQuotes:async options=>{fetches++;freshOptions.push(options);return {source:{status:sourceStatus,publishedAt:'2026-10-21T12:00:00Z'},quotes:[]};}},
    '@/lib/bonds/equity-observations':{
      recordEquityQuotes:async()=>{await Promise.resolve();writes++;if(failWrite)throw new Error('private connection error');return {status:sourceStatus==='available'?'saved':'unusable-source',marketDate:'2026-10-21',written:2};},
      recordEquityCollectionRun:async(...args)=>{health.push(args);},
    },
  })('app/api/bonds/rse/daily/route.ts');
  const req=token=>new NextRequest('https://bonds.example.test/api/bonds/rse/daily',{headers:token?{authorization:`Bearer ${token}`}:{}});
  try {
    delete process.env.CRON_SECRET;assert.equal((await route.GET(req('secret'))).status,401);
    process.env.CRON_SECRET='test-cron-secret';assert.equal((await route.GET(req())).status,401);assert.equal((await route.GET(req('wrong'))).status,401);assert.equal(fetches,0);assert.equal(writes,0);
    const ok=await route.GET(req('test-cron-secret'));assert.equal(ok.status,200);assert.equal(writes,1);assert.equal(health[0][1],'saved');assert.equal(ok.headers.get('cache-control'),'no-store');assert.deepEqual(freshOptions,[{fresh:true}]);
    sourceStatus='error';const before=fetches;assert.equal((await route.GET(req('test-cron-secret'))).status,503);assert.equal(fetches-before,2);
    sourceStatus='available';failWrite=true;const failed=await route.GET(req('test-cron-secret'));assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{status:'collection-failed'});assert.equal(health.at(-1)[1],'collection-failed');
    const history=makeLoader({'@/lib/bonds/equity-observations':{listEquityObservations:async(tickers,period)=>({tickers,period})}})('app/api/bonds/rse/equity-history/route.ts');
    const historyReq=period=>new NextRequest(`https://bonds.example.test/api/bonds/rse/equity-history?tickers=BOK&period=${period}`);
    assert.equal((await history.GET(historyReq('bad'))).status,400);assert.deepEqual(await (await history.GET(historyReq('year'))).json(),{tickers:['BOK'],period:'year'});
    const config=JSON.parse(readFileSync('vercel.json','utf8'));assert.deepEqual(config.crons,[{path:'/api/bonds/rse/daily',schedule:'0 18 * * *'}]);
  } finally {process.env=originalEnv;}
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
