const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const root=path.join(__dirname,'..'),props={},cache={},state={email:''};
 const bytes=b=>Array.from(b,n=>n>127?n-256:n),buffer=a=>Buffer.from(a.map(n=>n&255));
 const c=vm.createContext({console});
 c.Session={getActiveUser:()=>({getEmail:()=>state.email})};
 c.PropertiesService={getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v})};
 c.CacheService={getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})};
 c.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};
 c.ContentService={MimeType:{JSON:'json'},createTextOutput:value=>({value,setMimeType(){return this;}})};
 c.Utilities={getUuid:()=>crypto.randomUUID(),newBlob:s=>({getBytes:()=>bytes(Buffer.from(s))}),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(alg,s)=>bytes(crypto.createHash(alg).update(s).digest()),computeHmacSha256Signature:(data,key)=>bytes(crypto.createHmac('sha256',buffer(key)).update(buffer(data)).digest()),base64EncodeWebSafe:a=>buffer(a).toString('base64url')};
 for(const name of ['الرمز.js','PortalAuth.gs','Operations.gs','Barcode.gs','CustomerEdit.gs','Workflow.gs','Finance.gs','NativeApi.gs'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),c);
 const post=b=>JSON.parse(c.doPost({parameter:{mobile:'1',data:JSON.stringify({v:1,...b})}}).value);
 const pair=()=>{const p=post({action:'pairStart'}).data;state.email=c.ADMIN_EMAILS[0];c.mobilePairApprove(p.id);state.email='';return {p,session:post({action:'pairFinish',id:p.id,secret:p.secret}).data};};
 return {c,cache,props,state,post,pair};
}
test('transport rejects malformed, oversized, unsupported and anonymous RPC requests',()=>{
 const {c,post}=setup();for(const b of [{action:'rpc',method:'adminBootstrap',args:[]},{v:2,action:'pairStart'},{action:'__proto__'},{action:'rpc',token:'x'.repeat(250),args:[]}])assert.equal(post(b).ok,false);
 assert.equal(JSON.parse(c.mobilePost_({parameter:{data:'{bad'}}).value).ok,false);
 assert.equal(post({action:'login',password:'x'.repeat(65000)}).ok,false);
});
test('pairing requires actual Google admin and both secret and approval',()=>{
 const {c,state,post}=setup(),p=post({action:'pairStart'}).data;
 assert.equal(p.id.length,64);assert.notEqual(p.id,p.secret);
 assert.throws(()=>c.mobilePairApprove(p.id),/مخوّل/);state.email='attacker@example.com';assert.throws(()=>c.mobilePairApprove(p.id),/مخوّل/);
 assert.equal(post({action:'pairFinish',id:p.id,secret:'wrong'}).ok,false);
 assert.equal(post({action:'pairFinish',id:p.id,secret:p.secret}).data.pending,true);
 state.email=c.ADMIN_EMAILS[0];c.mobilePairApprove(p.id);state.email='';
 const result=post({action:'pairFinish',id:p.id,secret:p.secret});assert(result.ok);assert(result.data.user.native);assert.match(result.data.token,/^mob_/);
 assert.equal(post({action:'pairFinish',id:p.id,secret:p.secret}).data.token,result.data.token);
});
test('manager token activates admin checks only inside whitelisted RPC and cleans up after failure',()=>{
 const {c,post,pair}=setup(),{session}=pair();
 assert.equal(c.adminAuth_().ok,false);
 c.adminFinanceList=()=>{assert.equal(c.opsManager_().email,c.ADMIN_EMAILS[0]);return {rows:[]};};
 assert.equal(post({action:'rpc',token:session.token,method:'adminFinanceList',args:[{kind:'payroll'}]}).ok,true);assert.equal(c.portalContext_,null);assert.equal(c.adminAuth_().ok,false);
 c.adminFinanceList=()=>{throw Error('intentional');};assert.equal(post({action:'rpc',token:session.token,method:'adminFinanceList',args:[]}).ok,false);assert.equal(c.portalContext_,null);
 for(const method of ['eval','mobilePairApprove','adminPortalSaveAccount','constructor','__proto__'])assert.equal(post({action:'rpc',token:session.token,method,args:[]}).ok,false);
});
test('expired pairing/session, logout, revocation and removed administrator fail closed',()=>{
 const {c,post,pair,cache,state}=setup();let {p,session}=pair();
 let record=JSON.parse(cache[c.mobilePairKey_(p.id)]);record.expires=0;cache[c.mobilePairKey_(p.id)]=JSON.stringify(record);assert.equal(post({action:'pairFinish',id:p.id,secret:p.secret}).ok,false);
 assert(post({action:'session',token:session.token}).ok);assert(post({action:'logout',token:session.token}).ok);assert.equal(post({action:'session',token:session.token}).ok,false);
 session=pair().session;state.email=c.ADMIN_EMAILS[0];c.mobileRevokeAllSessions();state.email='';assert.equal(post({action:'session',token:session.token}).ok,false);
 session=pair().session;const key='mobile-session:'+c.portalDigest_(session.token),r=JSON.parse(cache[key]);r.expires=0;cache[key]=JSON.stringify(r);assert.equal(post({action:'session',token:session.token}).ok,false);
 session=pair().session;c.ADMIN_EMAILS=[];assert.equal(post({action:'session',token:session.token}).ok,false);
});
test('employee login retains permissions; payload cannot elevate, revoked account immediately denied',()=>{
 const {c,post,props,state}=setup();state.email=c.ADMIN_EMAILS[0];const account=c.adminPortalSaveAccount({username:'nativeworker',employee:c.AJYAL_EMPLOYEES[0],password:'password-12345',permissions:['ordersRead'],active:true})[0];state.email='';
 const login=post({action:'login',username:'nativeworker',password:'password-12345'});assert(login.ok);const token=login.data.token;
 assert.equal(post({action:'rpc',token,method:'adminFinanceList',args:[{}],native:true,mobileManager:true}).ok,false);
 c.adminListOrders=()=>({rows:[]});assert.equal(post({action:'rpc',token,method:'adminListOrders',args:[{}]}).ok,true);
 assert.equal(post({action:'rpc',token,method:'adminListOrders',args:[1,2,3,4]}).ok,false);
 const accounts=JSON.parse(props.ADMIN_PORTAL_ACCOUNTS_V1);accounts[0].active=false;props.ADMIN_PORTAL_ACCOUNTS_V1=JSON.stringify(accounts);assert.equal(post({action:'session',token}).ok,false);
});
