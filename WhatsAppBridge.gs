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
    if(request.op==='catalog')return waJSON_({ok:true,products:PRODUCTS,districts:DISTRICTS,delivery:{amman:2,other:3}});
    if(request.op==='customer_orders')return waJSON_(waLookupOrders_(d));
    if(['customer_status','customer_edit_link','customer_orders','agent_report'].indexOf(request.op)!==-1)return waJSON_(waCustomerService_(request.op,d,p));
    if(request.op==='quote'){
      if(!/^wa_[a-f0-9]{32}$/.test(d.requestId||''))return waJSON_(waFail_('INVALID_REQUEST_ID'));
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
  if(op==='customer_status')return {ok:true,orderNumber:row[0],status:(meta[row[16]]||{}).status||'جديد',total:numberFromDisplay_(row[13]),locked:state.locked};
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
  return {ok:true,source:'main_read_only',orders:found.slice(-100).reverse().map(function(r){var m=metadata[String(r[16])];return {orderNumber:String(r[0]),date:String(r[1]),name:String(r[2]),governorate:String(r[5]),district:String(r[6]),address:String(r[7]),quantity:numberFromDisplay_(r[8]),productsTotal:numberFromDisplay_(r[11]),deliveryFee:numberFromDisplay_(r[12]),total:numberFromDisplay_(r[13]),items:String(r[14]),notes:String(r[15]),status:m?String(m[2]):null,paymentStatus:m?String(m[3]):null,amountPaid:m?numberFromDisplay_(m[4]):null,deliveryOutAt:m?String(m[6]):null,deliveredAt:m?String(m[7]):null,locked:null};}),totalMatches:found.length,asOf:new Date().toISOString()};
}
