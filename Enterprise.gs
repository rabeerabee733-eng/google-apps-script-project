/* Private signed bridge operations for Karam's business workspace. */
function businessOrderObject_(r,meta){var m=meta[r[16]]||{},money=function(v){var n=numberFromDisplay_(v);if(!isFinite(n)||n<0)throw Error('INVALID_ORDER_MONEY');return n;};return {requestId:String(r[16]),orderNumber:String(r[0]),name:String(r[2]),phone:String(r[3]),altPhone:String(r[4]),address:[r[5],r[6],r[7]].filter(Boolean).join(' — '),items:String(r[14]),productsTotal:money(r[11]),deliveryFee:money(r[12]),total:money(r[13]),amountPaid:money(m.amountPaid||0),status:m.status||'جديد',revision:portalDigest_(JSON.stringify([r,m]))};}
function businessOrders_(d){d=d||{};var rows=opsRows_(),meta=portalStickerMeta_(),query=String(d.query||'').trim().slice(0,100),offset=Math.max(0,Math.floor(Number(d.offset)||0));var matches=rows.filter(function(r){return r[16]&&(!query||[r[0],r[2],r[3],r[4]].some(function(v){return String(v).indexOf(query)!==-1;}));}).reverse();return {ok:true,paymentSyncVersion:1,total:matches.length,nextOffset:offset+50<matches.length?offset+50:null,rows:matches.slice(offset,offset+50).map(function(r){return businessOrderObject_(r,meta);})};}
function businessOrder_(d){var rows=opsRows_().filter(function(r){return r[16]===String(d.requestId||'');});if(rows.length!==1)return waFail_('ORDER_NOT_FOUND');return {ok:true,order:businessOrderObject_(rows[0],portalStickerMeta_())};}
function businessApplySeasons_(products,props){if(!props)return;var day=Utilities.formatDate(new Date(),'Asia/Amman','yyyy-MM-dd');Object.keys(products).forEach(function(id){var p=products[id];var raw=props.getProperty('PRODUCT_SEASON_V1_'+id);if(!raw){delete p.bookingWindow;return;}var s=JSON.parse(raw);Object.defineProperty(p,'_seasonOriginal',{value:p.soldOut===true,writable:true,configurable:true,enumerable:false});p.bookingWindow=s;p.soldOut=p.soldOut===true||!!(s.from&&day<s.from||s.to&&day>s.to);});}
function businessSeason_(d){var lock=LockService.getScriptLock();lock.waitLock(20000);try{catalogApply_(PRODUCTS);if(d.revision!==catalogView_().revision)return waFail_('STALE_CATALOG');if(!Object.prototype.hasOwnProperty.call(PRODUCTS,d.id))return waFail_('INVALID_PRODUCT');var s=d.season||{},valid=function(v){return !v||/^20\d\d-\d\d-\d\d$/.test(v)&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;};if(!valid(s.from)||!valid(s.to)||s.from&&s.to&&s.from>s.to||typeof s.year!=='string'||s.year.length>20||['first','second','annual'].indexOf(s.term)===-1)return waFail_('INVALID_SEASON');var props=PropertiesService.getScriptProperties(),key='PRODUCT_SEASON_V1_'+d.id,old=props.getProperty(key),next={from:s.from||'',to:s.to||'',year:s.year,term:s.term};props.setProperty(key,JSON.stringify(next));try{var sheet=opsSheet_('سجل مواسم المنتجات',['المعرف','الوقت','المنتج','قبل','بعد']);sheet.getRange(sheet.getLastRow()+1,1,1,5).setNumberFormat('@').setValues([[Utilities.getUuid(),new Date().toISOString(),d.id,old||'',JSON.stringify(next)]]);}catch(e){if(old===null)props.deleteProperty(key);else props.setProperty(key,old);throw e;}catalogApply_(PRODUCTS);return catalogView_();}finally{lock.releaseLock();}}

function businessCustomer_(d){try{var access=customerEditAccess_(d.token);return {ok:true,order:businessOrderObject_(access.values,portalStickerMeta_())};}catch(e){return waFail_('ACCESS_REQUIRED');}}

/* Amount and acknowledgement share one metadata row write: retry never adds money twice. */
function businessPaymentSync_(d){
 var integer=function(n){return Number.isSafeInteger(n)&&n>=0&&n<=1000000000;};
 if(!d||!/^[-a-zA-Z0-9_]{1,120}$/.test(d.invoiceId||'')||typeof d.orderId!=='string'||!d.orderId||d.orderId.length>120||!integer(d.sequence)||!d.sequence||!integer(d.expectedPaid)||!integer(d.targetPaid)||!integer(d.total)||!integer(d.productsTotal)||!integer(d.deliveryFee)||d.targetPaid>d.total||d.expectedPaid>d.total||d.productsTotal+d.deliveryFee!==d.total||typeof d.items!=='string'||d.items.length>20000||typeof d.actor!=='string'||d.actor.length>80||typeof d.release!=='boolean'||d.release&&d.targetPaid!==0)return waFail_('INVALID_SYNC');
 var lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  var rows=opsRows_().filter(function(r){return String(r[16])===d.orderId;});
  if(rows.length!==1)return waFail_('ORDER_NOT_FOUND');
  var order=rows[0],money=function(v){return Math.round(numberFromDisplay_(v)*1000);};
  var orderChanged=money(order[11])!==d.productsTotal||money(order[12])!==d.deliveryFee||money(order[13])!==d.total||String(order[14])!==d.items;
  adminEnsureSupportSheets_();var ss=SpreadsheetApp.openById(SHEET_ID),sheet=ss.getSheetByName(ADMIN_META_SHEET_NAME),row=adminFindMetaRow_(sheet,d.orderId);
  if(sheet.getMaxColumns()<11)sheet.insertColumnsAfter(10,1);
  var values=row?sheet.getRange(row,1,1,11).getValues()[0]:[d.orderId,order[0],'جديد','غير مدفوع',0,'عادي','','','','',''];
  var current=Math.round(Number(values[4]||0)*1000),marker;
  try{marker=values[10]?JSON.parse(values[10]):null;}catch(e){return waFail_('SEQUENCE_CONFLICT');}
  var digest=portalDigest_(JSON.stringify([d.invoiceId,d.orderId,d.sequence,d.expectedPaid,d.targetPaid,d.total,d.productsTotal,d.deliveryFee,d.items,d.actor,d.release]));
  if(marker&&marker.invoiceId===d.invoiceId){
   if(marker.sequence===d.sequence){
    if(marker.digest!==digest)return waFail_('SEQUENCE_CONFLICT');
    if(current!==marker.paid)return waFail_('PAYMENT_CONFLICT');
    return {ok:true,invoiceId:d.invoiceId,sequence:d.sequence,amountPaid:current,replayed:true};
   }
   if(marker.released||d.sequence!==marker.sequence+1)return waFail_('SEQUENCE_CONFLICT');
  }else{
   if(marker&&!marker.released)return waFail_('INVOICE_BINDING_CONFLICT');
   if(d.sequence!==1||d.expectedPaid!==d.targetPaid||d.release)return waFail_('SEQUENCE_CONFLICT');
  }
  // Releasing a bound, zero-paid invoice changes no money or order contents.
  // Refunds may still reduce its confirmed balance after the booking changed.
  if(orderChanged&&!(marker&&marker.invoiceId===d.invoiceId&&(d.release&&current===0||d.targetPaid<d.expectedPaid)))return waFail_('ORDER_CHANGED');
  if(current!==d.expectedPaid)return waFail_('PAYMENT_CONFLICT');
  values[0]=d.orderId;values[1]=order[0];values[3]=d.targetPaid===d.total?'مدفوع':d.targetPaid?'مدفوع جزئيًا':'غير مدفوع';
  values[4]=d.targetPaid/1000;values[8]=new Date();values[9]='كرم: '+d.actor;
  values[10]=JSON.stringify({invoiceId:d.invoiceId,sequence:d.sequence,paid:d.targetPaid,digest:digest,released:d.release,at:new Date().toISOString()});
  sheet.getRange(1,11).setValue('مزامنة دفتر فواتير كرم');
  sheet.getRange(row||sheet.getLastRow()+1,1,1,11).setValues([values]);
  return {ok:true,invoiceId:d.invoiceId,sequence:d.sequence,amountPaid:d.targetPaid};
 }finally{lock.releaseLock();}
}

function businessPaymentReviewData_(orderId){
 var rows=opsRows_().filter(function(r){return String(r[16])===String(orderId);});if(rows.length!==1)return {error:'ORDER_NOT_FOUND'};
 adminEnsureSupportSheets_();var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(ADMIN_META_SHEET_NAME),row=adminFindMetaRow_(sheet,orderId);
 if(sheet.getMaxColumns()<11)sheet.insertColumnsAfter(sheet.getMaxColumns(),11-sheet.getMaxColumns());
 var values=row?sheet.getRange(row,1,1,11).getValues()[0]:[orderId,rows[0][0],'جديد','غير مدفوع',0,'عادي','','','','',''];
 var marker;try{marker=values[10]?JSON.parse(values[10]):null;}catch(e){return {error:'SEQUENCE_CONFLICT'};}
 var paid=Math.round(Number(values[4]||0)*1000);if(!Number.isSafeInteger(paid)||paid<0)return {error:'PAYMENT_CONFLICT'};
 return {sheet:sheet,row:row,values:values,marker:marker,paid:paid,order:rows[0],revision:portalDigest_(JSON.stringify([rows[0],values]))};
}
function businessPaymentReview_(d){
 if(!d||typeof d.orderId!=='string'||!d.orderId||d.orderId.length>120)return waFail_('INVALID_SYNC');
 var lock=LockService.getScriptLock();lock.waitLock(20000);try{
  var r=businessPaymentReviewData_(d.orderId);if(r.error)return waFail_(r.error);
  return {ok:true,orderId:d.orderId,orderNumber:String(r.order[0]),amountPaid:r.paid,revision:r.revision,binding:r.marker?{invoiceId:r.marker.invoiceId,sequence:r.marker.sequence,released:r.marker.released===true}:null};
 }finally{lock.releaseLock();}
}
function businessPaymentReconcile_(d){
 if(!d||!/^[-a-zA-Z0-9_]{16,100}$/.test(d.operationId||'')||!/^[-a-zA-Z0-9_]{1,120}$/.test(d.invoiceId||'')||typeof d.orderId!=='string'||!d.orderId||d.orderId.length>120||typeof d.revision!=='string'||d.revision.length>200||!Number.isSafeInteger(d.sequence)||d.sequence<1||d.sequence>1000000000||typeof d.reason!=='string'||!d.reason.trim()||d.reason.length>300)return waFail_('INVALID_SYNC');
 var lock=LockService.getScriptLock();lock.waitLock(20000);try{
  var r=businessPaymentReviewData_(d.orderId);if(r.error)return waFail_(r.error);
  var digest=portalDigest_(JSON.stringify(d)),m=r.marker;
  if(r.paid!==0)return waFail_('PAYMENT_CONFLICT');
  if(m&&m.reconcileId===d.operationId){if(m.digest!==digest)return waFail_('SEQUENCE_CONFLICT');return {ok:true,invoiceId:d.invoiceId,sequence:d.sequence,amountPaid:0,released:true,replayed:true,operationId:d.operationId};}
  if(r.revision!==d.revision)return waFail_('STALE_REVIEW');
  if(m&&m.invoiceId!==d.invoiceId&&!m.released)return waFail_('INVOICE_BINDING_CONFLICT');
  if(m&&m.invoiceId===d.invoiceId&&d.sequence<=m.sequence)return waFail_('SEQUENCE_CONFLICT');
  if(r.sheet.getMaxColumns()<11)r.sheet.insertColumnsAfter(10,1);
  r.values[8]=new Date();r.values[9]='كرم: تسوية المدير';
  r.values[10]=JSON.stringify({invoiceId:d.invoiceId,sequence:d.sequence,paid:0,digest:digest,released:true,reconcileId:d.operationId,reason:d.reason,at:new Date().toISOString()});
  r.sheet.getRange(1,11).setValue('مزامنة دفتر فواتير كرم');r.sheet.getRange(r.row||r.sheet.getLastRow()+1,1,1,11).setValues([r.values]);
  return {ok:true,invoiceId:d.invoiceId,sequence:d.sequence,amountPaid:0,released:true,operationId:d.operationId};
 }finally{lock.releaseLock();}
}
