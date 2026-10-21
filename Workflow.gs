// Review/correction records are separate from orders; customer requests never unlock orders.
var WORKFLOW_REVIEW_SHEET_='مراجعة تعديلات العملاء';
var WORKFLOW_CORRECTION_SHEET_='طلبات تصحيح العملاء';
var WORKFLOW_DOWNLOAD_SHEET_='سجل إعادة تنزيل الستكرات';
var WORKFLOW_SETTINGS_KEY_='WORKFLOW_ALERT_SETTINGS_V1';
var WORKFLOW_REVIEW_HEADERS_=['المعرف','معرف الطلب','رقم الطلب','وقت التعديل','قبل التعديل','بعد التعديل','الحالة','راجع بواسطة','وقت المراجعة'];
var WORKFLOW_CORRECTION_HEADERS_=['المعرف','معرف الطلب','رقم الطلب','وقت الطلب','طلب العميل','الحالة','رد الإدارة للعميل','عالج بواسطة','وقت المعالجة','نسخة السجل'];
function workflowSafeSnapshot_(row,teachers){return {name:row[2],phone:row[3],altPhone:row[4],governorate:row[5],district:row[6],address:row[7],itemsText:row[14],grandTotal:row[13],teachers:(teachers||[]).filter(function(t){return t.values[5]!=='ملغي';}).map(function(t){return {name:t.values[2],phone:t.values[4],grade:t.values[9]};})};}
function workflowAddReview_(before,after,oldTeachers,newTeachers,at){
  var a=JSON.stringify(workflowSafeSnapshot_(before,oldTeachers)),b=JSON.stringify(workflowSafeSnapshot_(after,newTeachers));
  if(a===b)return null;
  if(a.length>45000||b.length>45000)throw new Error('حجم التعديل كبير. تواصل مع الإدارة.');
  var s=opsSheet_(WORKFLOW_REVIEW_SHEET_,WORKFLOW_REVIEW_HEADERS_),n=s.getLastRow()+1;
  s.getRange(n,1,1,9).setNumberFormat('@').setValues([[Utilities.getUuid(),after[16],after[0],at,a,b,'بانتظار المراجعة','','']]);
  return {sheet:s,row:n};
}
function workflowReviews_(){return opsRead_(WORKFLOW_REVIEW_SHEET_,9).map(function(r){return {id:r[0],key:r[1],orderNumber:r[2],at:r[3],before:JSON.parse(r[4]),after:JSON.parse(r[5]),status:r[6],reviewedBy:r[7],reviewedAt:r[8],version:portalDigest_(JSON.stringify(r))};});}
function workflowPending_(){var m={};workflowReviews_().forEach(function(r){if(r.status==='بانتظار المراجعة')m[r.key]=true;});return m;}
function workflowCorrections_(){return opsRead_(WORKFLOW_CORRECTION_SHEET_,10).map(function(r){return {id:r[0],key:r[1],orderNumber:r[2],at:r[3],text:r[4],status:r[5],response:r[6],by:r[7],resolvedAt:r[8],version:r[9]};});}
function adminWorkflowReviews(payload){
  orgRequire_(['ordersRead']);payload=payload||{};var offset=Math.max(0,Math.floor(Number(payload.offset)||0)),all=payload.history===true;
  var reviews=workflowReviews_(),corrections=workflowCorrections_(),pending=reviews.filter(function(r){return r.status==='بانتظار المراجعة';}).length,requests=corrections.filter(function(r){return r.status==='جديد';}).length;
  var records=reviews.map(function(r){r.kind='review';return r;}).concat(corrections.map(function(r){r.kind='correction';return r;})).filter(function(r){return all||r.status==='بانتظار المراجعة'||r.status==='جديد';}).sort(function(a,b){return b.at.localeCompare(a.at);});
  return {rows:records.slice(offset,offset+30),total:records.length,pending:pending,requests:requests,offset:offset};
}
function adminWorkflowResolve(payload){
  orgRequire_(['ordersEdit']);payload=payload||{};var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var correction=payload.kind==='correction';if(!correction&&payload.kind!=='review')throw new Error('اختر سجلًا صحيحًا.');
    var rows=correction?workflowCorrections_():workflowReviews_(),item=rows.filter(function(r){return r.id===payload.id;})[0];
    if(!item||item.version!==payload.version)throw new Error('تغير السجل. حدّث القائمة قبل المتابعة.');
    var now=new Date().toISOString(),by=opsActor_();
    if(correction){
      if(['تمت المعالجة','تعذر التنفيذ'].indexOf(payload.status)<0)throw new Error('اختر نتيجة المعالجة.');
      var response=cleanText_(payload.response,1000);if(response.length<3)throw new Error('اكتب ردًا واضحًا للعميل.');
      if(item.status!=='جديد')throw new Error('سبق إغلاق طلب التصحيح.');
      opsPut_(WORKFLOW_CORRECTION_SHEET_,WORKFLOW_CORRECTION_HEADERS_,[item.id,item.key,item.orderNumber,item.at,item.text,payload.status,ajyalCell_(response),by,now,Utilities.getUuid()],item.id);
    }else{
      if(item.status!=='بانتظار المراجعة')return {ok:true};
      opsPut_(WORKFLOW_REVIEW_SHEET_,WORKFLOW_REVIEW_HEADERS_,[item.id,item.key,item.orderNumber,item.at,JSON.stringify(item.before),JSON.stringify(item.after),'تمت المراجعة',by,now],item.id);
    }
    return {ok:true};
  }finally{lock.releaseLock();}
}
function workflowPublicTracking_(row,teachers,context){
  context=context||{meta:portalStickerMeta_(),packs:opsPacks_(),tracking:courierTracking_(),snapshots:courierSnapshots_()};
  var key=stickerExportKey_(row),meta=context.meta[String(row[16])]||{},p=context.packs[key],tracking=context.tracking[key]||{},h=context.lastSnapshot?context.lastSnapshot[key]:context.snapshots.filter(function(x){return x.key===key;}).pop(),status=meta.status||'جديد';
  if(status!=='ملغي'){
    if(tracking.status)status=tracking.status==='لدى الشركة'?'خرج للتوصيل':tracking.status;
    else if(status!=='تم التسليم'&&(h||p&&p.handedAt))status='خرج للتوصيل';
    else if(p&&['جديد','قيد التجهيز','جاهز'].indexOf(status)!==-1)status=p.packedAt&&p.itemsRevision===opsItemRevision_(row)?'جاهز':'قيد التجهيز';
  }
  var active=(teachers||[]).filter(function(t){return t.values[5]!=='ملغي';});
  return {status:status,company:h&&h.company||'',ajyalTotal:active.length,ajyalCompleted:active.filter(function(t){return t.values[5]==='مكتمل';}).length,corrections:(context.corrections||workflowCorrections_()).filter(function(r){return r.key===String(row[16]);}).slice(-5).reverse().map(function(r){return {at:r.at,text:r.text,status:r.status,response:r.response,resolvedAt:r.resolvedAt};})};
}
function customerCorrectionSubmit(payload){
  payload=payload||{};var text=String(payload.text||'').trim(),id=String(payload.id||'');
  if(text.length<5||text.length>1000||!/^correction_[a-zA-Z0-9_-]{16,80}$/.test(id))throw new Error('اكتب طلب التصحيح من 5 إلى 1000 حرف.');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var access=customerEditAccess_(payload.token),r=access.values;if(!customerEditState_(r).locked)throw new Error('التعديل متاح الآن من نموذج طلبك.');
    var own=workflowCorrections_().filter(function(x){return x.key===String(r[16]);}),same=own.filter(function(x){return x.id===id;})[0];
    if(same){if(same.text!==text)throw new Error('حدّث الصفحة قبل إرسال طلب آخر.');return customerEditView_(access);}
    if(own.some(function(x){return x.status==='جديد';}))throw new Error('لديك طلب تصحيح قيد المراجعة. انتظر رد الإدارة هنا.');
    if(own.filter(function(x){return Date.now()-Date.parse(x.at)<86400000;}).length>=3)throw new Error('تم بلوغ حد طلبات التصحيح اليومية. تواصل معنا للمساعدة.');
    opsPut_(WORKFLOW_CORRECTION_SHEET_,WORKFLOW_CORRECTION_HEADERS_,[id,r[16],r[0],new Date().toISOString(),ajyalCell_(text),'جديد','','','',Utilities.getUuid()],id);
    return customerEditView_(access);
  }finally{lock.releaseLock();}
}
function workflowExportCheck_(payload,chosen,seen,sameBatch){
  var pending=workflowPending_(),unreviewed=chosen.filter(function(r){return pending[r.key];});
  if(unreviewed.length)throw new Error('راجع تعديلات العملاء قبل التنزيل النهائي: '+unreviewed.slice(0,10).map(function(r){return '#'+r.num;}).join('، ')+' — من تبويب مراجعة العملاء.');
  var repeat=chosen.some(function(r){return seen[r.key];}),id=String(payload.downloadId||''),reason=cleanText_(payload.reprintReason,250),previous=null;
  if(id&&!/^download_[a-zA-Z0-9_-]{8,100}$/.test(id))throw new Error('معرف التنزيل غير صحيح.');
  if(id)previous=opsRead_(WORKFLOW_DOWNLOAD_SHEET_,7).filter(function(r){return r[0]===id;})[0];
  var fingerprint=portalDigest_(JSON.stringify([payload.batch,chosen.map(function(r){return r.key;}).sort(),payload.revisions||{}]));
  if(previous){if(previous[6]!==fingerprint)throw new Error('تغير ملف التنزيل. أعد المعاينة.');return {duplicate:true};}
  if(repeat&&(reason.length<3||!id))throw new Error('اكتب سبب إعادة تنزيل الستكرات قبل المتابعة.');
  return {repeat:repeat,id:id,reason:reason,fingerprint:fingerprint};
}
function workflowRecordDownload_(payload,chosen,check){
  if(!check.id||check.duplicate)return;
  // Log first downloads too, so retrying the same network request is idempotent.
  opsPut_(WORKFLOW_DOWNLOAD_SHEET_,['معرف التنزيل','الدفعة','أرقام الطلبات','السبب','الوقت','الموظف','بصمة الملف'],[check.id,payload.batch,chosen.map(function(r){return r.num;}).join('، '),ajyalCell_(check.repeat?check.reason:'التنزيل الأول'),new Date().toISOString(),opsActor_(),check.fingerprint],check.id);
}
function workflowSettings_(){var defaults={prepHours:48,courierHours:72,ajyalHours:48},raw=JSON.parse(PropertiesService.getScriptProperties().getProperty(WORKFLOW_SETTINGS_KEY_)||'{}');Object.keys(defaults).forEach(function(k){if(Number.isInteger(raw[k])&&raw[k]>=1&&raw[k]<=8760)defaults[k]=raw[k];});return defaults;}
function adminWorkflowSettings(payload){opsManager_();payload=payload||{};var next={};['prepHours','courierHours','ajyalHours'].forEach(function(k){var n=Number(payload[k]);if(!Number.isInteger(n)||n<1||n>8760)throw new Error('مدة التنبيه من ساعة إلى 8760 ساعة.');next[k]=n;});var lock=LockService.getScriptLock();lock.waitLock(20000);try{var current=workflowSettings_();if(payload.version!==portalDigest_(JSON.stringify(current)))throw new Error('تغيرت الإعدادات. حدّث التنبيهات.');PropertiesService.getScriptProperties().setProperty(WORKFLOW_SETTINGS_KEY_,JSON.stringify(next));return {ok:true};}finally{lock.releaseLock();}}
function workflowCan_(auth,permission){return !auth.permissions||auth.native||auth.permissions.indexOf(permission)!==-1;}
function adminWorkflowAlerts(payload){
  var a=orgRequire_(['ordersRead','stickerRead','deliveryRead','ajyalRead']),settings=workflowSettings_(),alerts=[],unknown=0,now=Date.now();payload=payload||{};
  function add(type,number,label,at,hours,key){var ms=Object.prototype.toString.call(at)==='[object Date]'?at.getTime():/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(String(at))?Date.parse(at):NaN;if(!Number.isFinite(ms)){unknown++;return;}var elapsed=Math.floor((now-ms)/3600000);if(elapsed>=hours)alerts.push({type:type,orderNumber:number,label:label,since:new Date(ms).toISOString(),hours:elapsed,limit:hours,key:key});}
  if(workflowCan_(a,'ordersRead')||workflowCan_(a,'stickerRead')||workflowCan_(a,'deliveryRead')){
    var c=orgContext_(),s=adminOrdersSheet_(),raw=s.getLastRow()>1?s.getRange(2,2,s.getLastRow()-1,1).getValues():[],batches={};opsBatches_().forEach(function(b){batches[b.id]=b;});
    opsRows_().forEach(function(r,i){var o=orgOrder_(r,i,c),p=c.packs[o.key],b=p&&batches[p.batch];if((workflowCan_(a,'ordersRead')||workflowCan_(a,'stickerRead'))&&o.stage==='يحتاج تجهيزًا')add('prep',o.orderNumber,'بانتظار اكتمال التجهيز',b?b.createdAt:raw[i]&&raw[i][0],settings.prepHours,o.key);if(workflowCan_(a,'deliveryRead')&&o.stage==='سُلّم لشركة التوصيل')add('courier',o.orderNumber,o.company,o.handedAt,settings.courierHours,o.key);});
  }
  if(workflowCan_(a,'ajyalRead'))opsRead_(AJYAL_SHEET,12).forEach(function(r){if(['جديد','تم التواصل','بانتظار بيانات الحساب'].indexOf(r[5])!==-1)add('ajyal',r[1],r[2]+' — '+r[5],r[7],settings.ajyalHours,r[0]);});
  alerts.sort(function(a,b){return b.hours-a.hours;});var counts={prep:0,courier:0,ajyal:0};alerts.forEach(function(r){counts[r.type]++;});var filtered=alerts.filter(function(r){return !payload.type||r.type===payload.type;}),offset=Math.max(0,Math.floor(Number(payload.offset)||0));
  return {settings:settings,version:portalDigest_(JSON.stringify(settings)),counts:counts,total:filtered.length,rows:filtered.slice(offset,offset+50),offset:offset,unknown:unknown,updatedAt:new Date().toISOString()};
}
function adminPrepManifest(id){orgRequire_(['stickerRead']);var d=adminPrepBatch(id);return {batch:d.batch,summary:d.summary,createdAt:new Date().toISOString(),orders:d.orders.sort(function(a,b){return Number(a.orderNumber)-Number(b.orderNumber);}).map(function(o){return {number:o.orderNumber,name:o.name,items:o.items.map(function(i){return {text:i.text,product:i.product,folder:i.folder,paper:i.paper};}),stale:o.stale};})};}

