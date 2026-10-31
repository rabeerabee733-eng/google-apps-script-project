const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const c=vm.createContext({console,Utilities:{formatDate:()=>''}});
 for(const f of ['الرمز.js','PortalAuth.gs','Operations.gs','Barcode.gs','CustomerEdit.gs','Workflow.gs','Finance.gs'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
 const order=Array(17).fill('');order[0]='1';order[16]='test-order';let writes=0,permissions=['ordersRead','ordersEdit'],values=['test-order','1','جديد','غير مدفوع',0,'عادي','','','',''];
 c.portalIdentity_=()=>({native:false,employee:'test',email:'test',permissions});c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};
 c.adminOrdersSheet_=()=>({getRange:()=>({getDisplayValues:()=>[order],setValues(){writes++;}})});c.adminFindRowByRequestId_=()=>2;c.adminEnsureSupportSheets_=()=>{};c.adminFindMetaRow_=()=>2;c.adminLog_=()=>{};
 c.SpreadsheetApp={openById:()=>({getSpreadsheetTimeZone:()=> 'Asia/Amman',getSheetByName:()=>({getRange:()=>({getValues:()=>[values],setValues:x=>{writes++;values=x[0];}})})})};
 return {c,writes:()=>writes,paid:()=>values[4],allow:()=>permissions.push('payments')};
}
test('all order-edit RPCs deny financial changes before writing any order or payment data',()=>{
 for(const patch of [{amountPaid:9},{paymentStatus:'مدفوع'}])for(const method of ['adminSetOrderMeta','adminUpdateOrder','adminCreateOrder']){
  const f=fixture(),args=method==='adminSetOrderMeta'?['test-order',patch]:[{requestId:'test-order',...patch}];
  assert.throws(()=>f.c.adminPortalRpc('token',method,args),/صلاحية المدفوعات/);assert.equal(f.writes(),0);assert.equal(f.paid(),0);assert.equal(f.c.portalContext_,null);
 }
});
test('order editors can echo unchanged financial fields; payment permission allows an actual payment change',()=>{
 const f=fixture();assert(f.c.adminPortalRpc('token','adminSetOrderMeta',['test-order',{amountPaid:0,paymentStatus:'غير مدفوع',status:'جديد'}]).ok);
 f.allow();assert(f.c.adminPortalRpc('token','adminSetOrderMeta',['test-order',{amountPaid:9,paymentStatus:'مدفوع'}]).ok);assert.equal(f.paid(),9);
});
test('password hashing runs outside the shared booking lock and rechecks account revocation',()=>{
 const f=fixture(),c=f.c,cache={};let locked=false,version=1;
 c.portalAccounts_=()=>[{id:'a',username:'worker',active:true,version,salt:'salt',hash:'hash',permissions:[]}];c.portalDigest_=s=>s;
 c.CacheService={getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})};
 c.LockService={getScriptLock:()=>({waitLock(){assert(!locked);locked=true;},releaseLock(){locked=false;}})};
 c.Utilities.getUuid=()=> 'test-token';c.portalPassword_=()=>{assert.equal(locked,false);return 'hash';};
 assert(c.adminPortalLogin({username:'worker',password:'password'}).token);assert.equal(locked,false);
 c.portalPassword_=()=>{assert.equal(locked,false);version++;return 'hash';};assert.throws(()=>c.adminPortalLogin({username:'worker',password:'password'}),/تغير الحساب/);
 for(let i=0;i<5;i++)assert.throws(()=>c.adminPortalLogin({username:'missing-'+i,password:'password'}),/غير صحيحة/);
 assert.throws(()=>c.adminPortalLogin({username:'missing-another',password:'password'}),/محاولات/);assert.equal(locked,false);
});
