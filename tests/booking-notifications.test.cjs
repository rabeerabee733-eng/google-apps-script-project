const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHash}=require('node:crypto'),path=require('node:path');
// Load the real booking backend: canonicalPhone_ returns nine digits, without a trunk zero.
const production=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../الرمز.js'),'utf8'),production);
function gsFixture(){let locked=false;const props={};class Sheet{constructor(rows=[]){this.rows=rows;}getLastRow(){return this.rows.length;}setFrozenRows(){}getRange(r,c,h=1,w=1){const self=this;return {getDisplayValues(){return Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(self.rows[r+i-1]?.[c+j-1]??'')));},getDisplayValue(){return this.getDisplayValues()[0][0];},setNumberFormat(){return this;},setValue(x){return this.setValues([[x]]);},setValues(values){assert(locked);values.forEach((a,i)=>{self.rows[r+i-1]||=[];a.forEach((v,j)=>self.rows[r+i-1][c+j-1]=v);});return this;}};}}
 const row=(id,num=8)=>[String(num),'date','اسم الحجز','0790000000','','عمان','لواء','عنوان',1,0,0,10,2,12,'بطاقات الأعداد × 1','',id];const sheets={orders:new Sheet([Array(17).fill('header'),row('old')]),links:new Sheet([Array(4).fill('header')])},ss={getSheetByName:n=>sheets[n],insertSheet:n=>sheets[n]=new Sheet()};const hash=s=>createHash('sha256').update(s).digest('base64url');const c={SHEET_ID:'test',CUSTOMER_EDIT_URL_:'https://example.com/edit',SpreadsheetApp:{openById:()=>ss},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},LockService:{getScriptLock:()=>({waitLock(){assert(!locked);locked=true;},releaseLock(){locked=false;}})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(algorithm,s)=>[...createHash(algorithm).update(s).digest()],getUuid:()=> 'a'.repeat(32)},portalDigest_:hash,adminOrdersSheet_:()=>sheets.orders,canonicalPhone_:production.canonicalPhone_,numberFromDisplay_:production.numberFromDisplay_,customerEditState_:()=>({locked:false,status:'جديد'}),customerEditSheet_:()=>sheets.links,customerEditFind_:(s,col,value)=>s.rows.findIndex(r=>r[col-1]===value)+1,customerEditStoreToken_:(id,token)=>{sheets.links.rows.push([id,hash(token)]);},waFail_:code=>({ok:false,code})};vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../BookingNotifications.gs'),'utf8'),c);return {c,sheets,row,hash,call:(op,d={})=>c.bookingNotifications_(op,d),queue:d=>{locked=true;try{c.bookingNoticeQueue_(d);}finally{locked=false;}}};}
test('initialization baselines historical rows and later new rows are queued once',()=>{const f=gsFixture();assert.equal(f.call('booking_notifications').events.length,0);f.sheets.orders.rows.push(f.row('new',9));const r=f.call('booking_notifications');assert.equal(r.events.length,1);assert.match(r.events[0].id,/^booking_[a-f0-9]{64}$/);assert.equal(r.events[0].targetRequestId,'new');assert.equal(r.events[0].sender,'962790000000');f.call('booking_notifications_ack',{ids:[r.events[0].id]});assert.equal(f.call('booking_notifications').events.length,0);assert.equal(f.sheets['إشعارات الحجوزات'].rows.length,3);});
test('save hook preserves new pending rows on first initialization and keeps original form edit token',()=>{const f=gsFixture(),token='b'.repeat(64);f.sheets.orders.rows.push(f.row('new',9));f.sheets.links.rows.push(['new',f.hash(token)]);f.queue({requestId:'new',customerEditToken:token});f.queue({requestId:'new',customerEditToken:token});const e=f.call('booking_notifications').events[0];const d=f.call('booking_notification_details',e);assert.equal(d.editUrl,'https://example.com/edit#token='+token);assert.equal(f.sheets.links.rows.length,2);assert.equal(f.call('booking_notification_details',{...e,sender:'962780000000'}).code,'NOT_FOUND');f.sheets.orders.rows[2][0]='10';assert.equal(f.call('booking_notification_details',e).orderNumber,'10');});
test('sheet details revalidate phone, unique request and current amounts',()=>{const f=gsFixture();f.call('booking_notifications');f.sheets.orders.rows.push(f.row('new',9));const e=f.call('booking_notifications').events[0];f.sheets.orders.rows[2][13]=22;assert.equal(f.call('booking_notification_details',e).total,22);f.sheets.orders.rows[2][3]='0780000000';assert.equal(f.call('booking_notification_details',e).code,'NOT_FOUND');});


test('real booking phone formats enqueue the complete WhatsApp recipient and load details',()=>{
 for(const phone of ['0790000000','790000000','962790000000','00962790000000','+962 79 000 0000']){
  const f=gsFixture();f.call('booking_notifications');const row=f.row('phone-format');row[3]=phone;f.sheets.orders.rows.push(row);
  f.queue({requestId:'phone-format'});const e=f.call('booking_notifications').events[0];
  assert.equal(e?.sender,'962790000000',phone);
  assert.equal(f.call('booking_notification_details',e).ok,true,phone);
  f.queue({requestId:'phone-format'});assert.equal(f.call('booking_notifications').events.length,1);
 }
});
test('invalid phones are never enqueued',()=>{
 for(const phone of ['', '061234567','079000000','not-a-phone']){
  const f=gsFixture();f.call('booking_notifications');const row=f.row('invalid');row[3]=phone;f.sheets.orders.rows.push(row);f.queue({requestId:'invalid'});
  assert.equal(f.call('booking_notifications').events.length,0,phone);
 }
});
