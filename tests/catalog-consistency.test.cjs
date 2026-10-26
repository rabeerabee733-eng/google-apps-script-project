const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),backend=fs.readFileSync('الرمز.js','utf8');
function products(source){const start=source.indexOf('var PRODUCTS ='),end=source.indexOf('var DISTRICTS =',start);const ctx={};vm.runInNewContext(fs.readFileSync("ProductCatalog.gs","utf8"),ctx);vm.runInNewContext(source.slice(start,end),ctx);return Array.isArray(ctx.PRODUCTS)?Object.fromEntries(ctx.PRODUCTS.map(p=>[p.id,p])):ctx.PRODUCTS;}
const front=products(html),back=products(backend),cards=[...html.matchAll(/class="product-card" data-product-id="([^"]+)" data-price="([^"]+)" data-split-allowed="([^"]+)" data-paper-only="([^"]+)"/g)];
assert.deepEqual(Object.keys(front).sort(),Object.keys(back).sort());
assert.equal(cards.length,Object.keys(front).length);assert.equal(new Set(cards.map(c=>c[1])).size,cards.length);
for(const [,id,price,split,paper] of cards){assert(front[id]);assert.equal(front[id].name,back[id].name);assert.equal(+price,front[id].price);assert.equal(+price,back[id].price);assert.equal(split,String(back[id].splitAllowed));assert.equal(paper,String(back[id].paperOnly));assert.equal(Boolean(front[id].soldOut),Boolean(back[id].soldOut));}
assert.equal(front.number_cards.name,'بطاقات الأعداد');assert.equal(front.number_cards.price,10);
const input={value:'2'},card={dataset:{productId:'number_cards',price:'10',splitAllowed:'false',paperOnly:'false'},querySelector:s=>s==='.qty-total'?input:null};
const ctx={document:{querySelectorAll:()=>[card]},getValue:id=>id==='governorate'?'عمان':'',selectedAjyalCount:()=>0};
for(const [name,end] of [['getCurrentTotals','function calculateTotals'],['collectItems','var ajyalDrafts']]){let start=html.indexOf('function '+name+'(');vm.runInNewContext(html.slice(start,html.indexOf(end,start+1)),ctx);}
assert.equal(ctx.collectItems()[0].productId,'number_cards');assert.equal(ctx.collectItems()[0].qty,2);assert.equal(ctx.getCurrentTotals().productsTotal,20);assert.equal(ctx.getCurrentTotals().grandTotal,22);
console.log('PASS: every booking product matches the server catalog; two number-card sets total 20 + 2 delivery; no order submitted.');
