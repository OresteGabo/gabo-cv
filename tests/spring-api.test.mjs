import test from 'node:test';
import assert from 'node:assert/strict';
import makeLoader from './helpers/load-ts.mjs';

const {portfolioApiOrigin, DEFAULT_PORTFOLIO_API_ORIGIN}=makeLoader()('lib/portfolio-api-origin.ts');

test('backend configuration permits HTTPS and only development loopback HTTP, without credential or path forwarding',()=>{
 assert.equal(portfolioApiOrigin('',true),DEFAULT_PORTFOLIO_API_ORIGIN);
 assert.equal(portfolioApiOrigin('https://spring.example.test/',true),'https://spring.example.test');
 assert.equal(portfolioApiOrigin('http://localhost:8080',false),'http://localhost:8080');
 for(const value of ['http://localhost:8080','https://user:secret@spring.example.test','https://spring.example.test/api','https://spring.example.test/?secret=x','https://spring.example.test/#x','file:///private/data'])assert.throws(()=>portfolioApiOrigin(value,true));
 assert.throws(()=>portfolioApiOrigin('http://localhost.evil.test:8080',false));
});

test('every public API path uses Spring with no legacy backend fallback',async()=>{
 const old=process.env.BONDS_API_ORIGIN;process.env.BONDS_API_ORIGIN='https://spring.example.test';
 try {
  const config=makeLoader()('next.config.ts').default;
  assert.deepEqual(await config.rewrites(),{beforeFiles:[{source:'/api/bonds/:path*',destination:'https://spring.example.test/api/bonds/:path*'}],afterFiles:[],fallback:[]});
 } finally {if(old===undefined)delete process.env.BONDS_API_ORIGIN;else process.env.BONDS_API_ORIGIN=old;}
});

test('server-rendered market data uses Spring and degrades safely when the API is unavailable',async()=>{
 const original=global.fetch, old=process.env.BONDS_API_ORIGIN;
 process.env.BONDS_API_ORIGIN='https://spring.example.test';
 const payload={trades:[],outstanding:[],tradesStatus:'available',fixedIncomePagesFetched:1,treasuryRowsAnalyzed:0,fetchedAt:'2026-10-26T10:00:00Z'};
 let request;
 global.fetch=async(url,options)=>{request={url,options};return {ok:true,json:async()=>payload};};
 try {
  const {getRseMarketData}=makeLoader()('lib/bonds/rse.ts');
  assert.deepEqual(await getRseMarketData(true),payload);
  assert.equal(request.url,'https://spring.example.test/api/bonds/rse/market?refresh=1');
  assert.equal(request.options.cache,'no-store');assert.ok(request.options.signal instanceof AbortSignal);
  global.fetch=async()=>{throw new Error('private exception details');};
  const unavailable=await getRseMarketData();
  assert.equal(unavailable.tradesStatus,'error');assert.deepEqual(unavailable.outstanding,[]);
  assert.equal(JSON.stringify(unavailable).includes('private'),false);
 } finally {global.fetch=original;if(old===undefined)delete process.env.BONDS_API_ORIGIN;else process.env.BONDS_API_ORIGIN=old;}
});
