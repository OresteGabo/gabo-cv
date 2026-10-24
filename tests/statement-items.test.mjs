import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';import {NextRequest} from 'next/server.js';import makeLoader from './helpers/load-ts.mjs';
const pg=new PGlite(), env={...process.env};
const sql=async(strings,...values)=>(await pg.query(strings.reduce((t,p,i)=>t+p+(i<values.length?'$'+(i+1):''),''),values)).rows;
let session={userId:randomUUID(),isOwner:false};
const load=makeLoader({'@neondatabase/serverless':{neon:()=>sql},'@/lib/bonds/auth':{getBondSession:async()=>session}});
const route=load('app/api/bonds/statement-items/route.ts'), db=load('lib/bonds/db.ts'), helper=load('lib/bonds/statement-items.ts');
const item={kind:'bond',date:'2026-10-26',amount:1200000,title:'October Bond Cost',currency:'RWF',broker:'BK Capital'};
const bond={instrumentType:'treasury',issuer:'Government of Rwanda',currency:'RWF',market:'primary',purchaseDate:'2026-10-21',settlementDate:'2026-10-23',bondName:'Synthetic October bond',isin:'TEST0000001',tenorYears:20,faceValue:1200000,pricePercent:100,accruedInterestPaid:0,feesPaid:11000,amountInvested:1211000,couponRate:.12,withholdingTaxRate:.05,maturityDate:'2046-09-28',firstCouponDate:'2027-03-28',couponDates:['2027-03-28'],couponFrequency:2,scheduleConfidence:'confirmed',broker:'BK Capital',accountReference:'',sourceUrl:'',status:'active',notes:''};
const request=(items,origin='https://bonds.example.test')=>new NextRequest('https://bonds.example.test/api/bonds/statement-items',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({items})});
test.before(async()=>{process.env.BONDS_DATABASE_URL='postgresql://test.invalid/mock';process.env.BONDS_PORTFOLIO_DATABASE='database';await pg.exec(readFileSync('db/bonds-schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''));});
test.beforeEach(async()=>{session={userId:randomUUID(),isOwner:false};await pg.exec('TRUNCATE bond_statement_items,bond_purchases,equity_purchases,bond_users');});
test.after(async()=>{process.env=env;await pg.close();});
test('statement placeholders persist once, stay out of investments, and disappear only after a confirmed purchase',async()=>{
 assert.equal((await route.POST(request([item]))).status,200);
 assert.equal((await route.POST(request([item]))).status,200);
 assert.equal((await (await route.GET()).json()).items.length,1);
 assert.equal((await db.listPurchases(session.userId)).length,0);
 const pending=await db.createPurchase(session.userId,{...bond,status:'submitted'});
 assert.equal((await (await route.GET()).json()).items.length,1);
 await db.updatePurchase(session.userId,pending.id,bond);
 assert.equal((await (await route.GET()).json()).items.length,0);
 assert.equal((await (await route.POST(request([item]))).json()).rows[0].state,'recorded');
 assert.equal((await db.listPurchases(session.userId)).length,1);
});
test('same amount for another date or multiple possible bonds cannot silently resolve a reminder',()=>{
 assert.equal(helper.statementItemMatches(item,{...bond,status:'active'}),true);
 assert.equal(helper.statementItemMatches({...item,date:'2026-11-01'},bond),false);
 assert.equal(helper.statementItemMatches({...item,amount:1211000},bond),false);
 assert.equal(helper.statementItemMatches(item,{...bond,currency:'USD'}),false);
});
test('share matching checks contract, broker, date, quantity, price and total, not ticker alone',()=>{
 const row={...item,kind:'equity',ticker:'IMR',contractNote:'10000000001#01',date:'2026-07-22',shares:200,pricePerShare:90,amount:18400};
 const purchase={instrumentType:'equity',currency:'RWF',status:'active',ticker:'IMR',broker:'BK Capital',contractNote:row.contractNote,tradeDate:row.date,shares:200,pricePerShare:90,netAmountPayable:18400};
 assert.equal(helper.statementItemMatches(row,purchase),true);
 for(const change of [{broker:'Other'},{contractNote:'different'},{shares:201},{tradeDate:'2026-07-23'},{netAmountPayable:18401}])assert.equal(helper.statementItemMatches(row,{...purchase,...change}),false);
});
test('API enforces account scope, origin, validation and session',async()=>{
 assert.equal((await route.POST(request([{...item,owner_id:'owner'}]))).status,200);
 const first=session;session={userId:randomUUID(),isOwner:false};
 assert.deepEqual((await (await route.GET()).json()).items,[]);
 assert.equal((await route.POST(request([item],'https://evil.example'))).status,403);
 for(const invalid of [{...item,kind:'receipt'},{...item,amount:-1},{...item,date:'2026-02-30'},{...item,currency:'USD'},{...item,kind:'equity'}])assert.equal((await route.POST(request([invalid]))).status,400);
 session=null;assert.equal((await route.GET()).status,401);assert.equal((await route.POST(request([item]))).status,401);
 session=first;assert.equal((await (await route.GET()).json()).items.length,1);
});
test('deleting an invited account removes its statement reminders too',async()=>{
 await pg.query('INSERT INTO bond_users(id,email,password_hash) VALUES ($1,$2,$3)',[session.userId,'demo@example.test','synthetic-hash']);
 await route.POST(request([item]));
 assert.equal(await load('lib/bonds/auth-store.ts').deleteAccount(session.userId,'demo@example.test'),true);
 assert.equal((await pg.query('SELECT * FROM bond_statement_items')).rows.length,0);
});
