import test from 'node:test';
import assert from 'node:assert/strict';
import makeLoader from './helpers/load-ts.mjs';
const {mobilePortfolioOverview,overviewStart} = makeLoader()('lib/bonds/mobile-overview.ts');
const share = (id,date,status='active',ticker='BOK') => ({id,createdAt:date,tradeDate:date,status,ticker,currency:'RWF',shares:100,netAmountPayable:36500,contractNote:'private detail',notes:'private notes'});
const bond = (id,date,status='active') => ({id,createdAt:date,purchaseDate:date,status,currency:'RWF',faceValue:100000,couponRate:.1,withholdingTaxRate:.05,pricePercent:100,feesPaid:0,accruedInterestPaid:0,notes:'private notes',sourceUrl:'private source',accountReference:'private reference'});
test('year window clamps leap dates and includes exact boundaries',()=>{
 assert.equal(overviewStart('2024-02-29'),'2023-02-28');
 const data=mobilePortfolioOverview([bond('boundary','2025-10-23','sold'),bond('today','2026-10-23'),bond('old','2025-10-22','sold'),bond('future','2026-10-24','submitted')],[],'2026-10-23');
 assert.deepEqual([...data.recentPurchaseIds],['today','boundary']);
 assert.equal(data.purchases.length,2);
});
test('recent previews are bounded and old share lots collapse without losing active totals',()=>{
 const old=Array.from({length:500},(_,i)=>share(`old${i}`,'2024-01-01'));
 const recent=Array.from({length:30},(_,i)=>share(`recent${i}`,'2026-01-01'));
 const result=mobilePortfolioOverview([], [...old,...recent,share('sold','2024-01-01','sold'),share('future','2027-01-01')],'2026-10-23');
 assert.equal(result.recentHoldingIds.length,12);
 assert.equal(result.holdings.length,13);
 assert.equal(result.holdings.reduce((sum,row)=>sum+row.shares,0),53000);
 assert.equal(result.holdings.reduce((sum,row)=>sum+row.netAmountPayable,0),530*36500);
 assert.equal(result.holdings.reduce((sum,row)=>sum+(row.lotCount??1),0),530);
 assert.ok(result.holdings.some(row=>row.contractNote==='private detail'));
 const compact=result.holdings.find(row=>row.lotCount>1);
 assert.equal(compact.contractNote,undefined);
 assert.equal(compact.notes,undefined);
});
test('old active bond payment terms stay while irrelevant private text and closed records are omitted',()=>{
 const data=mobilePortfolioOverview([bond('old','2020-01-01'),bond('closed','2020-01-01','matured'),bond('recent','2026-01-01','sold')],[],'2026-10-23');
 assert.deepEqual(data.purchases.map(row=>row.id),['recent','old']);
 const old=data.purchases[1];assert.equal(old.faceValue,100000);assert.equal(old.couponRate,.1);
 assert.equal(old.notes,undefined);assert.equal(old.sourceUrl,undefined);
 assert.equal(data.purchases[0].notes,'private notes');
});
test('currencies and issuers aggregate separately and input arrays are not changed',()=>{
 const first=share('a','2020-01-01');const second={...share('b','2020-01-01'),currency:'USD'};
 const rows=[first,second,share('c','2020-01-01','active','IMR')];const before=JSON.stringify(rows);
 const data=mobilePortfolioOverview([],rows,'2026-10-23');
 assert.equal(data.holdings.length,3);assert.equal(JSON.stringify(rows),before);
});

test('overview route enforces account isolation and disables shared caching',async()=>{
 let session=null;const owners=[];
 const {GET}=makeLoader({
  '@/lib/bonds/auth':{getBondSession:async()=>session},
  '@/lib/bonds/db':{listPurchases:async id=>{owners.push(['bonds',id]);return [bond('only-this-owner','2020-01-01')]}},
  '@/lib/bonds/equities':{listEquityHoldings:async id=>{owners.push(['shares',id]);return []}},
 })('app/api/bonds/mobile-overview/route.ts');
 const denied=await GET();assert.equal(denied.status,401);assert.equal(owners.length,0);
 session={userId:'synthetic-account'};
 const response=await GET();assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('vary'),'Cookie');
 assert.deepEqual(owners,[['bonds','synthetic-account'],['shares','synthetic-account']]);
 assert.equal((await response.json()).version,1);
});
test('overview database errors have a generic response without private details',async()=>{
 const {GET}=makeLoader({
  '@/lib/bonds/auth':{getBondSession:async()=>({userId:'synthetic-account'})},
  '@/lib/bonds/db':{listPurchases:async()=>{throw new Error('private database connection information')}},
  '@/lib/bonds/equities':{listEquityHoldings:async()=>[]},
 })('app/api/bonds/mobile-overview/route.ts');
 const response=await GET();assert.equal(response.status,503);
 assert.equal((await response.json()).error,'The portfolio could not be loaded. Please try again.');
});
