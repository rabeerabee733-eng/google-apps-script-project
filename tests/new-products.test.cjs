const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const props={},c=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v})}});
vm.runInContext(fs.readFileSync('ProductCatalog.gs','utf8')+'\n'+fs.readFileSync('الرمز.js','utf8'),c);
const ids=['monthly_tests_grade1','monthly_tests_grade2','monthly_tests_grade3','english_preparation','kindergarten_preparation'];
assert.equal(Object.keys(c.PRODUCTS).length,15);
assert.deepEqual(Array.from(Object.keys(c.PRODUCTS).slice(0,6)),['grade1_bag','grade2_bag','grade3_bag',...ids.slice(0,3)]);
const raw=ids.map(productId=>({productId,qty:1,folderQty:0,paperQty:1,price:0.01})),clean=c.sanitizeItems_(raw);assert.equal(clean.ok,true);
assert.deepEqual(Array.from(clean.items,x=>x.price),[3,3,3,6,6]);assert.ok(clean.items.every(x=>x.paperQty===1&&x.folderQty===0));
const totals=c.calculateTotals_(clean.items,'عمان',0);assert.equal(totals.productsTotal,21);assert.equal(totals.grandTotal,23);assert.equal(c.calculateTotals_(clean.items,'إربد',0).grandTotal,24);
for(const id of ids)assert.ok(c.itemsText_(clean.items).includes(c.PRODUCTS[id].name));
assert.equal(c.normalizeAjyal_({enabled:false},clean.items).length,0);assert.throws(()=>c.normalizeAjyal_({enabled:true,teachers:[{teacherName:'معلمة',grade:'صف أول',phone:'0790000000'}]},clean.items));
assert.equal(c.sanitizeItems_([...raw,raw[0]]).ok,false);assert.equal(c.sanitizeItems_([{productId:'invented',qty:1}]).ok,false);
c.PRODUCTS.monthly_tests_grade1.soldOut=true;assert.equal(c.sanitizeItems_(raw).ok,false);c.PRODUCTS.monthly_tests_grade1.soldOut=false;
props.PRODUCT_V1_english_preparation=JSON.stringify({price:8,soldOut:false,description:'وصف الإدارة',aliases:['تحضير انجليزي']});c.PRODUCTS=c.catalogApply_(c.PRODUCTS);assert.equal(c.PRODUCTS.english_preparation.price,8);assert.match(c.PRODUCTS.english_preparation.description,/2026\/2027/);
const once=c.PRODUCTS.english_preparation.description;c.catalogApply_(c.PRODUCTS);assert.equal(c.PRODUCTS.english_preparation.description,once);
const html=fs.readFileSync('index.html','utf8');for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
assert.ok(html.indexOf('id="category-bags"')<html.indexOf('id="category-monthly"'));assert.ok(html.indexOf('id="category-monthly"')<html.indexOf('id="category-prep"'));
for(const id of ids)assert.equal([...html.matchAll(new RegExp('<div class="product-card" data-product-id="'+id+'"','g'))].length,1);
for(const productId of ids.slice(3)){
 const paper=c.sanitizeItems_([{productId,qty:2,folderQty:0,paperQty:2}]),bound=c.sanitizeItems_([{productId,qty:2,folderQty:2,paperQty:0}]),mixed=c.sanitizeItems_([{productId,qty:2,folderQty:1,paperQty:1}]);
 for(const result of [paper,bound,mixed]){assert(result.ok);assert.equal(c.calculateTotals_(result.items,'عمان',0).productsTotal,c.PRODUCTS[productId].price*2);}
 assert.equal(c.sanitizeItems_([{productId,qty:2,folderQty:0,paperQty:0}]).ok,false);assert.equal(c.sanitizeItems_([{productId,qty:2,folderQty:2,paperQty:1}]).ok,false);
}
console.log('PASS: five live SKUs, trusted totals 21 + delivery, independent Ajyal, duplicate/sold-out validation, retained admin overrides, seasonal data, all frontend scripts and category order.');
