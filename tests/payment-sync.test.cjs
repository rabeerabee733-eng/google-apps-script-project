const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function fixture(){
 const order=Array(17).fill('');Object.assign(order,{0:'1',11:'10',12:'2',13:'12',14:'حقيبة × 1',16:'order-1'});
 let values=null,writes=0,fail=false;const sheet={getMaxColumns:()=>11,getLastRow:()=>values?2:1,getRange:(r,c,h,w)=>({getValues:()=>[values.slice()],setValue(){},setValues(next){if(fail)throw Error('write failed');writes++;values=next[0].slice();}})};
 const ctx=vm.createContext({console,Date,Number,JSON,SHEET_ID:'test',ADMIN_META_SHEET_NAME:'meta',numberFromDisplay_:Number,opsRows_:()=>[order],adminEnsureSupportSheets_(){},adminFindMetaRow_:()=>values?2:0,SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},portalDigest_:s=>crypto.createHash('sha256').update(s).digest('hex'),waFail_:code=>({ok:false,code})});
 vm.runInContext(fs.readFileSync('Enterprise.gs','utf8'),ctx);
 const base={invoiceId:'invoice-1',orderId:'order-1',sequence:1,expectedPaid:0,targetPaid:0,total:12000,productsTotal:10000,deliveryFee:2000,items:order[14],actor:'manager',release:false};
 return {review:()=>ctx.businessPaymentReview_({orderId:base.orderId}),reconcile:d=>ctx.businessPaymentReconcile_({invoiceId:base.invoiceId,orderId:base.orderId,...d}),sync:d=>ctx.businessPaymentSync_({...base,...d}),order,paid:()=>values?.[4]||0,writes:()=>writes,manual:n=>{values[4]=n;},fail:v=>{fail=v;},marker:()=>JSON.parse(values[10])};
}
test('Google stores balance and sequence atomically, retries exactly, and preserves other order metadata',()=>{
 const f=fixture();assert(f.sync({}).ok);assert(f.sync({sequence:2,targetPaid:3000}).ok);assert.equal(f.paid(),3);const writes=f.writes();
 assert(f.sync({sequence:2,targetPaid:3000}).replayed);assert.equal(f.writes(),writes);
 assert.equal(f.sync({sequence:2,targetPaid:4000}).code,'SEQUENCE_CONFLICT');
 assert.equal(f.sync({sequence:4,expectedPaid:3000,targetPaid:4000}).code,'SEQUENCE_CONFLICT');
 assert(f.sync({sequence:3,expectedPaid:3000,targetPaid:1000}).ok);assert.equal(f.paid(),1);
});
test('Google refuses external payment changes, stale order values and another invoice binding',()=>{
 const f=fixture();f.sync({});f.manual(4);assert.equal(f.sync({sequence:2,targetPaid:3000}).code,'PAYMENT_CONFLICT');assert.equal(f.paid(),4);
 assert.equal(f.sync({}).code,'PAYMENT_CONFLICT');f.manual(0);assert.equal(f.sync({invoiceId:'invoice-2'}).code,'INVOICE_BINDING_CONFLICT');
 f.order[13]='15';assert.equal(f.sync({sequence:2,targetPaid:3000}).code,'ORDER_CHANGED');assert.equal(f.paid(),0);
});
test('failed Google row write is retryable and only a zero-paid released invoice can be rebound',()=>{
 const f=fixture();f.sync({});f.fail(true);assert.throws(()=>f.sync({sequence:2,targetPaid:3000}),/write failed/);assert.equal(f.paid(),0);assert.equal(f.marker().sequence,1);
 f.fail(false);assert(f.sync({sequence:2,targetPaid:3000}).ok);assert.equal(f.sync({sequence:3,expectedPaid:3000,targetPaid:3000,release:true}).code,'INVALID_SYNC');
 assert(f.sync({sequence:3,expectedPaid:3000,targetPaid:0}).ok);assert(f.sync({sequence:4,expectedPaid:0,targetPaid:0,release:true}).ok);
 assert(f.sync({invoiceId:'invoice-2'}).ok);assert.equal(f.sync({sequence:4,release:true}).code,'INVOICE_BINDING_CONFLICT');
});
test('invalid financial payloads cannot change money',()=>{
 const f=fixture();for(const d of [{targetPaid:-1},{total:1},{sequence:0},{targetPaid:12001},{actor:'x'.repeat(81)},{items:'x'.repeat(20001)}])assert.equal(f.sync(d).code,'INVALID_SYNC');
});

test('changed bookings allow zero-paid release and refunds, but never new charges',()=>{
 const f=fixture();assert(f.sync({}).ok);f.order[13]='15';assert.equal(f.sync({sequence:2,targetPaid:1000}).code,'ORDER_CHANGED');assert(f.sync({sequence:2,release:true}).ok);assert(f.sync({invoiceId:'replacement',productsTotal:10000,deliveryFee:5000,total:15000}).code==='ORDER_CHANGED');
 const g=fixture();g.sync({});g.sync({sequence:2,targetPaid:3000});g.order[14]='changed';assert(g.sync({sequence:3,expectedPaid:3000,targetPaid:0}).ok);assert(g.sync({sequence:4,release:true}).ok);
});
test('explicit zero-paid resolution is revision-checked, idempotent and preserves balances',()=>{
 const f=fixture();f.order[14]='changed before first synchronization';assert.equal(f.sync({}).code,'ORDER_CHANGED');
 const review=f.review(),data={revision:review.revision,sequence:2,operationId:'synthetic-operation-123',reason:'reviewed replacement'};
 f.order[14]='changed again';assert.equal(f.reconcile(data).code,'STALE_REVIEW');data.revision=f.review().revision;assert(f.reconcile(data).ok);const writes=f.writes();assert(f.reconcile(data).replayed);assert.equal(f.writes(),writes);assert.equal(f.paid(),0);
 assert.equal(f.reconcile({...data,reason:'changed reason'}).code,'SEQUENCE_CONFLICT');
 const other=fixture();other.sync({});let r=other.review();assert.equal(other.reconcile({...data,invoiceId:'different',revision:r.revision}).code,'INVOICE_BINDING_CONFLICT');other.manual(3);r=other.review();assert.equal(other.reconcile({...data,revision:r.revision}).code,'PAYMENT_CONFLICT');assert.equal(other.paid(),3);
});
