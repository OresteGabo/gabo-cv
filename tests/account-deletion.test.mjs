import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import makeLoader from './helpers/load-ts.mjs';
const {NextRequest} = createRequire(import.meta.url)('next/server');
const id='11111111-1111-4111-8111-111111111111';
function scenario() {
 const state={session:{userId:id,email:'invited@example.test',isOwner:false},account:{id,email:'invited@example.test',passwordHash:'synthetic-hash'},friend:null,fileMode:false,limited:false,removed:[],fail:false,found:true};
 const {DELETE}=makeLoader({
  '@/lib/bonds/auth':{getBondSession:async()=>state.session,expiredSessionCookie:{name:'bonds_session_v2',value:'',httpOnly:true,path:'/',maxAge:0}},
  '@/lib/bonds/auth-store':{accountById:async requested=>{assert.equal(requested,id);return state.account},consumeAttempt:async()=>state.limited,deleteAccount:async(...args)=>{if(state.fail)throw Error('private database detail');state.removed.push(args);return state.found}},
  './auth-store':{consumeAttempt:async()=>state.limited},
  './auth-crypto':{tokenHash:s=>`hash:${s}`},
  '@/lib/bonds/auth-crypto':{verifyPasswordHash:async(password,hash)=>password==='correct password'&&hash==='synthetic-hash',tokenHash:s=>`hash:${s}`},
  '@/lib/bonds/friend-account':{configuredFriend:()=>state.friend},
  '@/lib/bonds/auth-mode':{fileOwnerMode:()=>state.fileMode},
 })('app/api/bonds/auth/account/route.ts');
 return {state,async request(body={password:'correct password'},origin='https://app.example.test') {
  const response=await DELETE(new NextRequest('https://app.example.test/api/bonds/auth/account',{method:'DELETE',headers:{host:'app.example.test',origin,'content-type':'application/json'},body:JSON.stringify(body)}));
  return {status:response.status,data:await response.json(),headers:response.headers};
 }};
}
test('only the signed-in invited account is deleted, ignoring supplied victim identity',async()=>{
 const s=scenario();const r=await s.request({password:'correct password',userId:'other-user',email:'other@example.test'});
 assert.equal(r.status,200);assert.equal(r.data.deleted,true);assert.deepEqual(s.state.removed,[[id,'invited@example.test']]);
 assert.match(r.headers.get('set-cookie'),/Max-Age=0/i);assert.match(r.headers.get('cache-control'),/private, no-store/);
});
test('anonymous and cross-origin callers cannot delete anything',async()=>{
 const s=scenario();assert.equal((await s.request(undefined,'https://evil.example.test')).status,403);
 s.state.session=null;assert.equal((await s.request()).status,401);assert.deepEqual(s.state.removed,[]);
});
test('owner, environment friend and file deployments stay protected',async()=>{
 for(const type of ['owner','friend','file']) {const s=scenario();
  if(type==='owner')s.state.session.isOwner=true;
  if(type==='friend')s.state.friend={id};
  if(type==='file')s.state.fileMode=true;
  assert.equal((await s.request()).status,403);assert.deepEqual(s.state.removed,[]);
 }
});
test('incorrect, missing and oversized passwords never delete or expire the session',async()=>{
 for(const password of ['wrong','',undefined,'x'.repeat(129)]) {const s=scenario();const r=await s.request({password});
  assert.equal(r.status,403);assert.deepEqual(s.state.removed,[]);assert.equal(r.headers.get('set-cookie'),null);
 }
});
test('rate limits, changed accounts and failed removals do not report success',async()=>{
 const limited=scenario();limited.state.limited=true;assert.equal((await limited.request()).status,429);
 const changed=scenario();changed.state.account.email='other@example.test';assert.equal((await changed.request()).status,401);assert.deepEqual(changed.state.removed,[]);
 const missing=scenario();missing.state.found=false;assert.equal((await missing.request()).status,409);
 const failed=scenario();failed.state.fail=true;const r=await failed.request();assert.equal(r.status,503);assert.doesNotMatch(JSON.stringify(r.data),/private database/);
});
test('database deletion removes purchases, shares, sessions and email-bound invitation atomically',async()=>{
 const statements=[];
 const sql=async(parts,...values)=>{statements.push({text:parts.join('?'),values});return [{id}]};
 const {deleteAccount}=makeLoader({'@neondatabase/serverless':{neon:()=>sql},'./database-config':{bondsDatabaseUrl:()=> 'synthetic-database'}})('lib/bonds/auth-store.ts');
 assert.equal(await deleteAccount(id,'invited@example.test'),true);assert.equal(statements.length,1);
 for(const table of ['bond_users','bond_purchases','equity_purchases','bond_sessions','bond_registration'])assert.match(statements[0].text,new RegExp(`DELETE FROM ${table}`));
 assert.ok(statements[0].values.includes(id));assert.ok(statements[0].values.includes('invited@example.test'));
 assert.match(statements[0].text,/owner_id IN \(SELECT id FROM removed\)/);
 assert.equal(await deleteAccount('owner','owner@example.test'),false);assert.equal(statements.length,1);
});

test('local invited-account purge removes its files and sessions while preserving another account',async()=>{
 const other='22222222-2222-4222-8222-222222222222';
 const expiresAt=Date.now()+60000;
 let data={users:[{id,email:'invited@example.test',passwordHash:'test'},{id:other,email:'other@example.test',passwordHash:'test'}],
  sessions:[{tokenHash:'a',userId:id,expiresAt},{tokenHash:'b',userId:other,expiresAt}],
  invitation:{email:'invited@example.test',tokenHash:'invite',used:false,expiresAt},attempts:{}};
 const files=new Set([id+'.json',id+'-equities.json',other+'.json',other+'-equities.json']);
 let written;
 const fakeFs={readFile:async()=>JSON.stringify(data),mkdir:async()=>{},writeFile:async(_path,content)=>{written=content},rename:async()=>{data=JSON.parse(written)},rm:async path=>{files.delete(path.split('/').pop())}};
 const store=makeLoader({'node:fs/promises':fakeFs,'./database-config':{bondsDatabaseUrl:()=>null}})('lib/bonds/auth-store.ts');
 assert.equal(await store.deleteAccount(id,'wrong@example.test'),false);
 assert.equal(await store.deleteAccount(id,'invited@example.test'),true);
 assert.equal(await store.accountById(id),null);assert.equal((await store.accountById(other)).id,other);
 assert.equal(await store.findSession('a'),null);assert.equal((await store.findSession('b')).userId,other);
 assert.equal(await store.activeInvitation(),null);
 assert.deepEqual([...files].sort(),[other+'-equities.json',other+'.json'].sort());
});
