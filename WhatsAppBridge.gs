/* Signed WhatsApp bridge. Disabled until Script Properties are configured.
 * This file shares the original order system's locks, numbering and edit rules.
 * Add this routing line at the beginning of the existing doPost(e):
 * if (e && e.parameter && e.parameter.waBridge === '1') return waBridge_(e);
 * Required Script Properties: WA_BRIDGE_ENABLED=true,
 * WA_BRIDGE_SECRET=(same 32+ random secret as the agent),
 * WA_BRIDGE_WRITE_ENABLED=true, WA_BRIDGE_EXPECTED_SHEET_ID=(test sheet ID).
 * Production also requires WA_BRIDGE_ALLOW_PRODUCTION=true explicitly.
 */
function waJSON_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function waMAC_(text,key){return Utilities.computeHmacSha256Signature(text,key,Utilities.Charset.UTF_8).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function waEqual_(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;var v=0;for(var i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;}
function waFail_(code){return {ok:false,result:'error',code:code};}
function waCleanOrder_(raw){
  raw=raw||{};var o={};
  ['name','phone','altPhone','governorate','district','address','notes'].forEach(function(k){
    o[k]=String(raw[k]||'').trim();if(o[k].length>(k==='notes'?1000:500))throw new Error('FIELD_TOO_LONG');
    if(/^[=+@-]/.test(o[k]))throw new Error('UNSAFE_CELL');
  });
  if(!o.name||!o.address||!canonicalPhone_(o.phone)||!DISTRICTS[o.governorate]||DISTRICTS[o.governorate].indexOf(o.district)<0)throw new Error('INVALID_ORDER');
  if(o.altPhone&&(!canonicalPhone_(o.altPhone)||canonicalPhone_(o.altPhone)===canonicalPhone_(o.phone)))throw new Error('INVALID_ALT_PHONE');
  if(!Array.isArray(raw.items)||raw.items.some(function(i){return !i||!Object.prototype.hasOwnProperty.call(PRODUCTS,i.productId);}))throw new Error('INVALID_PRODUCT');
  var result=sanitizeItems_(raw.items);
  if(!result.ok||!result.items.length)throw new Error('INVALID_ITEMS');
  o.items=result.items.map(function(i){return {productId:i.productId,qty:i.qty,folderQty:i.folderQty,paperQty:i.paperQty};});
  return {order:o,items:result.items,totals:calculateTotals_(result.items,o.governorate,0)};
}
function waBridge_(e){
  try{
    var p=PropertiesService.getScriptProperties();
    if(p.getProperty('WA_BRIDGE_ENABLED')!=='true')return waJSON_(waFail_('BRIDGE_DISABLED'));
    var key=p.getProperty('WA_BRIDGE_SECRET')||'';
    if(key.length<32)return waJSON_(waFail_('BRIDGE_UNCONFIGURED'));
    var q=e.parameter||{},stamp=String(q.timestamp||''),body=String(q.body||'');
    if(body.length>30000||!/^\d{13}$/.test(stamp)||Math.abs(Date.now()-Number(stamp))>300000||!waEqual_(waMAC_(stamp+'\n'+body,key),q.signature))return waJSON_(waFail_('UNAUTHORIZED'));
    var request=JSON.parse(body),expected=p.getProperty('WA_BRIDGE_EXPECTED_SHEET_ID');
    if(!expected||SHEET_ID!==expected||request.expectedSheetId!==expected)return waJSON_(waFail_('SHEET_MISMATCH'));
    var d=request.data||{};
    if(request.op==='customer_cancel'){
      if(p.getProperty('WA_BRIDGE_WRITE_ENABLED')!=='true')return waJSON_(waFail_('WRITES_DISABLED'));
      if(SHEET_ID==='1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w'&&p.getProperty('WA_BRIDGE_ALLOW_PRODUCTION')!=='true')return waJSON_(waFail_('PRODUCTION_LOCKED'));
      return waJSON_(waCancelOrder_(d));
    }
    if(['edit_notifications','edit_notifications_ack'].indexOf(request.op)!==-1)return waJSON_(customerEditNotices_(request.op,d));
    if(['booking_notifications','booking_notifications_ack','booking_notification_details','booking_notifications_status'].indexOf(request.op)!==-1)return waJSON_(bookingNotifications_(request.op,d));
    if(['lifecycle_poll','lifecycle_ack','lifecycle_details'].indexOf(request.op)!==-1)return waJSON_(lifecycleNotifications_(request.op,d));
    if(request.op==='catalog')return waJSON_(catalogView_());
    if(request.op==='catalog_update')return waJSON_(catalogUpdate_(d));
    if(request.op==='customer_order')return waJSON_(waEditableOrder_(d));
    if(request.op==='customer_orders')return waJSON_(waLookupOrders_(d));
    if(['customer_status','customer_edit_link','customer_orders','agent_report'].indexOf(request.op)!==-1)return waJSON_(waCustomerService_(request.op,d,p));
    if(request.op==='quote'){
      if(!/^wa_[a-f0-9]{32}$/.test(d.requestId||''))return waJSON_(waFail_('INVALID_REQUEST_ID'));
      if(d.edit)return waJSON_(waEditQuote_(d,key));
      var clean=waCleanOrder_(d.order),now=Date.now();
      var quote={requestId:d.requestId,order:clean.order,items:clean.items,totals:clean.totals,createdAt:now,expiresAt:now+30*60000};
      quote.token=waMAC_(JSON.stringify(quote),key);
      return waJSON_({ok:true,quote:quote});
    }
    if(request.op==='commit'){
      if(p.getProperty('WA_BRIDGE_WRITE_ENABLED')!=='true')return waJSON_(waFail_('WRITES_DISABLED'));
      if(SHEET_ID==='1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w'&&p.getProperty('WA_BRIDGE_ALLOW_PRODUCTION')!=='true')return waJSON_(waFail_('PRODUCTION_LOCKED'));
      var x=d.quote||{},token=x.token;delete x.token;
      if(d.confirmed!==true||!waEqual_(waMAC_(JSON.stringify(x),key),token))return waJSON_(waFail_('INVALID_CONFIRMATION'));
      if(waWasCancelled_(x.targetRequestId||x.requestId))return waJSON_(waFail_('ORDER_CANCELLED'));
      if(x.kind==='update')return waJSON_(waEditCommit_(x));
      var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      // A successful previous commit wins over expiry. No duplicate row on retry.
      var previous=findResultByRequestId_(sheet,x.requestId);if(previous)return waJSON_(previous);
      if(Date.now()>x.expiresAt||Date.now()<x.createdAt||Date.now()-x.createdAt<MIN_FORM_TIME_MS)return waJSON_(waFail_('QUOTE_EXPIRED'));
      var checked=waCleanOrder_(x.order);
      if(JSON.stringify(checked.totals)!==JSON.stringify(x.totals)||JSON.stringify(checked.items)!==JSON.stringify(x.items))return waJSON_(waFail_('PRICE_CHANGED'));
      var input=checked.order;
      input.requestId=x.requestId;input.clientId='wa_'+canonicalPhone_(input.phone);
      input.formOpenedAt=x.createdAt;input.website='';input.ajyal=[];
      input.notes=(input.notes?'[واتساب] '+input.notes:'[واتساب] تأكيد الزبون عبر الوكيل').slice(0,1000);
      // Preserve all existing validations, phone-duplicate policy, locks and numbering.
      return waJSON_(saveOrder_(input));
    }
    return waJSON_(waFail_('UNKNOWN_OPERATION'));
  }catch(error){return waJSON_(waFail_('BRIDGE_ERROR'));}
}

// Sender is taken exclusively from the verified Meta event by the Node service.
function waCustomerService_(op,d,props){
  var sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues():[];
  if(typeof portalStickerMeta_!=='function'||typeof customerEditState_!=='function')return waFail_('CUSTOMER_SERVICE_UNAVAILABLE');
  var meta=portalStickerMeta_();
  if(op==='agent_report'){
    var agent=rows.filter(function(r){return /^wa_[a-f0-9]{32}$/.test(r[16]);}),amount=0,collected=0,cancelled=0;
    agent.forEach(function(r){if((meta[r[16]]||{}).status==='ملغي'){cancelled++;return;}amount+=numberFromDisplay_(r[13]);collected+=Number((meta[r[16]]||{}).amountPaid||0);});
    return {ok:true,orders:agent.length,cancelled:cancelled,orderValue:amount,collected:collected,asOf:new Date().toISOString()};
  }
  var sender=String(d.sender||'');if(!/^9627\d{8}$/.test(sender))return waFail_('INVALID_SENDER');
  var phone=canonicalPhone_('0'+sender.slice(3)),number=String(d.orderNumber||'');if(number&&!/^\d{1,8}$/.test(number))return waFail_('NOT_FOUND');
  var found=rows.filter(function(r){return canonicalPhone_(r[3])===phone&&(!number||String(r[0])===number);});
  if(op==='customer_orders')return {ok:true,orders:found.slice(-100).reverse().map(function(r){return {orderNumber:String(r[0]),status:(meta[r[16]]||{}).status||'جديد',total:numberFromDisplay_(r[13]),locked:customerEditState_(r).locked};}),totalMatches:found.length,asOf:new Date().toISOString()};
  if(!found.length)return waFail_('NOT_FOUND');if(found.length!==1)return waFail_('MULTIPLE_ORDERS');
  var row=found[0],state=customerEditState_(row);
  if(op==='customer_status')return {ok:true,orderNumber:row[0],status:state.status||(meta[row[16]]||{}).status||'جديد',total:numberFromDisplay_(row[13]),locked:state.locked};
  if(state.locked)return waFail_('ORDER_LOCKED');
  var base=props.getProperty('WA_CUSTOMER_EDIT_URL')||'';
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec\?action=editOrder$/.test(base))return waFail_('EDIT_URL_UNCONFIGURED');
  if(props.getProperty('WA_CUSTOMER_LINKS_ENABLED')!=='true')return waFail_('LINKS_DISABLED');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var latest=sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues().filter(function(r){return r[16]===row[16]&&canonicalPhone_(r[3])===phone;});
    if(latest.length!==1)return waFail_('NOT_FOUND');if(customerEditState_(latest[0]).locked)return waFail_('ORDER_LOCKED');
    var token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');customerEditStoreToken_(row[16],token);
    return {ok:true,orderNumber:row[0],url:base+'#token='+token};
  }finally{lock.releaseLock();}
}

// Read-only lookup in the user-confirmed main order register. No caller-controlled sheet IDs.
function waLookupOrders_(d){
  var sender=String(d.sender||'');if(!/^9627\d{8}$/.test(sender))return waFail_('INVALID_SENDER');
  var source='1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w';
  var sheet=SpreadsheetApp.openById(source).getSheetByName('الطلبات');if(!sheet)return waFail_('ORDERS_SHEET_MISSING');
  var rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues():[];
  var phone=canonicalPhone_('0'+sender.slice(3));
  var found=rows.filter(function(r){return canonicalPhone_(r[3])===phone;});
  var metadata={};try{var ms=SpreadsheetApp.openById(source).getSheetByName('بيانات الإدارة');if(ms&&ms.getLastRow()>1)ms.getRange(2,1,ms.getLastRow()-1,10).getDisplayValues().forEach(function(m){metadata[String(m[0])]=m;});}catch(ignore){}
  return {ok:true,source:'main_read_only',orders:found.slice(-100).reverse().map(function(r){var m=metadata[String(r[16])],state=typeof customerEditState_==='function'?customerEditState_(r):{};return {orderNumber:String(r[0]),date:String(r[1]),name:String(r[2]),governorate:String(r[5]),district:String(r[6]),address:String(r[7]),quantity:numberFromDisplay_(r[8]),productsTotal:numberFromDisplay_(r[11]),deliveryFee:numberFromDisplay_(r[12]),total:numberFromDisplay_(r[13]),items:String(r[14]),notes:String(r[15]),status:state.status||(m?String(m[2]):null),paymentStatus:m?String(m[3]):null,amountPaid:m?numberFromDisplay_(m[4]):null,deliveryOutAt:m?String(m[6]):null,deliveredAt:m?String(m[7]):null,locked:state.locked===true,printed:state.printed===true,canCreateNew:state.canCreateNew===true};}),totalMatches:found.length,asOf:new Date().toISOString()};
}


// All edit writes reuse the original row and the same lock as final sticker export.
function waOrderAccess_(d){
  var sender=String(d.sender||'');if(!/^9627\d{8}$/.test(sender))throw Error('INVALID_SENDER');
  var number=String(d.orderNumber||'');if(number&&!/^\d{1,8}$/.test(number))throw Error('NOT_FOUND');
  var sheet=adminOrdersSheet_(),phone=canonicalPhone_('0'+sender.slice(3));
  var rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues():[];
  var found=rows.map(function(r,i){return {sheet:sheet,row:i+2,values:r};}).filter(function(a){return canonicalPhone_(a.values[3])===phone&&(!number||String(a.values[0])===number);});
  if(!found.length)throw Error('NOT_FOUND');
  if(!number&&found.length>1){var open=found.filter(function(a){return !customerEditState_(a.values).locked;});if(open.length===1)found=open;else if(open.length>1)throw Error('MULTIPLE_ORDERS');else found=[found[found.length-1]];}
  if(found.length!==1||!found[0].values[16]||rows.filter(function(r){return r[16]===found[0].values[16];}).length!==1)throw Error('MULTIPLE_ORDERS');
  return found[0];
}
function waEditableOrder_(d){
  try{var a=waOrderAccess_(d),r=a.values,state=customerEditState_(r),teachers=customerEditTeachers_(r[16]),parsed=customerEditParse_(r,teachers);
    return {ok:true,orderNumber:String(r[0]),targetRequestId:r[16],revision:customerEditRevision_(r,teachers),locked:state.locked,printed:state.printed,canCreateNew:state.canCreateNew,status:state.status,productsEditable:parsed.editable,
      order:{name:r[2],phone:r[3],altPhone:r[4],governorate:r[5],district:r[6],address:r[7],notes:'',items:parsed.items.map(function(i){return {productId:i.productId,qty:i.qty,folderQty:i.folderQty,paperQty:i.paperQty};})},itemsText:r[14],totals:parsed.totals};
  }catch(e){return waFail_(e.message);}
}
function waPrepareEdit_(a,raw){
  var row=a.values,teachers=customerEditTeachers_(row[16]),parsed=customerEditParse_(row,teachers),order=Object.assign({},raw,{phone:row[3],altPhone:row[4]}),clean,totals;
  if(parsed.editable){clean=waCleanOrder_(order);var active=teachers.filter(function(t){return t.values[5]!=='ملغي';}).map(function(t){return {id:t.values[0],teacherName:t.values[2],phone:t.values[4],grade:t.values[9]};});
    customerEditAjyalPlan_(teachers,active,clean.items,row);totals=calculateTotals_(clean.items,clean.order.governorate,active.length);clean.totals=totals;clean.teachers=active;
  }else{
    if(!Array.isArray(order.items)||order.items.length)throw Error('MANUAL_REVIEW');
    totals=parsed.totals;if(order.governorate!==row[5]){totals.deliveryFee=order.governorate==='عمان'?2:3;totals.grandTotal=totals.productsTotal+totals.deliveryFee;}
    adminValidateEditable_(Object.assign({},order,totals,{itemsText:row[14]}));
    clean={order:order,items:[],totals:totals,teachers:[]};
  }
  // The displayed product total includes any existing Ajyal service; never drop it.
  clean.totals=Object.assign({},clean.totals,{productsTotal:clean.totals.productsTotal+(clean.totals.ajyalTotal||0)});
  clean.beforeItems=parsed.items.map(function(i){return {productId:i.productId,qty:i.qty,folderQty:i.folderQty,paperQty:i.paperQty};});
  return clean;
}
function waEditQuote_(d,key){
  try{var a=waOrderAccess_({sender:d.sender,orderNumber:d.edit.orderNumber}),state=customerEditState_(a.values);
    if(state.locked)return waFail_('ORDER_LOCKED');
    if(d.edit.targetRequestId!==a.values[16]||d.edit.revision!==customerEditRevision_(a.values,customerEditTeachers_(a.values[16])))return waFail_('STALE_ORDER');
    var clean=waPrepareEdit_(a,d.order),now=Date.now(),quote={kind:'update',requestId:d.requestId,sender:d.sender,orderNumber:String(a.values[0]),targetRequestId:a.values[16],baseRevision:d.edit.revision,order:clean.order,items:clean.items,totals:clean.totals,beforeItems:clean.beforeItems,createdAt:now,expiresAt:now+30*60000};
    quote.token=waMAC_(JSON.stringify(quote),key);return {ok:true,quote:quote};
  }catch(e){return waFail_(['INVALID_SENDER','NOT_FOUND','MULTIPLE_ORDERS','MANUAL_REVIEW'].indexOf(e.message)!==-1?e.message:'EDIT_VALIDATION');}
}
function waEditCommit_(x){
  if(!/^wa_[a-f0-9]{32}$/.test(x.requestId||''))return waFail_('INVALID_REQUEST_ID');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var ss=SpreadsheetApp.openById(SHEET_ID),log=ss.getSheetByName('تعديلات واتساب'),fingerprint=portalDigest_(JSON.stringify(x)),records=log&&log.getLastRow()>1?log.getRange(2,1,log.getLastRow()-1,5).getDisplayValues():[];
    var old=records.filter(function(r){return r[0]===x.requestId;});
    if(old.length){if(old.length!==1||old[0][1]!==fingerprint)return waFail_('REQUEST_CONFLICT');return old[0][2]==='saved'?JSON.parse(old[0][3]):waFail_('EDIT_UNCERTAIN');}
    if(Date.now()>x.expiresAt||Date.now()<x.createdAt||Date.now()-x.createdAt<MIN_FORM_TIME_MS)return waFail_('QUOTE_EXPIRED');
    var a=waOrderAccess_({sender:x.sender,orderNumber:x.orderNumber});
    if(customerEditState_(a.values).locked)return waFail_('ORDER_LOCKED');
    if(x.targetRequestId!==a.values[16]||x.baseRevision!==customerEditRevision_(a.values,customerEditTeachers_(a.values[16])))return waFail_('STALE_ORDER');
    var clean=waPrepareEdit_(a,x.order);
    if(JSON.stringify(clean.totals)!==JSON.stringify(x.totals)||JSON.stringify(clean.items)!==JSON.stringify(x.items)||JSON.stringify(clean.beforeItems)!==JSON.stringify(x.beforeItems))return waFail_('PRICE_CHANGED');
    a.tokenSheet=customerEditSheet_(true);a.tokenRow=customerEditFind_(a.tokenSheet,1,a.values[16]);
    if(!a.tokenRow){a.tokenRow=a.tokenSheet.getLastRow()+1;a.tokenSheet.getRange(a.tokenRow,1,1,4).setValues([[a.values[16],'','','']]);}
    if(!log){log=ss.insertSheet('تعديلات واتساب');log.getRange(1,1,1,5).setValues([['معرف العملية','بصمة العملية','الحالة','النتيجة','وقت العملية']]);log.setFrozenRows(1);}
    var n=log.getLastRow()+1;log.getRange(n,1,1,5).setNumberFormat('@').setValues([[x.requestId,fingerprint,'pending','',new Date().toISOString()]]);SpreadsheetApp.flush();
    var payload=Object.assign({},clean.order,{revision:x.baseRevision,teachers:clean.teachers,whatsappNote:clean.order.notes||''});
    customerEditApply_(payload,a);
    var result={ok:true,result:'success',updated:true,orderNumber:x.orderNumber,grandTotal:clean.totals.grandTotal};
    log.getRange(n,3,1,2).setValues([['saved',JSON.stringify(result)]]);SpreadsheetApp.flush();return result;
  }catch(e){return waFail_('EDIT_UNCERTAIN');}finally{lock.releaseLock();}
}


// Cancellation is bound to a verified sender and stable order ID, never just a row number.
// The durable journal makes delivery retries safe even after the original row is removed.
function waCancelOrder_(d){
  if(!/^9627\d{8}$/.test(String(d.sender||'')))return waFail_('INVALID_SENDER');
  if(d.confirmed!==true||!/^wa_cancel_[a-f0-9]{32}$/.test(String(d.requestId||''))||!d.targetRequestId||!/^\d{1,8}$/.test(String(d.orderNumber||'')))return waFail_('INVALID_CONFIRMATION');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var ss=SpreadsheetApp.openById(SHEET_ID),sheet=adminOrdersSheet_(),log=ss.getSheetByName('إلغاءات واتساب'),records=log&&log.getLastRow()>1?log.getRange(2,1,log.getLastRow()-1,7).getDisplayValues():[];
    var matches=records.map(function(r,i){return {values:r,row:i+2};}).filter(function(r){return r.values[0]===d.requestId;}),record=matches[0],n;
    if(matches.length>1)return waFail_('REQUEST_CONFLICT');
    if(record){
      if(record.values[1]!==d.sender||record.values[2]!==d.targetRequestId||record.values[3]!==String(d.orderNumber))return waFail_('REQUEST_CONFLICT');
      if(record.values[4]==='cancelled')return JSON.parse(record.values[5]);
      n=record.row;
    }
    var rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,17).getDisplayValues():[],found=rows.map(function(r,i){return {values:r,row:i+2};}).filter(function(r){return r.values[16]===d.targetRequestId;});
    if(found.length>1)return waFail_('MULTIPLE_ORDERS');
    var a=found[0],phone=canonicalPhone_('0'+d.sender.slice(3));
    if(a){
      if(canonicalPhone_(a.values[3])!==phone||String(a.values[0])!==String(d.orderNumber))return waFail_('NOT_FOUND');
      var state=customerEditState_(a.values);
      if(!state||typeof state.printed!=='boolean'||typeof state.locked!=='boolean')return waFail_('CANCEL_UNCERTAIN');
      if(state.printed||state.canCreateNew===true||['خرج للتوصيل','تم التسليم'].indexOf(state.status)!==-1)return waFail_('ORDER_LOCKED');
      if(state.locked&&state.status!=='ملغي')return waFail_('ORDER_LOCKED');
      if(d.baseRevision&&d.baseRevision!==customerEditRevision_(a.values,customerEditTeachers_(d.targetRequestId)))return waFail_('STALE_ORDER');
    }else if(!record)return waFail_('NOT_FOUND');
    adminEnsureSupportSheets_();
    var trash=ss.getSheetByName(ADMIN_TRASH_SHEET_NAME),archived=trash.getLastRow()>1?trash.getRange(2,1,trash.getLastRow()-1,20).getDisplayValues().some(function(r){return r[16]===d.targetRequestId&&canonicalPhone_(r[3])===phone;}):false;
    if(!a&&!archived)return waFail_('CANCEL_UNCERTAIN');
    if(!log){log=ss.insertSheet('إلغاءات واتساب');log.getRange(1,1,1,7).setValues([['معرف العملية','واتساب العميل','معرف الطلب','رقم الطلب','الحالة','النتيجة','التاريخ']]);log.setFrozenRows(1);}
    if(!record){n=log.getLastRow()+1;log.getRange(n,1,1,7).setNumberFormat('@').setValues([[d.requestId,d.sender,d.targetRequestId,String(d.orderNumber),'pending','',new Date().toISOString()]]);SpreadsheetApp.flush();}
    if(a){
      rememberOrderNumberFloor_(a.values[0]);
      if(!archived){var raw=sheet.getRange(a.row,1,1,17).getValues()[0],meta=adminGetMeta_(d.targetRequestId,d.orderNumber);trash.appendRow(raw.concat([new Date(),'واتساب — طلب العميل',JSON.stringify(meta)]));SpreadsheetApp.flush();}
      sheet.deleteRow(a.row);SpreadsheetApp.flush();
    }
    // Stop associated work and revoke the old edit link after the parent is removed.
    var teachers=customerEditTeachers_(d.targetRequestId),ajyal=teachers.length?ss.getSheetByName(AJYAL_SHEET):null;
    teachers.forEach(function(t){if(t.values[5]!=='ملغي'){ajyal.getRange(t.row,6).setValue('ملغي');ajyal.getRange(t.row,9).setValue(new Date().toISOString());}});
    var links=customerEditSheet_(false),tokenRow=customerEditFind_(links,1,d.targetRequestId);if(tokenRow)links.deleteRow(tokenRow);
    adminRemoveMeta_(d.targetRequestId);
    adminLog_('واتساب — طلب العميل','إلغاء الطلب وحذف صفه قبل طباعة الستكر',d.orderNumber,d.targetRequestId,a?a.row:0,a?a.values:[],[]);
    var result={ok:true,result:'success',cancelled:true,orderNumber:String(d.orderNumber),targetRequestId:d.targetRequestId};
    log.getRange(n,5,1,2).setValues([['cancelled',JSON.stringify(result)]]);SpreadsheetApp.flush();return result;
  }catch(e){return waFail_('CANCEL_UNCERTAIN');}finally{lock.releaseLock();}
}

function waWasCancelled_(id){var s=SpreadsheetApp.openById(SHEET_ID).getSheetByName('إلغاءات واتساب');return !!(s&&s.getLastRow()>1&&s.getRange(2,3,s.getLastRow()-1,1).getDisplayValues().some(function(r){return r[0]===id;}));}

