const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const tables={},orders=[],exported=[];
function sheet(name){tables[name]||=[];return {getLastRow:()=>tables[name].length+1,getRange(row,col){return {setNumberFormat(){return this;},setValues(values){values.forEach((v,i)=>tables[name][row-2+i]=v.slice());return this;},setValue(v){tables[name][row-2][col-1]=v;return this;}};}};}
const day=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Amman',year:'numeric',month:'2-digit',day:'2-digit'}).format(ms),tomorrow=day(Date.now()+86400000),later=day(Date.now()+2*86400000);
const c={opsRead_:n=>tables[n]||[],opsSheet_:sheet,opsPut_:(name,headers,row,key)=>{tables[name]||=[];let i=tables[name].findIndex(r=>r[0]===key);if(i<0)i=tables[name].length;tables[name][i]=row.slice();},Utilities:{formatDate:d=>day(d)},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},bookingNoticeOrderRows_:()=>orders,stickerExportLedger_:()=>exported,bookingNoticeId_:s=>'booking_'+crypto.createHash('sha256').update(s).digest('hex'),waFail_:code=>({ok:false,code})};
vm.createContext(c);const main=fs.readFileSync('الرمز.js','utf8'),start=main.indexOf('function canonicalPhone_('),end=main.indexOf('\nfunction ',start+1);vm.runInContext(main.slice(start,end),c);
c.bookingNoticeValid_=r=>/^7\d{8}$/.test(c.canonicalPhone_(r[3]));vm.runInContext(fs.readFileSync('Workflow.gs','utf8'),c);vm.runInContext(fs.readFileSync('LifecycleNotifications.gs','utf8'),c);
assert.equal(c.canonicalPhone_('0790000000'),'790000000');assert.equal(c.canonicalPhone_('+962790000000'),'790000000');
const payload={batch:'date-batch',deliveryDate:tomorrow};assert.equal(c.workflowDeliveryDate_(payload,false),tomorrow);assert.equal(tables[c.WORKFLOW_DELIVERY_DATES_],undefined,'validation and preview do not persist metadata');
c.workflowDeliveryDate_(payload,true);c.workflowDeliveryDate_(payload,true);assert.equal(tables[c.WORKFLOW_DELIVERY_DATES_].length,1);assert.throws(()=>c.workflowDeliveryDate_({...payload,deliveryDate:later},false),/محفوظ/);
for(const bad of ['2026-02-30','2000-01-01','not-a-date',day(Date.now()+91*86400000)])assert.throws(()=>c.workflowDeliveryDate_({batch:'invalid',deliveryDate:bad},false),/صحيح/);
function row(id,phone='0790000000'){const r=Array(17).fill('');r[16]=id;r[0]='12';r[2]='سارة';r[3]=phone;orders.push(r);return r;}
row('one');row('two','123');exported.push(['one','12','',new Date().toISOString(),'date-batch'],['two','13','',new Date().toISOString(),'date-batch']);
c.lifecycleQueueStickerDownloads_(payload,[{key:'one'},{key:'two'}]);const out=tables[c.LIFECYCLE_OUTBOX_];assert.equal(out[0][2],'962790000000');assert.equal(out[1][5],'invalid_phone');assert.equal(JSON.parse(out[0][4]).deliveryDate,tomorrow);
c.lifecycleContext_=()=>({});c.lifecycleTeachers_=()=>({});c.workflowPublicTracking_=()=>({status:'خرج للتوصيل',ajyalTotal:0});
let poll=c.lifecycleNotifications_('lifecycle_poll',{});assert.equal(poll.issues.length,1);assert.equal(poll.events[0].batch,'date-batch');assert.equal(c.lifecycleNotifications_('lifecycle_details',poll.events[0]).deliveryDate,tomorrow);
out[0][2]='96290000000';poll=c.lifecycleNotifications_('lifecycle_poll',{});assert.equal(out[0][2],'962790000000','known pending legacy truncation repaired');
c.lifecycleNotifications_('lifecycle_ack',{ids:[out[0][0]]});out[0][2]='96290000000';c.lifecycleNotifications_('lifecycle_poll',{});assert.equal(out[0][2],'96290000000','already acknowledged phone never migrated');
orders[1][3]='0780000000';poll=c.lifecycleNotifications_('lifecycle_poll',{});assert.equal(poll.issues.length,0);assert.equal(poll.events[0].sender,'962780000000');assert.equal(poll.events[0].id,out[1][0],'correcting the number preserves event identity');
console.log('PASS: production phone normalization, immutable delivery dates, no preview writes, pending-only legacy repair and invalid-number recovery.');
