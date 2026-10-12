const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const clasp=JSON.parse(fs.readFileSync('.clasp.json'));
assert.equal(clasp.rootDir,'apps-script');
assert.equal(clasp.skipSubdirectories,true);
const files=fs.readdirSync(clasp.rootDir).sort();
assert.deepEqual(files,['Admin.html','Ajyal.gs','AjyalAdmin.html','Code.gs','appsscript.json']);
const server=files.filter(f=>f.endsWith('.gs')).map(f=>fs.readFileSync(clasp.rootDir+'/'+f,'utf8')).join('\n');
const ctx=vm.createContext({});vm.runInContext(server,ctx);
const definitions=[...server.matchAll(/^function\s+(\w+)\s*\(/gm)].map(m=>m[1]);
assert.equal(definitions.length,new Set(definitions).size,'duplicate server functions');
for(const m of server.matchAll(/(?:createTemplateFromFile|createHtmlOutputFromFile)\('([^']+)'\)/g))assert(files.includes(m[1]+'.html'),'missing template '+m[1]);
const original=fs.readFileSync('apps-script/Admin.html','utf8');
for(const m of original.matchAll(/call\('([^']+)'/g))assert.equal(typeof ctx[m[1]],'function','missing admin RPC '+m[1]);
for(const file of ['Admin.html','AjyalAdmin.html']){
 const html=fs.readFileSync('apps-script/'+file,'utf8');
 for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
 assert.match(html,/ScriptApp\.getService\(\)\.getUrl\(\)/);
}

(async()=>{
 const html=fs.readFileSync('apps-script/AjyalAdmin.html','utf8');
 const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 const calls=[];let count=51;
 const mock={ajyalBootstrap:()=>({email:'operator@example.test',config:{ready:true},statuses:['بانتظار التواصل']}),ajyalList:f=>{
   calls.push(f);const page=Math.max(0,Math.min(Math.ceil(count/50)-1,f.page));
   return {page,count,total:count,completed:0,rows:[]};
 }};
 w.google={script:{run:{withSuccessHandler(success){return {withFailureHandler(fail){return new Proxy({}, {get:(_,name)=>(...args)=>{try{success(mock[name](...args));}catch(e){fail(e);}}});}};}}}};
 w.eval(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
 await new Promise(resolve=>setImmediate(resolve));
 const previous=w.document.getElementById('prev'),next=w.document.getElementById('next');
 assert.equal(previous.disabled,true);assert.equal(next.disabled,false);
 await next.onclick();assert.equal(next.disabled,true);assert.equal(previous.disabled,false);
 await previous.onclick();assert.equal(previous.disabled,true);assert.equal(next.disabled,false);
 count=0;await w.document.getElementById('refresh').onclick();assert.equal(previous.disabled,true);assert.equal(next.disabled,true);
 assert(calls.every(f=>f.page>=0));
 dom.window.close();
 console.log('PASS: complete isolated Apps Script package, no duplicate functions, legacy admin RPCs, templates, navigation and pagination boundaries.');
})().catch(e=>{console.error(e);process.exit(1);});
