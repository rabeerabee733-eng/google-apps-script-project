var LIFECYCLE_STATE_='حالات متابعة الحجوزات';
var LIFECYCLE_OUTBOX_='إشعارات متابعة الحجوزات';
function lifecycleSheets_(){return {state:opsSheet_(LIFECYCLE_STATE_,['معرف الطلب','الحالة المرصودة']),outbox:opsSheet_(LIFECYCLE_OUTBOX_,['معرف الإشعار','معرف الطلب','الهاتف','النوع','القيمة','الحالة','الوقت'])};}
function lifecycleContext_(){var snapshots=courierSnapshots_(),last={};snapshots.forEach(function(s){last[s.key]=s;});return {meta:portalStickerMeta_(),packs:opsPacks_(),tracking:courierTracking_(),snapshots:snapshots,lastSnapshot:last,corrections:[]};}
function lifecycleTeachers_(){var map={};opsRead_(AJYAL_SHEET,12).forEach(function(r){var id=String(r[10]||r[0]);(map[id]||(map[id]=[])).push({values:r});});return map;}
// Called only after validated final export, while the existing export lock is held.
// The first immutable export batch is authoritative, including retries after a write failure.
function lifecycleQueueStickerDownloads_(payload,chosen){
 var first={},known={},byId={},duplicates={},sheets=lifecycleSheets_(),add=[];
 stickerExportLedger_().forEach(function(r){if(!first[r[0]])first[r[0]]=r;});
 opsRead_(LIFECYCLE_OUTBOX_,7).forEach(function(r){known[r[0]]=true;});
 bookingNoticeOrderRows_().forEach(function(r){var id=String(r[16]);if(byId[id])duplicates[id]=true;byId[id]=r;});
 chosen.forEach(function(item){
  var id=String(item.requestId||item.key),row=byId[id],exported=first[item.key];
  if(!row||duplicates[id]||!bookingNoticeValid_(row)||!exported||String(exported[4])!==String(payload.batch))return;
  var nid='lifecycle_'+bookingNoticeId_(id+'|status|خرج للتوصيل').slice(8);if(known[nid])return;known[nid]=true;
  add.push([nid,id,'962'+canonicalPhone_(row[3]).slice(1),'status',JSON.stringify({status:'خرج للتوصيل',exportedAt:exported[3],source:'sticker_download'}),'pending',exported[3]]);
 });
 if(add.length)sheets.outbox.getRange(sheets.outbox.getLastRow()+1,1,add.length,7).setNumberFormat('@').setValues(add);
}
function lifecycleNotifications_(op,d){
 var lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  var sheets=lifecycleSheets_(),out=opsRead_(LIFECYCLE_OUTBOX_,7);
  if(op==='lifecycle_ack'){
   var ids=Array.isArray(d.ids)?d.ids.slice(0,50):[];out.forEach(function(r,i){if(r[5]==='pending'&&ids.indexOf(r[0])!==-1)sheets.outbox.getRange(i+2,6).setValue('queued');});return {ok:true};
  }
  var orders=bookingNoticeOrderRows_(),byId={},duplicates={};orders.forEach(function(r){if(byId[r[16]])duplicates[r[16]]=true;byId[r[16]]=r;});
  var context=lifecycleContext_(),teachers=lifecycleTeachers_();
  if(op==='lifecycle_details'){
   var found=out.filter(function(r){return r[0]===d.id;});if(found.length!==1)return waFail_('NOT_FOUND');var n=found[0],order=byId[n[1]];
   if(!order||duplicates[n[1]]||'962'+canonicalPhone_(order[3]).slice(1)!==n[2]||d.sender!==n[2])return waFail_('NOT_FOUND');
   var t=workflowPublicTracking_(order,teachers[n[1]]||[],context),value=JSON.parse(n[4]);
   if(n[3]==='status'&&t.status!==value.status||n[3]==='ajyal'&&(t.ajyalTotal===0||t.ajyalCompleted!==t.ajyalTotal))return waFail_('NOT_FOUND');
   return {ok:true,id:n[0],targetRequestId:n[1],sender:n[2],name:order[2],orderNumber:order[0],status:n[3]==='ajyal'?'اكتمل رفع خطط أجيال':t.status,details:n[3]==='ajyal'?'اكتملت الخدمة لجميع المشتركين في هذا الطلب.':t.company?'شركة التوصيل: '+t.company:'يمكنك مراجعة تفاصيل الطلب من الرابط.',bookingNoticeId:bookingNoticeId_(n[1]),exportedAt:value.exportedAt||'',createdAt:n[6]};
  }
  if(op!=='lifecycle_poll')return waFail_('UNKNOWN_OPERATION');
  var previous={},rows=opsRead_(LIFECYCLE_STATE_,2),known={},addState=[],addOut=[],updateState=[],now=new Date().toISOString();
  rows.forEach(function(r,i){previous[r[0]]={row:i+2,value:JSON.parse(r[1])};});out.forEach(function(r){known[r[0]]=true;});
  orders.forEach(function(r){
   var id=String(r[16]);if(!bookingNoticeValid_(r)||duplicates[id])return;
   var t=workflowPublicTracking_(r,teachers[id]||[],context),value={status:t.status,ajyal:t.ajyalTotal>0&&t.ajyalCompleted===t.ajyalTotal},old=previous[id];
   // The first observation is a baseline, including historical orders. No catch-up blasts.
   if(old){
    var kinds=[];if(old.value.status!==value.status&&['جاهز','خرج للتوصيل','تم التسليم'].indexOf(value.status)!==-1)kinds.push('status');if(!old.value.ajyal&&value.ajyal)kinds.push('ajyal');
    kinds.forEach(function(kind){var nid='lifecycle_'+bookingNoticeId_(id+'|'+kind+'|'+(kind==='status'?value.status:'complete')).slice(8);if(known[nid])return;known[nid]=true;addOut.push([nid,id,'962'+canonicalPhone_(r[3]).slice(1),kind,JSON.stringify(value),'pending',now]);});
    if(JSON.stringify(old.value)!==JSON.stringify(value))updateState.push({row:old.row,value:JSON.stringify(value)});
   }else addState.push([id,JSON.stringify(value)]);
  });
  if(addOut.length)sheets.outbox.getRange(sheets.outbox.getLastRow()+1,1,addOut.length,7).setNumberFormat('@').setValues(addOut);
  updateState.forEach(function(item){sheets.state.getRange(item.row,2).setValue(item.value);});
  if(addState.length)sheets.state.getRange(sheets.state.getLastRow()+1,1,addState.length,2).setNumberFormat('@').setValues(addState);
  return {ok:true,events:out.concat(addOut).filter(function(r){return r[5]==='pending';}).slice(0,50).map(function(r){return {id:r[0],targetRequestId:r[1],sender:r[2],kind:r[3],createdAt:r[6]};})};
 }finally{lock.releaseLock();}
}
