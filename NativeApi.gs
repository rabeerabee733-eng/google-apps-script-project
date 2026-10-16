/* Native app transport. No token is accepted from a URL. All RPCs retain the
 * portal allowlist and server-side permissions. Pairing needs an authenticated
 * Google manager on the manager deployment; the employee endpoint cannot approve.
 */
function mobileJson_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function mobileRandom_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');}
function mobilePairKey_(id){return 'mobile-pair:'+portalDigest_(id);}
function mobilePairRead_(id){
  if(!/^[a-f0-9]{64}$/.test(String(id||'')))throw Error('رمز ربط غير صحيح.');
  var p=JSON.parse(CacheService.getScriptCache().get(mobilePairKey_(id))||'null');
  if(!p||p.expires<Date.now())throw Error('انتهت مهلة الربط. ابدأ من التطبيق مجددًا.');return p;
}
function mobilePairStart_(){
  var id=mobileRandom_(),secret=mobileRandom_(),p={secretHash:portalDigest_(secret),expires:Date.now()+300000,code:mobileRandom_().slice(0,8).toUpperCase()};
  CacheService.getScriptCache().put(mobilePairKey_(id),JSON.stringify(p),300);
  return {id:id,secret:secret,code:p.code,expires:p.expires};
}
function mobilePairPage_(id){
  var auth=adminAuth_();if(!auth.ok)throw Error('افتح الرابط بحساب Google المخوّل للإدارة.');
  var p=mobilePairRead_(id),template=HtmlService.createTemplateFromFile('NativePair');
  template.pairId=id;template.code=p.code;template.email=auth.email;
  return template.evaluate().setTitle('ربط تطبيق التحضير الإلكتروني').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function mobilePairApprove(id){
  // Never infer administrator authority from an employee session or POST body.
  var email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!email||ADMIN_EMAILS.indexOf(email)===-1)throw Error('هذا الحساب غير مخوّل للإدارة.');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{var p=mobilePairRead_(id);if(p.email&&p.email!==email)throw Error('تم استخدام طلب الربط.');p.email=email;
    CacheService.getScriptCache().put(mobilePairKey_(id),JSON.stringify(p),Math.max(1,Math.floor((p.expires-Date.now())/1000)));return {ok:true};
  }finally{lock.releaseLock();}
}
function mobileManagerIdentity_(token){
  var p=JSON.parse(CacheService.getScriptCache().get('mobile-session:'+portalDigest_(String(token)))||'null');
  if(!p||p.expires<Date.now()||ADMIN_EMAILS.indexOf(p.email)===-1||p.epoch!==(PropertiesService.getScriptProperties().getProperty('MOBILE_SESSION_EPOCH')||''))throw Error('انتهت جلسة المدير. أعد ربط التطبيق.');
  return {native:true,mobileManager:true,email:p.email,employee:'المدير',permissions:PORTAL_PERMISSIONS_.slice()};
}
function mobileRevokeAllSessions(){
  var email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!email||ADMIN_EMAILS.indexOf(email)===-1)throw Error('هذه العملية للمدير فقط.');
  PropertiesService.getScriptProperties().setProperty('MOBILE_SESSION_EPOCH',mobileRandom_());return {ok:true};
}
function mobilePairFinish_(body){
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{var p=mobilePairRead_(body.id);
    if(!portalEqual_(portalDigest_(String(body.secret||'')),p.secretHash))throw Error('رمز ربط غير صحيح.');
    if(!p.email)return {pending:true};
    if(ADMIN_EMAILS.indexOf(p.email)===-1)throw Error('الحساب لم يعد مخوّلًا.');
    // Return the same short-lived result after a lost response; never create duplicate sessions.
    if(!p.token){p.token='mob_'+mobileRandom_();CacheService.getScriptCache().put('mobile-session:'+portalDigest_(p.token),JSON.stringify({email:p.email,expires:Date.now()+21600000,epoch:PropertiesService.getScriptProperties().getProperty('MOBILE_SESSION_EPOCH')||''}),21600);
      CacheService.getScriptCache().put(mobilePairKey_(body.id),JSON.stringify(p),Math.max(1,Math.floor((p.expires-Date.now())/1000)));}
    return {token:p.token,user:mobileManagerIdentity_(p.token)};
  }finally{lock.releaseLock();}
}
function mobilePost_(e){
  try{
    var raw=String(e.parameter.data||'');if(!raw||raw.length>64000)throw Error('حجم الطلب غير مسموح.');
    var b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b)||b.v!==1)throw Error('إصدار طلب غير مدعوم.');
    var result;
    if(b.action==='login')result=adminPortalLogin({username:b.username,password:b.password});
    else if(b.action==='pairStart')result=mobilePairStart_();
    else if(b.action==='pairFinish')result=mobilePairFinish_(b);
    else {
      if(typeof b.token!=='string'||b.token.length<32||b.token.length>200)throw Error('سجل الدخول أولًا.');
      if(b.action==='logout'){CacheService.getScriptCache().remove('mobile-session:'+portalDigest_(b.token));result=adminPortalLogout(b.token);}
      else if(b.action==='session')result=adminPortalSession(b.token,true);
      else if(b.action==='rpc'){
        if(typeof b.method!=='string'||!Array.isArray(b.args)||b.args.length>3)throw Error('طلب غير صحيح.');
        result=adminPortalRpc(b.token,b.method,b.args);
      }else throw Error('عملية غير مسموحة.');
    }
    return mobileJson_({ok:true,data:result});
  }catch(error){return mobileJson_({ok:false,error:String(error.message||'تعذر إتمام العملية.').slice(0,300)});}
}
