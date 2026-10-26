// Customer bearer links use cryptographic randomness. Only their SHA-256 digest is stored.
// Final sticker export and customer saves share the project script lock.
var CUSTOMER_EDIT_SHEET_ = 'روابط تعديل الحجوزات';
var CUSTOMER_EDIT_URL_ = 'https://script.google.com/macros/s/AKfycbz-c1QyYl3h8wZf88vKChT7d3-91OMGJ5fq_931eMCVI11gJrLbyw_kPAUtdkVVCNTz2A/exec?action=editOrder';
function serveCustomerEdit_() {
  return HtmlService.createHtmlOutputFromFile('CustomerEditPage').setTitle('تعديل الحجز').addMetaTag('viewport','width=device-width,initial-scale=1');
}
function customerEditSheet_(create) {
  var ss=SpreadsheetApp.openById(SHEET_ID),s=ss.getSheetByName(CUSTOMER_EDIT_SHEET_);
  if(!s&&create){s=ss.insertSheet(CUSTOMER_EDIT_SHEET_);s.getRange(1,1,1,4).setValues([['معرف الحجز','بصمة رابط التعديل','تاريخ إصدار الرابط','آخر تعديل بواسطة العميل']]);s.setFrozenRows(1);}
  return s;
}
function customerEditFind_(s,column,value) {
  if(!s||s.getLastRow()<2)return 0;
  var found=s.getRange(2,column,s.getLastRow()-1,1).createTextFinder(String(value)).matchEntireCell(true).findAll();
  if(found.length>1)throw new Error('تعذر التحقق من الرابط. تواصل معنا.');
  return found.length?found[0].getRow():0;
}
function customerEditStoreToken_(requestId,token) {
  if(!/^[a-f0-9]{64}$/.test(String(token||'')))throw new Error('تعذر إنشاء رابط التعديل. أعد المحاولة.');
  var s=customerEditSheet_(true),r=customerEditFind_(s,1,requestId),edited=r?s.getRange(r,4).getDisplayValue():'';
  s.getRange(r||s.getLastRow()+1,1,1,4).setNumberFormat('@').setValues([[requestId,portalDigest_(token),new Date().toISOString(),edited]]);
}
function customerEditRegister_(data) {
  if(data.customerEditToken)customerEditStoreToken_(data.requestId,String(data.customerEditToken));
  try{bookingNoticeQueue_(data);}catch(ignore){/* Polling recovers the notification without failing the booking. */}
}
function customerEditAccess_(token) {
  var error='رابط التعديل غير صالح أو تم استبداله. اطلب رابطًا جديدًا من الإدارة.';
  if(!/^[a-f0-9]{64}$/.test(String(token||'')))throw new Error(error);
  var s=customerEditSheet_(false),r=customerEditFind_(s,2,portalDigest_(token));
  if(!r)throw new Error(error);
  var id=s.getRange(r,1).getDisplayValue(),orders=adminOrdersSheet_(),row=adminTryFindRowByRequestId_(orders,id,null);
  if(!row)throw new Error(error);
  // Fail closed on duplicate identifiers rather than guessing a physical row.
  if(orders.getRange(2,17,orders.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findAll().length!==1)throw new Error(error);
  return {sheet:orders,row:row,values:orders.getRange(row,1,1,17).getDisplayValues()[0],tokenSheet:s,tokenRow:r};
}
function customerEditState_(row) {
  var key=stickerExportKey_(row),exported=stickerExportLedger_().filter(function(x){return x[0]===key||String(x[1])===String(row[0]);})[0];
  var meta=portalStickerMeta_()[String(row[16])]||{},sent=!!exported||['خرج للتوصيل','تم التسليم'].indexOf(meta.status)!==-1||courierSnapshots_().some(function(x){return x.key===key;});
  if(sent)return {locked:true,printed:!!exported,canCreateNew:true,status:meta.status==='تم التسليم'?'تم التسليم':'خرج للتوصيل',lockedAt:exported?exported[3]:'',reason:'تم طباعة الستكرات أو خروج الطلب للتوصيل؛ لا يمكن تعديله. يمكنك إضافة طلب جديد.'};
  if(meta.status==='ملغي')return {locked:true,printed:false,canCreateNew:false,status:'ملغي',lockedAt:'',reason:'هذا الطلب ملغي ومغلق للتعديل. تواصل معنا للمساعدة.'};
  return {locked:false,printed:false,canCreateNew:false,status:meta.status||'جديد',lockedAt:'',reason:''};
}
function customerEditTeachers_(id) {
  var s=SpreadsheetApp.openById(SHEET_ID).getSheetByName(AJYAL_SHEET);
  if(!s||s.getLastRow()<2)return [];
  return s.getRange(2,1,s.getLastRow()-1,12).getDisplayValues().map(function(a,i){return {row:i+2,values:a};}).filter(function(a){return String(a.values[10]||a.values[0])===id;});
}
function customerEditRevision_(row,teachers) {
  return portalDigest_(JSON.stringify([row,teachers.map(function(t){return t.values;}),portalStickerMeta_()[String(row[16])]||{}]));
}
function customerEditParse_(row,teachers) {
  var raw=[],serviceCount=0,serviceTotal=0,serviceSeen=false;
  try {
    String(row[14]||'').split(/\r?\n/).filter(function(s){return s.trim();}).forEach(function(line){
      line=opsDigits_(line);
      var service=line.match(/^خدمة أجيال\s*—\s*عدد المعلمين:\s*(\d+)\s*—\s*المجموع:\s*(\d+)\s*د(?:\.أ)?$/);
      if(service){if(serviceSeen)throw new Error();serviceSeen=true;serviceCount=Number(service[1]);serviceTotal=Number(service[2]);return;}
      var parts=line.split(/\s*—\s*/),name=parts.shift().replace(/^\d+\)\s*/,''),id=Object.keys(PRODUCTS).filter(function(k){return PRODUCTS[k].name===name;})[0];
      if(!id)throw new Error();
      var item={productId:id,qty:null,folderQty:0,paperQty:0},price=null,seen={};
      parts.forEach(function(p){var m=p.match(/^(العدد|مجلد|ورقي|ورقي فقط|المجموع):\s*(\d+)(?:\s*د(?:\.أ)?)?$/);if(!m||seen[m[1]])throw new Error();seen[m[1]]=true;if(m[1]==='العدد')item.qty=Number(m[2]);else if(m[1]==='مجلد')item.folderQty=Number(m[2]);else if(m[1]==='المجموع')price=Number(m[2]);else item.paperQty=Number(m[2]);});
      if(price!==PRODUCTS[id].price*item.qty)throw new Error();raw.push(item);
    });
    var cleaned=sanitizeItems_(raw),active=teachers.filter(function(t){return t.values[5]!=='ملغي';});
    var unitPrice=active.length?serviceTotal/active.length:2;
    if(!cleaned.ok||!cleaned.items.length||serviceCount!==active.length||[2,3].indexOf(unitPrice)===-1||serviceTotal!==active.length*unitPrice)throw new Error();
    normalizeAjyal_({enabled:active.length>0,teachers:active.map(function(t){return {teacherName:t.values[2],phone:t.values[4],grade:t.values[9]};})},cleaned.items);
    var totals=calculateTotals_(cleaned.items,row[5],active.length,unitPrice),expected=[totals.itemsCount,totals.folderCount,totals.paperCount,totals.productsTotal+totals.ajyalTotal,totals.deliveryFee,totals.grandTotal];
    expected.forEach(function(v,i){if(v!==numberFromDisplay_(row[i+8]))throw new Error();});
    return {editable:true,items:cleaned.items,totals:totals};
  } catch(ignored) {
    return {editable:false,items:[],totals:{itemsCount:numberFromDisplay_(row[8]),folderCount:numberFromDisplay_(row[9]),paperCount:numberFromDisplay_(row[10]),productsTotal:numberFromDisplay_(row[11]),ajyalCount:0,ajyalTotal:0,deliveryFee:numberFromDisplay_(row[12]),grandTotal:numberFromDisplay_(row[13])}};
  }
}
function customerEditView_(access) {
  var row=access.values,state=customerEditState_(row),result={orderNumber:row[0],locked:state.locked,lockedAt:state.lockedAt,message:state.reason};
  var teachers=customerEditTeachers_(String(row[16])),parsed=customerEditParse_(row,teachers);
  result.tracking=workflowPublicTracking_(row,teachers);
  result.revision=state.locked?'':customerEditRevision_(row,teachers);
  result.order={name:row[2],phone:row[3],altPhone:row[4],governorate:row[5],district:row[6],address:row[7]};
  result.productsEditable=!state.locked&&parsed.editable;result.items=parsed.items;result.totals=parsed.totals;result.ajyalUnitPrice=parsed.totals.ajyalUnitPrice||2;result.itemsText=row[14];
  result.teachers=teachers.filter(function(t){return t.values[5]!=='ملغي';}).map(function(t){var a=t.values;return {id:a[0],teacherName:a[2],phone:a[4],grade:a[9],editable:a[5]==='جديد'};});
  result.catalog=Object.keys(PRODUCTS).map(function(k){var p=PRODUCTS[k];return {id:k,name:p.name,price:p.price,splitAllowed:!!p.splitAllowed,paperOnly:!!p.paperOnly,soldOut:!!p.soldOut};});
  result.districts=DISTRICTS;result.grades=AJYAL_GRADES;
  if(state.locked)return result;
  result.message=parsed.editable?'يمكنك التعديل حتى أول تنزيل نهائي للستكرات.':'يمكنك تعديل بيانات الاتصال والعنوان. تفاصيل هذا الطلب تتطلب مراجعة الإدارة لتعديل المنتجات أو أجيال.';
  return result;
}
function customerEditLoad(token) {
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{return customerEditView_(customerEditAccess_(token));}finally{lock.releaseLock();}
}
function customerEditAjyalPlan_(existing,input,items,order) {
  if(!Array.isArray(input)||input.length>297)throw new Error('بيانات أجيال غير صحيحة.');
  var clean=normalizeAjyal_({enabled:input.length>0,teachers:input},items),seen={},changes=[],now=new Date().toISOString();
  input.forEach(function(t,i){var id=String(t.id||''),old=id&&existing.filter(function(x){return x.values[0]===id&&x.values[5]!=='ملغي';})[0],v;
    if(id&&(!old||seen[id]))throw new Error('تغيرت بيانات أجيال. أعد فتح الرابط.');if(id)seen[id]=true;
    if(old&&old.values[5]!=='جديد'&&(clean[i].teacherName!==old.values[2]||clean[i].grade!==old.values[9]||canonicalPhone_(clean[i].phone)!==canonicalPhone_(old.values[4])))throw new Error('بدأ العمل على اشتراك أحد المعلمين؛ تواصل معنا لتعديله.');
    if(old){v=old.values.slice();v[2]=ajyalCell_(clean[i].teacherName);v[4]=clean[i].phone;v[9]=clean[i].grade;if(v[2]!==old.values[2]||v[4]!==old.values[4]||v[9]!==old.values[9]){v[8]=now;changes.push({row:old.row,before:old.values,after:v});}}
    else changes.push({row:0,before:null,after:['teacher_'+Utilities.getUuid(),order[0],ajyalCell_(clean[i].teacherName),'',clean[i].phone,'جديد','',now,now,clean[i].grade,order[16],'']});
  });
  existing.forEach(function(t){if(t.values[5]==='ملغي'||seen[t.values[0]])return;if(t.values[5]!=='جديد')throw new Error('لا يمكن إزالة اشتراك بدأ العمل عليه. تواصل معنا.');var v=t.values.slice();v[5]='ملغي';v[8]=now;changes.push({row:t.row,before:t.values,after:v});});
  return {teachers:clean,changes:changes};
}
function customerEditSave(payload) {
  payload=payload||{};var lock=LockService.getScriptLock();lock.waitLock(20000);
  try {return customerEditApply_(payload,customerEditAccess_(payload.token),true);} finally {lock.releaseLock();}
}
// Caller holds the shared script lock and has already verified access.
function customerEditApply_(payload,access,notifyWhatsApp) {
    var old=access.values,state=customerEditState_(old);
    if(state.locked)throw new Error(state.reason);
    var teachers=customerEditTeachers_(String(old[16]));
    if(!payload.revision||payload.revision!==customerEditRevision_(old,teachers))throw new Error('تغير الطلب منذ فتح الصفحة. حدّث الصفحة وراجع البيانات قبل الحفظ.');
    var parsed=customerEditParse_(old,teachers),items,totals,plan={changes:[]},text=old[14];
    if(parsed.editable){
      if(!Array.isArray(payload.items)||payload.items.length>Object.keys(PRODUCTS).length)throw new Error('بيانات المنتجات غير صحيحة.');
      payload.items.forEach(function(i){['qty','folderQty','paperQty'].forEach(function(k){if(!Number.isInteger(Number(i[k]))||Number(i[k])<0||Number(i[k])>99)throw new Error('أعداد المنتجات يجب أن تكون أعدادًا صحيحة من 0 إلى 99.');});});
      var sanitized=sanitizeItems_(payload.items);if(!sanitized.ok||!sanitized.items.length)throw new Error(sanitized.message||'اختر منتجًا واحدًا على الأقل.');items=sanitized.items;
      plan=customerEditAjyalPlan_(teachers,payload.teachers,items,old);totals=calculateTotals_(items,cleanText_(payload.governorate,50),plan.teachers.length,parsed.totals.ajyalUnitPrice);
      text=itemsText_(items)+(totals.ajyalCount?'\nخدمة أجيال — عدد المعلمين: '+totals.ajyalCount+' — المجموع: '+totals.ajyalTotal+' د.أ':'');
    } else {
      totals=parsed.totals;
      // Custom historical prices stay intact; a governorate change uses the published delivery rate.
      if(cleanText_(payload.governorate,50)!==old[5]){totals.deliveryFee=cleanText_(payload.governorate,50)==='عمان'?2:3;totals.grandTotal=totals.productsTotal+totals.deliveryFee;}
    }
    var input={name:payload.name,phone:opsDigits_(payload.phone),altPhone:opsDigits_(payload.altPhone),governorate:payload.governorate,district:payload.district,address:payload.address,itemsText:text,itemsCount:totals.itemsCount,folderCount:totals.folderCount,paperCount:totals.paperCount,productsTotal:totals.productsTotal+(totals.ajyalTotal||0),deliveryFee:totals.deliveryFee,notes:''},normalized=adminValidateEditable_(input);
    var meta=portalStickerMeta_()[String(old[16])]||{};
    if(normalized.grandTotal<Number(meta.amountPaid||0))throw new Error('المبلغ الجديد أقل من المبلغ المدفوع. تواصل معنا لتسوية الفرق.');
    var values=[ajyalCell_(normalized.name),displayPhone_(normalized.mainPhone),normalized.altPhone?displayPhone_(normalized.altPhone):'',normalized.governorate,normalized.district,ajyalCell_(normalized.address),normalized.itemsCount,normalized.folderCount,normalized.paperCount,normalized.productsTotal,normalized.deliveryFee,normalized.grandTotal,ajyalCell_(text)];
    if(payload.whatsappNote)values.push(ajyalCell_((String(old[15]||'')+'\n[تعديل واتساب] '+cleanText_(payload.whatsappNote,1000)).slice(0,5000)));
    var range=access.sheet.getRange(access.row,3,1,values.length),backup=range.getValues(),ajyal=plan.changes.length?ajyalSheet_():null,applied=[],review=null,notification=null,previousEdited=access.tokenSheet.getRange(access.tokenRow,4).getDisplayValue();
    try {
      range.setValues([values]);
      plan.changes.forEach(function(c){c.actualRow=c.row||ajyal.getLastRow()+1;applied.push(c);ajyal.getRange(c.actualRow,1,1,12).setNumberFormat('@').setValues([c.after]);});
      SpreadsheetApp.flush();
      var after=access.sheet.getRange(access.row,1,1,17).getDisplayValues()[0];
      var editedAt=new Date().toISOString();
      review=workflowAddReview_(old,after,teachers,customerEditTeachers_(String(old[16])),editedAt);
      adminLog_('العميل','تعديل طلب بواسطة العميل',old[0],old[16],access.row,old,after);
      if(plan.changes.length)adminLog_('العميل','تعديل اشتراكات أجيال بواسطة العميل',old[0],old[16],access.row,[],['تم تحديث '+plan.changes.length+' سجل اشتراك']);
      access.tokenSheet.getRange(access.tokenRow,4).setValue(editedAt);
      if(notifyWhatsApp){notification={};customerEditQueueNotice_(old,after,editedAt,notification);}
    } catch(error) {
      if(notification&&notification.sheet&&notification.row<=notification.sheet.getLastRow())notification.sheet.deleteRow(notification.row);
      if(review)review.sheet.deleteRow(review.row);
      access.tokenSheet.getRange(access.tokenRow,4).setValue(previousEdited);
      range.setValues(backup);applied.reverse().forEach(function(c){if(c.before)ajyal.getRange(c.actualRow,1,1,12).setValues([c.before]);else ajyal.deleteRow(c.actualRow);});SpreadsheetApp.flush();throw new Error('تعذر حفظ التعديل. أعد فتح الرابط للتحقق من الطلب ثم حاول مجددًا.');
    }
    access.values=after;
    var result=customerEditView_(access);result.saved=true;return result;
}
function adminCustomerEditLink(requestId) {
  requireAdmin_();var lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    var s=adminOrdersSheet_(),r=adminFindRowByRequestId_(s,cleanId_(requestId,80),null),row=s.getRange(r,1,1,17).getDisplayValues()[0],state=customerEditState_(row);
    var token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');customerEditStoreToken_(String(row[16]),token);
    return {url:CUSTOMER_EDIT_URL_+'#token='+token,orderNumber:row[0],phone:canonicalPhone_(row[3])};
  } finally {lock.releaseLock();}
}

function customerEditCheck(token) { return customerEditState_(customerEditAccess_(token).values); }

function customerEditChanges_(){var s=customerEditSheet_(false),map={};if(s&&s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,4).getDisplayValues().forEach(function(r){if(r[3])map[r[0]]=r[3];});return map;}



// Queue in the same locked save transaction; notification failures cannot cause a
// duplicate save. Only the signed bridge can collect and acknowledge these rows.
function customerEditNoticeSheet_(create){
 var ss=SpreadsheetApp.openById(SHEET_ID),s=ss.getSheetByName('إشعارات تعديل الطلبات');
 if(!s&&create){s=ss.insertSheet('إشعارات تعديل الطلبات');s.getRange(1,1,1,7).setValues([['معرف الإشعار','واتساب العميل','معرف الطلب','رقم الطلب','الملخص','وقت التعديل','حالة الإشعار']]);s.setFrozenRows(1);}
 return s;
}
function customerEditQueueNotice_(before,after,at,receipt){
 var phone=canonicalPhone_(before[3]),sender='962'+String(phone).replace(/^0/,'');
 if(!/^9627\d{8}$/.test(sender))return null;
 var text='تم تعديل طلبك بنجاح ✅\nرقم الطلب: '+after[0]+'\n'+after[14]+'\n\nالمنتجات والخدمات: '+after[11]+' د.أ\nالتوصيل: '+after[12]+' د.أ\nالإجمالي: '+after[13]+' د.أ\nالعنوان: '+[after[5],after[6],after[7]].filter(Boolean).join('، ');
 var s=customerEditNoticeSheet_(true),r=s.getLastRow()+1;
 if(receipt){receipt.sheet=s;receipt.row=r;}
 s.getRange(r,1,1,7).setNumberFormat('@').setValues([['edit_'+Utilities.getUuid().replace(/-/g,''),sender,String(after[16]),String(after[0]),text,at,'pending']]);
 return {sheet:s,row:r};
}
function customerEditNotices_(op,d){
 var lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  var s=customerEditNoticeSheet_(false),rows=s&&s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,7).getDisplayValues():[];
  if(op==='edit_notifications_ack'){
   var ids=Array.isArray(d.ids)?d.ids.slice(0,50):[];
   rows.forEach(function(r,i){if(r[6]==='pending'&&ids.indexOf(r[0])!==-1)s.getRange(i+2,7).setValue('queued');});
   return {ok:true};
  }
  return {ok:true,events:rows.filter(function(r){return r[6]==='pending';}).slice(0,50).map(function(r){return {id:r[0],sender:r[1],targetRequestId:r[2],orderNumber:r[3],text:r[4],createdAt:r[5]};})};
 }finally{lock.releaseLock();}
}

