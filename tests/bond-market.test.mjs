import test from 'node:test';
import assert from 'node:assert/strict';
import makeLoader from './helpers/load-ts.mjs';

const load = makeLoader();
const quotes = load('lib/bonds/market-quotes.ts');
const equityMarket = load('lib/bonds/equity-market.ts');
const priceChart = load('lib/bonds/equity-price-chart.ts');
// API-shaped fixtures: upstream HTML parsing belongs to Spring.
const bondQuotes = [
  {bond:'FXD1/2024/20Yrs (Re-opened) TREASURY',closing:102.5,previous:102.7,volume:3500000},
  {bond:'FXD1/2024/20Yrs (Re-opened) TREASURY',closing:103.2,previous:102.5,volume:900000},
];
const listings = [{bond:'FXD1/2024/20Yrs TREASURY',code:'RW-TEST'}];
const equityQuotes = [
  {name:'Bank of Kigali Group PLC',ticker:'BOK',closing:700,previous:690,volume:0},
  {name:'I&M Bank Rwanda PLC',ticker:'IMR',closing:115,previous:115,volume:8100},
];
const allEquityQuotes = [
  ['BRALIRWA PLC','BLR',526,550],['I&M Bank Rwanda PLC','IMR',115,115],
  ['CIMERWA PLC','CMR',165,165],['RH Bophelo PLC','RHB',526,526],
  ['Nation Media Group PLC','NMG',1200,1200],['Uchumi Supermarket PLC','USL',104,104],
  ['Bank of Kigali Group PLC','BOK',700,700],['Kenya Commercial Bank PLC','KCB',500,500],
  ['MTN Rwanda PLC','MTNR',200,200],['Equity Bank Group PLC','EQTY',900,900],
].map(([name,ticker,closing,previous])=>({name,ticker,closing,previous,volume:0}));
test('the requested ten companies match RSE symbols and changes retain their financial sign', () => {
  const values = allEquityQuotes;
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
test('company price graphs preserve years, isolate symbols and rebase percentages within each selected range', () => {
  const point=(date,closing,ticker='BOK',observedAt=date+'T14:00:00Z')=>({date,closing,ticker,observedAt});
  const values=[point('2022-01-03',500),point('2023-04-05',600),point('2026-10-20',700),point('2026-10-20',750,'BOK','2026-10-21T15:00:00Z'),point('2026-10-21',100,'IMR'),point('2026-10-22',110,'IMR'),point('2026-10-23',999),point('2026-10-21',0),point('2026-02-30',400)];
  const now=new Date('2026-10-22T10:00:00Z');
  const all=priceChart.equityPriceChartData(values,['BOK','IMR'],'all','price',now);
  assert.equal(all.startDate,'2022-01-03');assert.equal(all.endDate,'2026-10-22');
  assert.deepEqual(all.series[0].points.map(point=>point.value),[500,600,750]);
  assert.equal(all.series[0].points.some(point=>point.date==='2026-10-21'),false);
  const rebased=priceChart.equityPriceChartData(values,['BOK','IMR'],'all','change',now);
  assert.equal(rebased.series[0].last.value,50);
  assert.ok(Math.abs(rebased.series[1].last.value-10)<0.00001);
  assert.equal(rebased.series[1].first.date,'2026-10-21');
  const month=priceChart.equityPriceChartData(values,['BOK'],'month','change',now);
  assert.equal(month.series.length,1);assert.deepEqual(month.series[0].points,[{date:'2026-10-20',closing:750,value:0}]);
  assert.ok(month.minimum<month.maximum);
  assert.equal(priceChart.equityPriceChartData([],['BOK'],'all','price',now),null);
  assert.equal(priceChart.equityPriceChartData(values,['UNKNOWN'],'all','price',now),null);
  assert.equal(priceChart.nearestEquityPriceDate(all.dates,Date.parse('2023-04-04')),'2023-04-05');
  assert.equal(priceChart.nearestEquityPriceDate(all.dates,0),'2022-01-03');
  assert.equal(priceChart.nearestEquityPriceDate(all.dates,Date.parse('2030-01-01')),'2026-10-22');
  assert.equal(priceChart.nearestEquityPriceDate([],0),null);
});
test('price graph renders years and exact-date inspection, with honest empty and single-date states', async () => {
  const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
  const Chart=makeLoader()('component/bonds/EquityPriceHistoryChart.tsx').default;
  const point=(date,closing,ticker='BOK')=>({date,closing,ticker,observedAt:date+'T14:00:00Z'});
  const props={observations:[point('2022-01-03',500),point('2026-10-20',750),point('2026-10-21',110,'IMR')],tickers:['BOK','IMR'],period:'all',mode:'price',now:new Date('2026-10-22T10:00:00Z')};
  const html=renderToStaticMarkup(createElement(Chart,props));
  assert.match(html,/<polyline/);assert.match(html,/03\/01\/2022/);assert.match(html,/No recorded price on this date/);assert.match(html,/type="range"/);assert.equal(html.includes('NaN'),false);
  const single=renderToStaticMarkup(createElement(Chart,{...props,observations:[point('2026-10-21',700)],tickers:['BOK'],mode:'change'}));
  assert.match(single,/<circle/);assert.equal(single.includes('<polyline'),false);assert.match(single,/Only one market date/);assert.equal(single.includes('NaN'),false);assert.equal(single.includes('type="range"'),false);
  const empty=renderToStaticMarkup(createElement(Chart,{...props,observations:[]}));
  assert.equal(empty.includes('<svg'),false);assert.match(empty,/Earlier years need historical price data/);
});
test('bond identity handles reopenings and exposes all listed prices without guessing a latest trade', () => {
  const data={quotes:bondQuotes,listings};
  assert.deepEqual(quotes.bondQuoteRange({isin:'RW-TEST',bondName:'custom investor label'},data),{low:102.5,high:103.2,rows:2});
  assert.deepEqual(quotes.bondQuoteRange({isin:'',bondName:'FXD1/2024/20YR'},data),{low:102.5,high:103.2,rows:2});
  assert.equal(quotes.bondQuoteRange({isin:'WRONG-CODE',bondName:'FXD1/2024/20YR'},data),null);
  assert.equal(quotes.bondQuoteRange({isin:'',bondName:'FXD1/2025/20YR'},data),null);
  assert.equal(quotes.bondQuoteRange({isin:'',bondName:'FXD1/2024/20YR'},{...data,quotes:data.quotes.map(row=>({...row,volume:0}))}),null);
});
test('equity gains compare closing value against cash cost and never convert currencies or count sold positions', () => {
  const holding={ticker:'BOK',status:'active',currency:'RWF',shares:500,netAmountPayable:340729};
  const result=quotes.equityValuation(holding,equityQuotes);
  assert.equal(result.value,350000);assert.equal(result.gain,9271);
  assert.equal(quotes.equityValuation({...holding,ticker:'UNKNOWN'},equityQuotes),null);
  assert.equal(quotes.equityValuation({...holding,currency:'USD'},equityQuotes),null);
  assert.equal(quotes.equityValuation({...holding,status:'sold'},equityQuotes),null);
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
