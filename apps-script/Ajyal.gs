/* Server-only configuration: public key in Script Properties, private key held by operators. */
var AJYAL_SHEET_ = 'خدمة أجيال';
var AJYAL_STATUSES_ = ['بانتظار التواصل','تم التواصل — بانتظار الرد','جارٍ التنفيذ','مؤجل — لم يرد','مكتمل','يحتاج معالجة'];
function ajyalConfig_() {
  var p=PropertiesService.getScriptProperties();
  var key=p.getProperty('AJYAL_PUBLIC_KEY');
  return {version:'ajyal-v1',ready:!!key,publicKey:key?JSON.parse(key):null,keyId:p.getProperty('AJYAL_KEY_ID')||''};
}
function ajyalSetPublicKey(jwk) {
  requireAdmin_();
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
  var p=PropertiesService.getScriptProperties();
  if(p.getProperty('AJYAL_PUBLIC_KEY')) throw Error('المفتاح مسجل مسبقًا. تغيير المفاتيح يحتاج ترحيلًا مدروسًا للطلبات المفتوحة.');
  if(!jwk || jwk.kty!=='RSA' || jwk.d || jwk.p || jwk.q || jwk.e!=='AQAB' || typeof jwk.n!=='string' || jwk.n.length!==512) throw Error('مفتاح عام RSA-3072 غير صالح.');
  p.setProperties({AJYAL_PUBLIC_KEY:JSON.stringify({kty:'RSA',n:jwk.n,e:jwk.e,alg:'RSA-OAEP-256',ext:true}),AJYAL_KEY_ID:Utilities.getUuid()});
  return {ok:true};
  } finally { lock.releaseLock(); }
}
function ajyalSheet_() {
  var ss=SpreadsheetApp.openById(SHEET_ID),sh=ss.getSheetByName(AJYAL_SHEET_);
  if(!sh){sh=ss.insertSheet(AJYAL_SHEET_);sh.appendRow(['المهمة','معرف الحجز','رقم الحجز','المنتج','الحقيبة','المعلم','حساب أجيال','واتساب','كلمة مرور مشفرة','معرف المفتاح','الحالة','الموظف','آخر تحديث','الإنجاز','ملاحظات','الإصدار']);sh.setFrozenRows(1);}
  return sh;
}
function ajyalSafe_(s) { s=String(s||'').trim();return /^[=+@\-]/.test(s)?"'"+s:s; }
function ajyalValidate_(entries,items) {
  if(entries==null)return [];
  if(!Array.isArray(entries)||entries.length>300)throw Error('عدد خدمات أجيال غير صالح.');
  if(!entries.length)return [];
  var config=ajyalConfig_();if(!config.ready)throw Error('خدمة أجيال غير مهيأة.');
  var quantities={},used={};items.forEach(function(i){quantities[i.productId]=i.qty;});
  return entries.map(function(e){
    if(!/^grade[123]_bag$/.test(e.productId)||!Number.isInteger(e.slot)||e.slot<1||e.slot>(quantities[e.productId]||0))throw Error('خدمة أجيال تتجاوز عدد الحقائب.');
    var id=e.productId+':'+e.slot;if(used[id])throw Error('حقيبة مكررة.');used[id]=true;
    if(typeof e.name!=='string'||!e.name.trim()||e.name.length>120||typeof e.username!=='string'||!e.username.trim()||e.username.length>120||!/^07\d{8}$/.test(e.phone))throw Error('بيانات معلم غير مكتملة.');
    if(e.password||e.keyId!==config.keyId||typeof e.cipher!=='string'||!/^[A-Za-z0-9+/]{512}$/.test(e.cipher))throw Error('تشفير حساب أجيال غير صالح.');
    return {productId:e.productId,slot:e.slot,name:e.name.trim(),username:e.username.trim(),phone:e.phone,cipher:e.cipher,keyId:e.keyId};
  });
}
function ajyalInsert_(entries,requestId,orderNumber) {
  if(!entries.length)return;
  var sh=ajyalSheet_();
  // Orphan staging rows from an interrupted attempt are replaced under the booking lock.
  ajyalRemovePending_(requestId);
  var rows=entries.map(function(e){return [requestId+':'+e.productId+':'+e.slot,requestId,orderNumber,e.productId,e.slot,ajyalSafe_(e.name),ajyalSafe_(e.username),e.phone,e.cipher,e.keyId,AJYAL_STATUSES_[0],'',new Date().toISOString(),'','',1];});
  var range=sh.getRange(sh.getLastRow()+1,1,rows.length,16);range.setNumberFormat('@');range.setValues(rows);
}
function ajyalRemovePending_(requestId) {
  var sh=ajyalSheet_();if(sh.getLastRow()<2)return;
  var matches=sh.getRange(2,2,sh.getLastRow()-1,1).createTextFinder(requestId).matchEntireCell(true).findAll();
  matches.sort(function(a,b){return b.getRow()-a.getRow();}).forEach(function(r){sh.deleteRow(r.getRow());});
}
function ajyalFeeFor_(requestId){
  var sh=SpreadsheetApp.openById(SHEET_ID).getSheetByName(AJYAL_SHEET_);
  if(!sh||sh.getLastRow()<2)return 0;
  return 3*sh.getRange(2,2,sh.getLastRow()-1,1).createTextFinder(requestId).matchEntireCell(true).findAll().length;
}
function ajyalServe_(){
  requireAdmin_();return HtmlService.createTemplateFromFile('AjyalAdmin').evaluate().setTitle('إدارة خدمة أجيال').addMetaTag('viewport','width=device-width,initial-scale=1');
}
function ajyalBootstrap(){return {email:requireAdmin_().email,config:ajyalConfig_(),statuses:AJYAL_STATUSES_};}
function ajyalList(filters){
  requireAdmin_();filters=filters||{};var sh=ajyalSheet_(),data=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,16).getDisplayValues():[];
  var orders=adminOrdersSheet_();var valid={};if(orders.getLastRow()>1)orders.getRange(2,17,orders.getLastRow()-1,1).getDisplayValues().forEach(function(r){valid[r[0]]=true;});
  var rows=data.filter(function(r){return valid[r[1]];}).map(function(r){return {id:r[0],requestId:r[1],orderNumber:Number(r[2]),productId:r[3],slot:Number(r[4]),name:r[5],username:r[6],phone:r[7],status:r[10],operator:r[11],updated:r[12],completed:r[13],notes:r[14],revision:Number(r[15])};});
  var total=rows.length,completed=rows.filter(function(r){return r.status==='مكتمل';}).length;
  var q=String(filters.q||'').trim().toLowerCase();
  rows=rows.filter(function(r){return (!filters.status||r.status===filters.status)&&(!filters.grade||r.productId==='grade'+filters.grade+'_bag')&&(!q||[r.name,r.username,r.phone,r.orderNumber].join(' ').toLowerCase().indexOf(q)!==-1);});
  rows.sort(function(a,b){return a.orderNumber-b.orderNumber||a.productId.localeCompare(b.productId)||a.slot-b.slot;});
  if(filters.customers){var map=Object.create(null);rows.forEach(function(r){var k=r.username; if(!map[k])map[k]={name:r.name,username:r.username,phone:r.phone,orders:[],services:0};map[k].services++;if(map[k].orders.indexOf(r.orderNumber)<0)map[k].orders.push(r.orderNumber);});rows=Object.keys(map).map(function(k){return map[k];});}
  var count=rows.length,page=Math.max(0,Math.min(Math.max(0,Math.ceil(count/50)-1),Math.floor(Number(filters.page)||0)));
  return {rows:rows.slice(page*50,page*50+50),count:count,total:total,completed:completed,page:page};
}
function ajyalFind_(id){var sh=ajyalSheet_();if(sh.getLastRow()<2)throw Error('المهمة غير موجودة.');var found=sh.getRange(2,1,sh.getLastRow()-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext();if(!found)throw Error('المهمة غير موجودة.');return {sheet:sh,row:found.getRow(),data:sh.getRange(found.getRow(),1,1,16).getDisplayValues()[0]};}
function ajyalUpdate(payload){
  var auth=requireAdmin_(),lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var found=ajyalFind_(payload.id),r=found.data;
    if(Number(r[15])!==Number(payload.revision))throw Error('تغيّرت المهمة؛ حدّث القائمة.');
    if(!findResultByRequestId_(adminOrdersSheet_(),r[1]))throw Error('الحجز غير موجود.');
    if(r[11]&&r[11]!==auth.email&&r[10]==='جارٍ التنفيذ')throw Error('المهمة يعمل عليها موظف آخر.');
    if(r[10]==='مكتمل')throw Error('المهمة مكتملة وقد حذفت كلمة المرور.');
    if(AJYAL_STATUSES_.indexOf(payload.status)<0)throw Error('حالة غير صالحة.');
    if(payload.status==='مكتمل'&&payload.verified!==true)throw Error('أكد التحقق من رفع الخطة والتحليل لكل مادة.');
    r[10]=payload.status;r[11]=auth.email;r[12]=new Date().toISOString();r[14]=ajyalSafe_(String(payload.notes||'').slice(0,1000));r[15]=Number(r[15])+1;
    if(payload.status==='مكتمل'){r[8]='';r[13]=r[12];}
    found.sheet.getRange(found.row,1,1,16).setValues([r]);return {ok:true};
  }finally{lock.releaseLock();}
}
function ajyalSecret(id){
  var auth=requireAdmin_(),f=ajyalFind_(id),r=f.data;
  if(r[10]!=='جارٍ التنفيذ'||r[11]!==auth.email)throw Error('ابدأ تنفيذ المهمة أولًا.');
  if(!findResultByRequestId_(adminOrdersSheet_(),r[1]))throw Error('الحجز غير موجود.');
  return {cipher:r[8],keyId:r[9]};
}
