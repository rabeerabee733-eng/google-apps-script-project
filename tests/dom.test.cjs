const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom'),fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
(async()=>{
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.TextEncoder=TextEncoder;Object.defineProperty(w,'crypto',{value:webcrypto});
for(const script of w.document.querySelectorAll('script:not([src])'))w.eval(script.textContent);w.eval(fs.readFileSync('ajyal-booking.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const set=(g,n)=>{const c=w.document.querySelector('[data-product-id="grade'+g+'_bag"]');c.querySelector('.qty-total').value=n;c.querySelector('.qty-paper').value=n;w.calculateTotals();};set(1,3);set(2,4);set(3,2);assert.equal(w.document.querySelectorAll('.ajyal-card').length,9);assert.equal(w.AjyalBooking.fee(),0);
const cards=[...w.document.querySelectorAll('.ajyal-card')],indices=[0,1,3,4,5,7];for(const i of indices){const ch=cards[i].querySelector('input');ch.checked=true;ch.dispatchEvent(new w.Event('change'));}assert.equal(w.AjyalBooking.fee(),18);assert.equal(w.getCurrentTotals().grandTotal,108);
await assert.rejects(w.AjyalBooking.collect(),/أكمل/);
const key=await webcrypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:3072,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']),pub=await webcrypto.subtle.exportKey('jwk',key.publicKey);
const promise=w.AjyalBooking.ready();const cb=Object.keys(w).find(k=>k.startsWith('ajyalConfig_'));w[cb]({version:'ajyal-v1',ready:true,publicKey:pub,keyId:'test'});await promise;
for(const i of indices){const inputs=[...cards[i].querySelectorAll('.ajyal-fields input')];['معلم '+i,'teacher'+i,'secret-test','0791234567'].forEach((v,n)=>inputs[n].value=v);}
const rows=await w.AjyalBooking.collect();assert.equal(rows.length,6);assert(!JSON.stringify(rows).includes('secret-test'));assert.equal(rows[0].cipher.length,512);assert.equal(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'RSA-OAEP'},key.privateKey,Buffer.from(rows[0].cipher,'base64'))),'secret-test');
const ctx=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:n=>n==='AJYAL_PUBLIC_KEY'?JSON.stringify(pub):'test'})}});vm.runInContext(fs.readFileSync('apps-script/Ajyal.gs','utf8'),ctx);ctx.rows=JSON.parse(JSON.stringify(rows));ctx.items=[{productId:'grade1_bag',qty:3},{productId:'grade2_bag',qty:4},{productId:'grade3_bag',qty:2}];assert.equal(vm.runInContext('ajyalValidate_(rows,items).length',ctx),6);
for(const expr of ['[rows[0],rows[0]]','[{...rows[0],slot:99}]','[{...rows[0],password:"plain"}]','[{...rows[0],keyId:"wrong"}]','[{...rows[0],phone:"bad"}]'])assert.throws(()=>vm.runInContext('ajyalValidate_('+expr+',items)',ctx));
const ch=cards[0].querySelector('input');ch.checked=false;ch.dispatchEvent(new w.Event('change'));assert.equal(w.AjyalBooking.fee(),15);assert.equal(cards[0].querySelector('input[type=password]').value,'');
w.confirm=()=>false;set(3,0);assert.equal(w.document.querySelector('[data-product-id="grade3_bag"] .qty-total').value,'1');assert.equal(w.AjyalBooking.fee(),15);
w.confirm=()=>true;set(3,0);assert.equal(w.AjyalBooking.fee(),12);w.AjyalBooking.clearSecrets();assert([...w.document.querySelectorAll('input[type=password]')].every(x=>!x.value));assert(!JSON.stringify(w.localStorage).includes('secret-test'));
// Closed handshake must not transmit to legacy server.
const fail=w.AjyalBooking.ready();w[Object.keys(w).find(k=>k.startsWith('ajyalConfig_'))]({version:'old'});await assert.rejects(fail,/قيد التجهيز/);
console.log('PASS: grouped bag quantities, optional/required fields, 6 services = 18 JOD, total 108 before delivery, RSA encryption, invalid requests, removal/cancel, secret clearing, legacy backend blocked.');dom.window.close();
})().catch(e=>{console.error(e);process.exit(1);});
