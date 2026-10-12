const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const http=require('node:http');const path=require('node:path');
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.join(process.cwd(),req.url==='/'?'index.html':req.url);try{res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':'text/html');res.end(fs.readFileSync(f));}catch(e){res.statusCode=404;res.end();}}).listen(0,'127.0.0.1');
 const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.AjyalBooking);
 for(const [g,n] of [[1,3],[2,4],[3,2]]){await page.locator('[data-product-id="grade'+g+'_bag"] .qty-total').fill(String(n));await page.locator('[data-product-id="grade'+g+'_bag"] .qty-paper').fill(String(n));}
 assert.equal(await page.locator('.ajyal-card').count(),9);assert.equal(await page.evaluate(()=>AjyalBooking.fee()),0);
 const indices=[0,1,3,4,5,7];for(const i of indices)await page.locator('.ajyal-toggle input').nth(i).check();
 assert.equal(await page.evaluate(()=>AjyalBooking.fee()),18);assert.equal(await page.evaluate(()=>getCurrentTotals().grandTotal),108);
 assert.match(await page.evaluate(async()=>{try{await AjyalBooking.collect();return '';}catch(e){return e.message;}}),/أكمل/);
 const keys=await page.evaluate(async()=>{const k=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:3072,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);window.testKey=k.privateKey;return crypto.subtle.exportKey('jwk',k.publicKey);});
 await page.route('https://script.google.com/**',route=>{const u=new URL(route.request().url()),cb=u.searchParams.get('callback');route.fulfill({contentType:'application/javascript',body:cb+'('+JSON.stringify({version:'ajyal-v1',ready:true,publicKey:keys,keyId:'test-key'})+');'});});
 await page.evaluate(()=>AjyalBooking.ready());
 for(const i of indices){const c=page.locator('.ajyal-card').nth(i);await c.locator('input[type=text]').nth(0).fill('معلم اختبار '+i);await c.locator('input[type=text]').nth(1).fill('teacher'+i);await c.locator('input[type=password]').fill('secret-test');await c.locator('input[type=tel]').fill('0791234567');}
 const rows=await page.evaluate(()=>AjyalBooking.collect());assert.equal(rows.length,6);assert.equal(JSON.stringify(rows).includes('secret-test'),false);assert.equal(rows[0].cipher.length,512);
 assert.equal(await page.evaluate(async(r)=>new TextDecoder().decode(await crypto.subtle.decrypt({name:'RSA-OAEP'},testKey,Uint8Array.from(atob(r.cipher),c=>c.charCodeAt(0)))),rows[0]),'secret-test');
 assert.equal(await page.evaluate(()=>Object.values(localStorage).some(x=>x.includes('secret-test'))),false);
 await page.locator('.ajyal-toggle input').nth(0).uncheck();assert.equal(await page.evaluate(()=>AjyalBooking.fee()),15);
 assert.equal(await page.locator('.ajyal-card').nth(0).locator('input[type=password]').inputValue(),'');
 await page.screenshot({path:'/tmp/ajyal-booking-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 // Server validation must reject tampered price/quantity, duplicates and plaintext credentials.
 const ctx=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:n=>n==='AJYAL_PUBLIC_KEY'?JSON.stringify(keys):'test-key'})}});vm.runInContext(fs.readFileSync('apps-script/Ajyal.gs','utf8'),ctx);ctx.rows=rows;ctx.items=[{productId:'grade1_bag',qty:3},{productId:'grade2_bag',qty:4},{productId:'grade3_bag',qty:2}];assert.equal(vm.runInContext('ajyalValidate_(rows,items).length',ctx),6);
 assert.throws(()=>vm.runInContext('ajyalValidate_([rows[0],rows[0]],items)',ctx));assert.throws(()=>vm.runInContext('ajyalValidate_([{...rows[0],slot:99}],items)',ctx));assert.throws(()=>vm.runInContext('ajyalValidate_([{...rows[0],password:"plain"}],items)',ctx));
 const admin=fs.readFileSync('apps-script/AjyalAdmin.html','utf8');new vm.Script(admin.match(/<script>([\s\S]*?)<\/script>/)[1]);new vm.Script(fs.readFileSync('apps-script/Code.gs','utf8'));console.log('PASS: 9 bag slots, 6 services / 18 JOD, optional and required fields, RSA encryption roundtrip, no plaintext storage, mobile overflow, server tampering checks, syntax.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
