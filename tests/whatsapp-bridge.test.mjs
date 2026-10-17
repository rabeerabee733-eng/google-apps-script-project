import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {createHmac} from 'node:crypto';
const source=fs.readFileSync(new URL('../WhatsAppBridge.gs',import.meta.url),'utf8');
function fixture(){
 let now=1792100000000,saved=0;const key='test-secret-'.repeat(4),id='test-sheet';
 const props={WA_BRIDGE_ENABLED:'true',WA_BRIDGE_SECRET:key,WA_BRIDGE_EXPECTED_SHEET_ID:id,WA_BRIDGE_WRITE_ENABLED:'true'};
 const ctx={Date:{now:()=>now},SHEET_ID:id,SHEET_NAME:'الطلبات',MIN_FORM_TIME_MS:1200,
  PRODUCTS:{active_learning:{name:'حقيبة التعلم النشط',price:10}},DISTRICTS:{'عمان':['لواء الجامعة']},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:t=>({setMimeType:()=>JSON.parse(t)})},
  Utilities:{Charset:{UTF_8:'utf8'},computeHmacSha256Signature:(s,k)=>[...createHmac('sha256',k).update(s).digest()]},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>({})})},
  canonicalPhone_:s=>/^07\d{8}$/.test(s)?s:'',findResultByRequestId_:()=>null,
  sanitizeItems_:items=>({ok:true,items:items.map(i=>({...i,...ctx.PRODUCTS[i.productId]}))}),
  calculateTotals_:items=>{const productsTotal=items.reduce((n,i)=>n+i.price*i.qty,0);return {productsTotal,deliveryFee:2,grandTotal:productsTotal+2};},
  saveOrder_:()=>({result:'success',orderNumber:++saved})};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const call=(op,data,sign=true)=>{const body=JSON.stringify({op,data,expectedSheetId:id}),timestamp=String(now),signature=sign?createHmac('sha256',key).update(timestamp+'\n'+body).digest('hex'):'';return ctx.waBridge_({parameter:{body,timestamp,signature}});};
 return {ctx,props,call,advance:ms=>now+=ms,count:()=>saved};
}
const order={name:'تجربة',phone:'0790000000',altPhone:'',governorate:'عمان',district:'لواء الجامعة',address:'عنوان اختبار',notes:'',items:[{productId:'active_learning',qty:2,folderQty:0,paperQty:0}]};
const req={order,requestId:'wa_'+'a'.repeat(32)};
test('Bridge rejects unsigned calls and disabled writes',()=>{const f=fixture();assert.equal(f.call('catalog',{},false).code,'UNAUTHORIZED');const q=f.call('quote',req).quote;f.advance(2000);f.props.WA_BRIDGE_WRITE_ENABLED='false';assert.equal(f.call('commit',{quote:q,confirmed:true}).code,'WRITES_DISABLED');assert.equal(f.count(),0);});
test('Tampering with quoted total cannot create an order',()=>{const f=fixture(),q=f.call('quote',req).quote;q.totals.grandTotal=1;f.advance(2000);assert.equal(f.call('commit',{quote:q,confirmed:true}).code,'INVALID_CONFIRMATION');assert.equal(f.count(),0);});
test('Changed price requires new confirmation',()=>{const f=fixture(),q=f.call('quote',req).quote;f.ctx.PRODUCTS.active_learning.price=11;f.advance(2000);assert.equal(f.call('commit',{quote:q,confirmed:true}).code,'PRICE_CHANGED');assert.equal(f.count(),0);});
test('Confirmed valid quote reaches existing save function exactly once',()=>{const f=fixture(),q=f.call('quote',req).quote;f.advance(2000);const r=f.call('commit',{quote:q,confirmed:true});assert.equal(r.orderNumber,1);assert.equal(f.count(),1);});
test('Expired quote never writes',()=>{const f=fixture(),q=f.call('quote',req).quote;f.advance(31*60000);assert.equal(f.call('commit',{quote:q,confirmed:true}).code,'QUOTE_EXPIRED');assert.equal(f.count(),0);});
test('Unexpected sheet binding rejected',()=>{const f=fixture();f.props.WA_BRIDGE_EXPECTED_SHEET_ID='different';assert.equal(f.call('catalog',{}).code,'SHEET_MISMATCH');});
test('Untrusted product IDs and spreadsheet formulas rejected',()=>{const f=fixture();assert.equal(f.call('quote',{...req,order:{...order,name:'=IMPORTXML("url")'}}).code,'BRIDGE_ERROR');assert.equal(f.call('quote',{...req,order:{...order,items:[{productId:'__proto__',qty:1}]}}).code,'BRIDGE_ERROR');assert.equal(f.count(),0);});

test('Production remains locked until explicitly enabled',()=>{const f=fixture();f.ctx.SHEET_ID='1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w';f.props.WA_BRIDGE_EXPECTED_SHEET_ID=f.ctx.SHEET_ID;const body=JSON.stringify({op:'commit',data:{confirmed:true},expectedSheetId:f.ctx.SHEET_ID}),timestamp=String(f.ctx.Date.now()),signature=createHmac('sha256',f.props.WA_BRIDGE_SECRET).update(timestamp+'\n'+body).digest('hex');assert.equal(f.ctx.waBridge_({parameter:{body,timestamp,signature}}).code,'PRODUCTION_LOCKED');assert.equal(f.count(),0);});
test('Repeated confirmed request returns the original order without a second write',()=>{const f=fixture(),q=f.call('quote',req).quote;f.advance(2000);const first=f.call('commit',{quote:q,confirmed:true});f.ctx.findResultByRequestId_=()=>first;f.advance(31*60000);const again=f.call('commit',{quote:q,confirmed:true});assert.equal(again.orderNumber,first.orderNumber);assert.equal(f.count(),1);});
test('Original doPost routes signed bridge requests before the legacy form parser',()=>{const context={waBridge_:e=>({routed:e.parameter.waBridge})};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../الرمز.js',import.meta.url),'utf8'),context);assert.equal(context.doPost({parameter:{waBridge:'1'}}).routed,'1');});
