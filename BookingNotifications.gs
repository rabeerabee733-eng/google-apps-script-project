// Stable request identifiers, not row numbers, prevent duplicate booking notices.
function bookingNoticeSheet_(){
 var ss=SpreadsheetApp.openById(SHEET_ID),s=ss.getSheetByName('إشعارات الحجوزات');
 if(!s){s=ss.insertSheet('إشعارات الحجوزات');s.getRange(1,1,1,9).setValues([['معرف الإشعار','واتساب العميل','معرف الطلب','رقم الطلب','بيانات الإشعار','الحالة','وقت الإنشاء','آخر تحديث','معرف رسالة واتساب']]);s.setFrozenRows(1);}
 return s;
}
function bookingNoticeRows_(s){return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,9).getDisplayValues():[];}
function bookingNoticeId_(id){return 'booking_'+Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(id)).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function bookingNoticeOrderRows_(){var s=adminOrdersSheet_();return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,17).getDisplayValues():[];}
function bookingNoticeData_(r,url){return {name:String(r[2]),itemsText:String(r[14]),productsTotal:numberFromDisplay_(r[11]),deliveryFee:numberFromDisplay_(r[12]),total:numberFromDisplay_(r[13]),editUrl:url||''};}
// canonicalPhone_ returns nine national digits (7xxxxxxxx), without the trunk zero.
function bookingNoticeValid_(r){return !!r[16]&&!!r[2]&&!!r[14]&&/^7\d{8}$/.test(canonicalPhone_(r[3]))&&numberFromDisplay_(r[13])>0;}
function bookingNoticeRecord_(r,status,url){var at=new Date().toISOString();return [bookingNoticeId_(r[16]),'962'+canonicalPhone_(r[3]),String(r[16]),String(r[0]),JSON.stringify(bookingNoticeData_(r,url)),status,at,at,''];}
// Called while saveOrder_ already owns the script lock. Keep the form's original link valid.
function bookingNoticeQueue_(data){
 var s=bookingNoticeSheet_(),rows=bookingNoticeOrderRows_().filter(function(r){return r[16]===data.requestId;});
 if(rows.length!==1||!bookingNoticeValid_(rows[0]))return;
 if(bookingNoticeRows_(s).some(function(r){return r[2]===data.requestId;}))return;
 var token=String(data.customerEditToken||'');
 var url=/^[a-f0-9]{64}$/.test(token)?CUSTOMER_EDIT_URL_+'#token='+token:'';
 s.getRange(s.getLastRow()+1,1,1,9).setNumberFormat('@').setValues([bookingNoticeRecord_(rows[0],'pending',url)]);
}
function bookingNotifications_(op,d){
 var lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  var s=bookingNoticeSheet_(),notices=bookingNoticeRows_(s),props=PropertiesService.getScriptProperties();
  if(op==='booking_notifications'){
   var initialized=props.getProperty('BOOKING_NOTICES_INITIALIZED')==='true',known={},count={},orders=bookingNoticeOrderRows_(),added=[];
   notices.forEach(function(r){known[r[2]]=true;});orders.forEach(function(r){if(r[16])count[r[16]]=(count[r[16]]||0)+1;});
   orders.forEach(function(r){if(bookingNoticeValid_(r)&&count[r[16]]===1&&!known[r[16]]){added.push(bookingNoticeRecord_(r,initialized?'pending':'baseline',''));known[r[16]]=true;}});
   if(added.length){s.getRange(s.getLastRow()+1,1,added.length,9).setNumberFormat('@').setValues(added);notices=notices.concat(added);}
   props.setProperty('BOOKING_NOTICES_INITIALIZED','true');
   return {ok:true,initialized:true,events:notices.filter(function(r){return r[5]==='pending';}).slice(0,50).map(function(r){return {id:r[0],sender:r[1],targetRequestId:r[2],orderNumber:r[3],createdAt:r[6],name:JSON.parse(r[4]).name};})};
  }
  if(op==='booking_notifications_ack'){
   var ids=Array.isArray(d.ids)?d.ids.slice(0,50):[];notices.forEach(function(r,i){if(r[5]==='pending'&&ids.indexOf(r[0])!==-1)s.getRange(i+2,6).setValue('queued');});return {ok:true};
  }
  var matches=notices.map(function(r,i){return {values:r,row:i+2};}).filter(function(x){return x.values[0]===d.id;});
  if(matches.length!==1)return waFail_('NOT_FOUND');var notice=matches[0],n=notice.values;
  if(op==='booking_notifications_status'){
   if(['sent','sent_by_agent','send_uncertain','failed','obsolete','waiting_template','queued','delivered','read'].indexOf(d.status)===-1)return waFail_('INVALID_STATUS');
   if(n[5]==='obsolete'||n[5]==='read'||n[5]==='delivered'&&d.status!=='read')return {ok:true};
   if(['sent','sent_by_agent'].indexOf(n[5])!==-1&&['delivered','read','failed'].indexOf(d.status)===-1)return {ok:true};
   s.getRange(notice.row,6).setValue(d.status);s.getRange(notice.row,8,1,2).setValues([[new Date().toISOString(),String(d.outboundId||'').slice(0,300)]]);return {ok:true};
  }
  if(op!=='booking_notification_details')return waFail_('UNKNOWN_OPERATION');
  if(d.sender!==n[1]||d.targetRequestId!==n[2])return waFail_('NOT_FOUND');
  var found=bookingNoticeOrderRows_().filter(function(r){return r[16]===n[2];});
  if(found.length!==1||'962'+canonicalPhone_(found[0][3])!==d.sender)return waFail_('NOT_FOUND');
  var order=found[0],state=customerEditState_(order);if(state.status==='ملغي')return waFail_('NOT_FOUND');
  var previous=JSON.parse(n[4]),url=previous.editUrl||'',token=url.split('#token=')[1]||'';
  {
   var links=customerEditSheet_(false),linkRow=customerEditFind_(links,1,n[2]);
   if(!/^[a-f0-9]{64}$/.test(token)||!linkRow||links.getRange(linkRow,2).getDisplayValue()!==portalDigest_(token)){
    token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');customerEditStoreToken_(n[2],token);url=CUSTOMER_EDIT_URL_+'#token='+token;
   }
  }
  var details=bookingNoticeData_(order,url);s.getRange(notice.row,4,1,2).setValues([[String(order[0]),JSON.stringify(details)]]);
  return {ok:true,id:n[0],sender:n[1],targetRequestId:n[2],orderNumber:String(order[0]),name:details.name,itemsText:details.itemsText,productsTotal:details.productsTotal,deliveryFee:details.deliveryFee,total:details.total,editUrl:details.editUrl};
 }finally{lock.releaseLock();}
}

