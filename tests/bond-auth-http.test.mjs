// Run against an isolated QA Next server; never target a real portfolio.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.BONDS_AUTH_TEST_URL;
if(!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Set BONDS_AUTH_TEST_URL to the isolated local QA server.');
function client(){return {cookie:'',async request(path,method='GET',body,extra={}){
 const response=await fetch(base+path,{method,headers:{...(this.cookie?{cookie:this.cookie}:{}),...(method!=='GET'?{origin:base}:{}),...(body!==undefined?{'content-type':'application/json'}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
 for(const value of response.headers.getSetCookie())this.cookie=value.split(';')[0];
 const data=await response.json();return {status:response.status,data,headers:response.headers};
}};}
const owner=client(),friend=client(),anon=client();
const purchase={instrumentType:'treasury',issuer:'Government of Rwanda',currency:'RWF',market:'primary',purchaseDate:'2026-01-01',settlementDate:'2026-01-02',bondName:'Security isolation QA bond',isin:'TEST0000001',tenorYears:3,faceValue:1000000,pricePercent:100,accruedInterestPaid:0,feesPaid:0,couponRate:0.1,withholdingTaxRate:0.05,maturityDate:'2029-01-02',firstCouponDate:'2026-07-02',couponDates:['2026-07-02'],couponFrequency:2,scheduleConfidence:'estimated',broker:'',accountReference:'',sourceUrl:'',status:'active',notes:''};
let invite,ownerPurchase,friendPurchase;
test('anonymous callers cannot read portfolios, equities, documents, or registration settings',async()=>{
 for(const path of ['/api/bonds/purchases','/api/bonds/equities','/api/bonds/documents','/api/bonds/auth/registration','/api/bonds/auth/accounts'])assert.equal((await anon.request(path)).status,401);
 assert.equal((await anon.request('/api/bonds/auth/register','POST',{email:'closed@example.test',password:'a secure test password 2026',invite:'x'.repeat(43)})).status,403);
});
test('owner sign-in has an HTTP-only cookie and creates an email-bound invitation',async()=>{
 const result=await owner.request('/api/bonds/auth/login','POST',{email:'OWNER@EXAMPLE.TEST',password:'owner QA password for tests only'});
 assert.equal(result.status,200);assert.equal(result.data.user.isOwner,true);
 assert.ok(result.headers.get('set-cookie').includes('HttpOnly'));assert.ok(result.headers.get('set-cookie').includes('SameSite=strict'));
 const created=await owner.request('/api/bonds/purchases','POST',purchase);assert.equal(created.status,201);ownerPurchase=created.data.purchase;
 const accounts=await owner.request('/api/bonds/auth/accounts');assert.equal(accounts.status,200);
 const ownerSummary=accounts.data.accounts.find(account=>account.id==='owner').portfolio;
 assert.equal(ownerSummary.purchaseCount,1);assert.deepEqual(ownerSummary.principalByCurrency,[{currency:'RWF',amount:1000000}]);
 assert.equal(ownerSummary.latestPurchase.isin,purchase.isin);
 const invited=await owner.request('/api/bonds/auth/registration','POST',{email:'friend@example.test'});assert.equal(invited.status,201);invite=invited.data.invite;
 assert.equal((await anon.request('/api/bonds/auth/register','POST',{email:'wrong@example.test',password:'a secure test password 2026',invite})).status,403);
});
test('friend registration ignores role escalation and closes registration automatically',async()=>{
 const result=await friend.request('/api/bonds/auth/register','POST',{email:'friend@example.test',password:'friend secure password for tests',invite,isOwner:true,userId:'owner',role:'owner'});
 assert.equal(result.status,201);assert.equal(result.data.user.isOwner,false);assert.notEqual(result.data.user.id,'owner');
 assert.equal((await friend.request('/api/bonds/auth/session')).data.user.isOwner,false);
 assert.equal((await owner.request('/api/bonds/auth/registration')).data.invitation,null);
 assert.equal((await anon.request('/api/bonds/auth/register','POST',{email:'friend@example.test',password:'friend secure password for tests',invite})).status,403);
 for(const method of ['GET','POST','DELETE'])assert.equal((await friend.request('/api/bonds/auth/registration',method,method==='POST'?{email:'attacker@example.test'}:undefined)).status,403);
});
test('friend sees no owner records and cannot read, change, delete, or reassign a guessed purchase',async()=>{
 assert.deepEqual((await friend.request('/api/bonds/purchases')).data.purchases,[]);
 assert.equal((await friend.request(`/api/bonds/purchases/${ownerPurchase.id}`)).status,404);
 assert.equal((await friend.request(`/api/bonds/purchases/${ownerPurchase.id}`,'PUT',purchase)).status,404);
 assert.equal((await friend.request(`/api/bonds/purchases/${ownerPurchase.id}`,'DELETE')).status,404);
 const created=await friend.request('/api/bonds/purchases','POST',{...purchase,userId:'owner',owner_id:'owner'});assert.equal(created.status,201);friendPurchase=created.data.purchase;
 assert.equal((await owner.request(`/api/bonds/purchases/${friendPurchase.id}`)).status,404);
 const changed=await friend.request(`/api/bonds/purchases/${friendPurchase.id}`,'PUT',{...purchase,faceValue:200000,owner_id:'owner'});assert.equal(changed.status,200);
 assert.equal((await owner.request(`/api/bonds/purchases/${friendPurchase.id}`)).status,404);
 assert.deepEqual((await owner.request('/api/bonds/purchases')).data.purchases.map(p=>p.id),[ownerPurchase.id]);
 assert.deepEqual((await friend.request('/api/bonds/purchases')).data.purchases.map(p=>p.id),[friendPurchase.id]);
});
test('owner documents and equities are not exposed to registered friends',async()=>{
 assert.deepEqual((await friend.request('/api/bonds/documents')).data.documents,[]);
 assert.deepEqual((await friend.request('/api/bonds/equities')).data.holdings,[]);
 const privateId=JSON.parse(readFileSync('private/bonds/bond-documents.json','utf8'))[0].id;
 assert.equal((await friend.request(`/api/bonds/documents/${privateId}`)).status,404);
 assert.ok((await owner.request('/api/bonds/documents')).data.documents.length>0);
});
test('invitation cancellation and simultaneous redemption cannot create unwanted accounts',async()=>{
 const cancelled=(await owner.request('/api/bonds/auth/registration','POST',{email:'cancelled@example.test'})).data.invite;
 assert.equal((await owner.request('/api/bonds/auth/registration','DELETE')).status,200);
 assert.equal((await anon.request('/api/bonds/auth/register','POST',{email:'cancelled@example.test',password:'a secure test password 2026',invite:cancelled})).status,403);
 const race=(await owner.request('/api/bonds/auth/registration','POST',{email:'race@example.test'})).data.invite;
 const results=await Promise.all([client(),client()].map(c=>c.request('/api/bonds/auth/register','POST',{email:'race@example.test',password:'a secure test password 2026',invite:race})));
 assert.deepEqual(results.map(r=>r.status).sort(),[201,403]);
});
test('cross-origin mutations and malformed credentials are rejected without server errors',async()=>{
 assert.equal((await friend.request('/api/bonds/purchases','POST',purchase,{origin:'https://evil.example.test','x-forwarded-host':'evil.example.test'})).status,403);
 assert.equal((await anon.request('/api/bonds/auth/login','POST',{email:{bad:true},password:['bad']})).status,401);
 const forged=client();forged.cookie='bonds_session_v2='+ 'x'.repeat(43);assert.equal((await forged.request('/api/bonds/purchases')).status,401);
 for(let i=0;i<7;i++)assert.equal((await anon.request('/api/bonds/auth/login','POST',{email:'attack@example.test',password:'wrong password'})).status,401);
});
test('logout revokes copied session cookies and friend can sign in again independently',async()=>{
 const old=client();old.cookie=friend.cookie;
 assert.equal((await friend.request('/api/bonds/auth/logout','POST')).status,200);
 assert.equal((await old.request('/api/bonds/purchases')).status,401);
 assert.equal((await friend.request('/api/bonds/auth/login','POST',{email:'friend@example.test',password:'friend secure password for tests'})).status,200);
 assert.deepEqual((await friend.request('/api/bonds/purchases')).data.purchases.map(p=>p.id),[friendPurchase.id]);
 assert.equal((await friend.request(`/api/bonds/purchases/${friendPurchase.id}`,'DELETE')).status,200);
 assert.equal((await owner.request(`/api/bonds/purchases/${ownerPurchase.id}`,'DELETE')).status,200);
});
test('a private link creates an independent account with a chosen email and persistent purchases',async()=>{
 const issue=await owner.request('/api/bonds/auth/registration','POST',{});assert.equal(issue.status,201);
 const newFriend=client();
 const email='gorki-invited@example.test',password='gorki disposable invitation test password';
 const created=await newFriend.request('/api/bonds/auth/register','POST',{email,password,invite:issue.data.invite,isOwner:true});
 assert.equal(created.status,201);assert.equal(created.data.user.isOwner,false);
 assert.deepEqual((await newFriend.request('/api/bonds/purchases')).data.purchases,[]);
 const saved=await newFriend.request('/api/bonds/purchases','POST',purchase);assert.equal(saved.status,201);
 assert.equal((await owner.request(`/api/bonds/purchases/${saved.data.purchase.id}`)).status,404);
 assert.equal((await newFriend.request('/api/bonds/auth/logout','POST')).status,200);
 assert.equal((await newFriend.request('/api/bonds/auth/login','POST',{email,password})).status,200);
 assert.deepEqual((await newFriend.request('/api/bonds/purchases')).data.purchases.map(row=>row.id),[saved.data.purchase.id]);
 assert.equal((await anon.request('/api/bonds/auth/register','POST',{email:'reused-invitation@example.test',password,invite:issue.data.invite})).status,403);
 assert.equal((await newFriend.request(`/api/bonds/purchases/${saved.data.purchase.id}`,'DELETE')).status,200);
});
test('owner can remove a test account while member account administration stays forbidden',async()=>{
 const issue=await owner.request('/api/bonds/auth/registration','POST',{});
 const disposable=client(),email='delete-me@example.test',password='disposable account deletion test password';
 const created=await disposable.request('/api/bonds/auth/register','POST',{email,password,invite:issue.data.invite});
 assert.equal(created.status,201);
 const id=created.data.user.id;
 const saved=await disposable.request('/api/bonds/purchases','POST',purchase);assert.equal(saved.status,201);
 assert.equal((await disposable.request('/api/bonds/auth/accounts')).status,403);
 assert.equal((await disposable.request(`/api/bonds/auth/accounts/${id}`,'DELETE',{email})).status,403);
 const listed=await owner.request('/api/bonds/auth/accounts');assert.equal(listed.status,200);
 assert.ok(listed.data.accounts.some(account=>account.id===id&&account.email===email&&account.deletable));
 const summary=listed.data.accounts.find(account=>account.id===id).portfolio;
 assert.equal(summary.purchaseCount,1);assert.deepEqual(summary.principalByCurrency,[{currency:'RWF',amount:1000000}]);
 assert.equal(summary.latestPurchase.bondName,purchase.bondName);assert.equal(summary.latestPurchase.isin,purchase.isin);assert.equal(summary.latestPurchase.purchaseDate,purchase.purchaseDate);
 assert.equal(JSON.stringify(listed.data).includes('passwordHash'),false);
 assert.equal((await owner.request('/api/bonds/auth/accounts/owner','DELETE',{email:'owner@example.test'})).status,403);
 assert.equal((await owner.request(`/api/bonds/auth/accounts/${id}`,'DELETE',{email:'wrong@example.test'})).status,404);
 assert.equal((await disposable.request(`/api/bonds/purchases/${saved.data.purchase.id}`)).status,200);
 assert.equal((await owner.request(`/api/bonds/auth/accounts/${id}`,'DELETE',{email})).status,200);
 assert.equal((await disposable.request('/api/bonds/purchases')).status,401);
 assert.equal((await disposable.request('/api/bonds/auth/login','POST',{email,password})).status,401);
 assert.ok(!(await owner.request('/api/bonds/auth/accounts')).data.accounts.some(account=>account.id===id));
 assert.equal((await friend.request('/api/bonds/purchases')).status,200);
});
