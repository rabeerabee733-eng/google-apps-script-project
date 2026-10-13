const assert=require('assert/strict');
const {c,init,body,getRow,sheets,token,id,Sheet}=require('./customer-edit.test.cjs');
const properties={};c.PropertiesService={getScriptProperties:()=>({getProperty:k=>properties[k]||null,setProperty:(k,v)=>properties[k]=v})};
c.adminAuth_=()=>({ok:true,email:'admin@test'});c.portalContext_=null;
const normalAuth=c.requireAdmin_;
function edits(){let v=c.customerEditLoad(token),p=body(v);p.name+=' محدث';return c.customerEditSave(p);}
function pdf(extra={}){const row=c.adminStickerOrders({from:51,to:51,anchor:JSON.stringify(c.adminStickerSettings()),includeExported:true}).rows[0];return {ids:[id],batch:'workflow_batch',from:51,to:51,anchor:JSON.stringify(c.adminStickerSettings()),revisions:{[id]:row.stickerRevision},downloadId:'download_12345678',...extra};}
init();edits();let d=c.adminWorkflowReviews({}),r=d.rows[0];assert.equal(d.pending,1);assert.equal(r.before.name,'عميل تجريبي');assert.equal(r.after.name,'عميل تجريبي محدث');assert(!JSON.stringify(d).includes('PRIVATE'));assert.throws(()=>c.adminRecordStickerExport(pdf()),/راجع تعديلات/);
const previous=r;edits();assert.equal(c.adminWorkflowReviews({}).pending,2);c.adminWorkflowResolve({id:r.id,kind:'review',version:r.version});assert.equal(c.adminWorkflowReviews({}).pending,1);assert.throws(()=>c.adminWorkflowResolve({id:previous.id,kind:'review',version:previous.version}),/تغير السجل/);assert.throws(()=>c.adminRecordStickerExport(pdf()),/راجع تعديلات/);
r=c.adminWorkflowReviews({}).rows[0];c.adminWorkflowResolve({id:r.id,kind:'review',version:r.version});assert.equal(c.adminWorkflowReviews({}).pending,0);
const payload=pdf();c.adminRecordStickerExport(payload);assert(c.customerEditLoad(token).locked);assert.equal(c.opsRead_(c.WORKFLOW_DOWNLOAD_SHEET_,7).length,1);
c.adminRecordStickerExport(payload);assert.equal(c.opsRead_(c.WORKFLOW_DOWNLOAD_SHEET_,7).length,1,'network retry must be idempotent');
assert.throws(()=>c.adminRecordStickerExport({...payload,downloadId:'download_second_123'}),/سبب إعادة/);assert.equal(c.opsRead_(c.WORKFLOW_DOWNLOAD_SHEET_,7).length,1);
c.adminRecordStickerExport({...payload,downloadId:'download_second_123',reprintReason:'تلف ورقة الستكر'});assert.equal(c.opsRead_(c.WORKFLOW_DOWNLOAD_SHEET_,7).length,2);assert.equal(c.adminStickerExportSummary().ordersCount,1);assert.equal(c.stickerExportLedger_().length,1,'same batch re-download does not create a new dispatch');assert.equal(c.opsRead_(c.WORKFLOW_DOWNLOAD_SHEET_,7)[1][3],'تلف ورقة الستكر');
// Locked customer may only create a correction request; no order mutation, no private fields.
const orderBefore=JSON.stringify(getRow());const correction={token,id:'correction_1234567890abcdef',text:'يرجى تصحيح عنوان التوصيل'};
let v=c.customerCorrectionSubmit(correction);assert(v.locked);assert.equal(v.tracking.corrections.length,1);assert.equal(JSON.stringify(getRow()),orderBefore);assert(!JSON.stringify(v).includes('PRIVATE'));c.customerCorrectionSubmit(correction);assert.equal(c.workflowCorrections_().length,1);
assert.throws(()=>c.customerCorrectionSubmit({...correction,id:'correction_second_1234567890'}),/قيد المراجعة/);assert.throws(()=>c.customerCorrectionSubmit({...correction,token:'c'.repeat(64)}),/رابط/);
r=c.adminWorkflowReviews({}).rows.find(r=>r.kind==='correction');c.adminWorkflowResolve({kind:'correction',id:r.id,version:r.version,status:'تعذر التنفيذ',response:'تم تجهيز الطلب؛ سنتواصل لتنسيق التصحيح.'});v=c.customerEditLoad(token);assert(v.tracking.corrections[0].response.includes('سنتواصل'));assert(v.locked);assert.equal(JSON.stringify(getRow()),orderBefore);assert.throws(()=>c.adminWorkflowResolve({kind:'correction',id:r.id,version:r.version,status:'تمت المعالجة',response:'رد آخر'}),/تغير/);
init();assert.throws(()=>c.customerCorrectionSubmit(correction),/متاح الآن/);
// Reviews and corrections require orders permissions, even when called outside router.
c.requireAdmin_=()=>({permissions:['ajyalRead'],native:false});for(const fn of [()=>c.adminWorkflowReviews({}),()=>c.adminWorkflowResolve({}),()=>c.adminPrepManifest('anything')])assert.throws(fn,/صلاحية/);
// Ajyal-only alerts must not touch the orders spreadsheet at all.
const oldOrders=c.adminOrdersSheet_;c.adminOrdersSheet_=()=>{throw Error('order access forbidden');};sheets[c.AJYAL_SHEET].rows[1][7]='2020-01-01T00:00:00Z';let alerts=c.adminWorkflowAlerts({});assert.equal(alerts.rows.length,1);assert.equal(alerts.rows[0].type,'ajyal');assert.equal(alerts.counts.prep,0);assert(!JSON.stringify(alerts).includes('PRIVATE'));c.adminOrdersSheet_=oldOrders;
c.requireAdmin_=normalAuth;c.adminWorkflowSettings({...c.workflowSettings_(),version:alerts.version,prepHours:24,courierHours:48,ajyalHours:36});assert.equal(c.workflowSettings_().prepHours,24);assert.throws(()=>c.adminWorkflowSettings({...c.workflowSettings_(),version:alerts.version}),/تغيرت/);assert.throws(()=>c.adminWorkflowSettings({prepHours:0,courierHours:24,ajyalHours:24}),/مدة/);
// Invalid display-style dates are not guessed as US dates; native/ISO dates are counted.
getRow()[1]='11/12/2020';alerts=c.adminWorkflowAlerts({type:'prep'});assert.equal(alerts.rows.length,0);assert.equal(alerts.unknown,1);getRow()[1]='2020-12-11';alerts=c.adminWorkflowAlerts({type:'prep'});assert.equal(alerts.rows.length,1);assert.equal(alerts.rows[0].orderNumber,'51');
// Customer-tracking status must never regress a completed delivery because packing is present.
c.portalStickerMeta_=()=>({[id]:{status:'تم التسليم'}});c.opsPacks_=()=>({[id]:{packedAt:'2020-01-01',itemsRevision:c.opsItemRevision_(getRow())}});assert.equal(c.workflowPublicTracking_(getRow(),[]).status,'تم التسليم');
console.log('PASS: full customer diffs, per-edit review race, locked correction isolation/idempotence, public response privacy, required audited reprints/network retries, same-batch totals, scoped alerts, invalid date handling, settings versions and terminal delivery state.');
