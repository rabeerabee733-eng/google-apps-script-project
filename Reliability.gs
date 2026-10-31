/* Signed bridge diagnostics and recovery. No customer messages or queue mutations. */
var RELIABILITY_VERSION_='2026-10-31.2';
function reliabilitySnapshot_(d){
 d=d||{};var rows=opsRows_(),out=opsRead_(LIFECYCLE_OUTBOX_,7),notices=opsRead_('إشعارات الحجوزات',9),ledger=stickerExportLedger_(),ids={},numbers={},exports={},events={},bookings={};
 rows.forEach(function(r){if(r[16])ids[r[16]]=(ids[r[16]]||0)+1;numbers[r[0]]=(numbers[r[0]]||0)+1;});
 ledger.forEach(function(r){if(!exports[r[0]])exports[r[0]]=r;});out.forEach(function(r){events[r[0]]=r;});notices.forEach(function(r){bookings[r[2]]=r;});
 var revision=portalDigest_(JSON.stringify([rows,ledger]));if(d.revision&&d.revision!==revision)return waFail_('SNAPSHOT_CHANGED');
 var offset=Math.max(0,Math.floor(Number(d.offset)||0)),limit=500;
 var page=rows.slice(offset,offset+limit).map(function(r){var id=String(r[16]),eventId='lifecycle_'+bookingNoticeId_(id+'|status|خرج للتوصيل').slice(8),e=events[eventId],b=bookings[id],x=exports[stickerExportKey_(r)];return {requestId:id,orderNumber:String(r[0]),identityIssue:!id?'MISSING_ID':ids[id]>1?'DUPLICATE_ID':numbers[r[0]]>1?'DUPLICATE_NUMBER':'',exportedAt:x?x[3]:'',dispatchId:x?eventId:'',dispatchStatus:e?e[5]:'',bookingId:b?b[0]:'',bookingStatus:b?b[5]:'',bookingAt:b?b[6]:''};});
 var result={ok:true,version:RELIABILITY_VERSION_,revision:revision,offset:offset,nextOffset:offset+page.length<rows.length?offset+page.length:null,total:rows.length,rows:page,checkedAt:new Date().toISOString()};
 if(offset===0){result.identity={total:rows.length,missing:rows.filter(function(r){return !r[16];}).length,duplicateIds:Object.keys(ids).filter(function(k){return ids[k]>1;}).length,duplicateNumbers:Object.keys(numbers).filter(function(k){return numbers[k]>1;}).length};result.backup=JSON.parse(PropertiesService.getScriptProperties().getProperty('RELIABILITY_BACKUP_STATUS_V1')||'null');result.production=reliabilityProduction_();}
 return result;
}
function reliabilityProduction_(){
 var groups={},unknown=[],counts={orders:0,excluded:0},packs=opsPacks_(),meta=portalStickerMeta_(),tracking=courierTracking_();
 opsRows_().forEach(function(r){var key=stickerExportKey_(r),status=(meta[r[16]]||{}).status||'',courier=(tracking[key]||{}).status||'';
  if(status==='ملغي'||status==='تم التسليم'||courier==='تم التسليم'||courier==='مرتجع'){counts.excluded++;return;}counts.orders++;
  var pack=packs[key],valid=pack&&pack.itemsRevision===opsItemRevision_(r),checked=valid?pack.checked||[]:[];
  opsItems_(r[14]).forEach(function(item){if(!item.product){if(!/^خدمة أجيال/.test(item.text))unknown.push({orderNumber:String(r[0]),reason:'سطر يحتاج تصنيفًا يدويًا'});return;}
   var pid=Object.keys(PRODUCTS).filter(function(k){return PRODUCTS[k].name===item.name;})[0],p=pid&&PRODUCTS[pid];
   if(!p||!Number.isSafeInteger(item.qty)||item.qty<1){unknown.push({orderNumber:String(r[0]),reason:'منتج أو كمية غير معروفة'});return;}
   var folder=item.folder||0,paper=item.paper||0,other=p.splitAllowed||p.paperOnly?0:item.qty;
   if((p.splitAllowed||p.paperOnly)&&folder+paper!==item.qty){unknown.push({orderNumber:String(r[0]),reason:'توزيع الورقي والمجلد لا يطابق الكمية'});return;}
   var done=!!(valid&&(pack.packedAt||checked.indexOf(item.id)!==-1));
   ['folder','paper','other'].forEach(function(kind){var qty=kind==='folder'?folder:kind==='paper'?paper:other;if(!qty)return;var k=pid+':'+kind,g=groups[k]||(groups[k]={productId:pid,name:p.name,kind:kind,total:0,completed:0,remaining:0,orders:[]});g.total+=qty;g.completed+=done?qty:0;g.remaining+=done?0:qty;g.orders.push(String(r[0]));});
  });
 });
 return {asOf:new Date().toISOString(),counts:counts,groups:Object.keys(groups).map(function(k){return groups[k];}),unknownCount:unknown.length,unknown:unknown.slice(0,100),basis:'current_open_orders_checklist'};
}
function reliabilityBackupSettings_(){
 var props=PropertiesService.getScriptProperties(),all=props.getProperties(),result={};
 Object.keys(all).filter(function(k){return /^PRODUCT_(?:SEASON_)?V1_/.test(k)||['STICKER_BARCODE_ANCHOR','ADMIN_ORDER_NUMBER_FLOOR','ADMIN_PORTAL_ACCOUNTS_V1','WORKFLOW_ALERT_SETTINGS_V1'].indexOf(k)!==-1;}).forEach(function(k){result[k]=all[k];});return result;
}
function reliabilityBackupDrill_(id){
 var b=opsBackupManifest_(id),props=PropertiesService.getScriptProperties(),testId=props.getProperty('RELIABILITY_DRILL_SHEET_V1'),target,marker='__KARAM_RESTORE_TEST__';
 if(testId){if(testId===SHEET_ID||opsBackupIndex_().some(function(x){return x.id===testId;}))throw Error('UNSAFE_DRILL_TARGET');target=SpreadsheetApp.openById(testId);var tag=target.getSheetByName(marker);if(!tag||tag.getRange(1,1).getValue()!==SHEET_ID)throw Error('UNSAFE_DRILL_TARGET');}
 else{target=SpreadsheetApp.create('كرم — بيئة اختبار الاسترجاع المعزولة');target.insertSheet(marker).getRange(1,1).setValue(SHEET_ID);props.setProperty('RELIABILITY_DRILL_SHEET_V1',target.getId());}
 var previous=target.getSheets().filter(function(s){return s.getName()!==marker;}),staged=[],prefix='test_'+Utilities.getUuid().slice(0,8)+'_';
 try{b.manifest.sheets.forEach(function(s,i){var restored=b.file.getSheetByName(s.name).copyTo(target);staged.push(restored);restored.setName(prefix+i);if(opsBackupHash_(restored)!==s.hash)throw Error('RESTORE_DRILL_MISMATCH');});previous.forEach(function(s){target.deleteSheet(s);});return {ok:true,sheets:b.manifest.sheets.length,at:new Date().toISOString()};}
 catch(e){staged.forEach(function(s){try{target.deleteSheet(s);}catch(ignored){}});throw e;}
}
function reliabilityMaintenance_(){
 var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return waFail_('MAINTENANCE_BUSY');
 try{var props=PropertiesService.getScriptProperties(),last=JSON.parse(props.getProperty('RELIABILITY_BACKUP_STATUS_V1')||'null'),today=Utilities.formatDate(new Date(),'Asia/Amman','yyyy-MM-dd');
  if(last&&last.day===today&&last.ok)return {ok:true,backup:last};
  var entry=last&&last.day===today&&last.id?last:opsBackupCreate_('نسخة يومية تلقائية'),status={id:entry.id,day:today,createdAt:entry.createdAt,ok:false};props.setProperty('RELIABILITY_BACKUP_STATUS_V1',JSON.stringify(status));
  var drill=reliabilityBackupDrill_(entry.id);status.ok=true;status.drill=drill;props.setProperty('RELIABILITY_BACKUP_STATUS_V1',JSON.stringify(status));return {ok:true,backup:status};
 }catch(e){var failed=JSON.parse(PropertiesService.getScriptProperties().getProperty('RELIABILITY_BACKUP_STATUS_V1')||'{}');failed.ok=false;failed.error='BACKUP_REQUIRES_ATTENTION';failed.failedAt=new Date().toISOString();PropertiesService.getScriptProperties().setProperty('RELIABILITY_BACKUP_STATUS_V1',JSON.stringify(failed));return waFail_('BACKUP_REQUIRES_ATTENTION');}
 finally{lock.releaseLock();}
}
