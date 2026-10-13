const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const inputs={'.qty-total':{value:'10'},'.qty-folder':{value:'6'},'.qty-paper':{value:'4'}};
const card={dataset:{productId:'grade1_bag',splitAllowed:'true',price:'10'},querySelector:s=>inputs[s]};
const c=vm.createContext({document:{querySelectorAll:()=>[card]},getValue:()=>'',selectedAjyalCount:()=>0,calculateTotals:()=>{}});
for(const [name,end] of [['sanitizeQuantityInput','function updateProductCard'],['updateProductCard','function changeGovernorate'],['getCurrentTotals','function calculateTotals'],['collectItems','var ajyalDrafts']]){
 const start=html.indexOf('function '+name+'(');assert(start>=0);vm.runInContext(html.slice(start,html.indexOf(end,start+1)),c);
}
assert.equal(c.collectItems().length,1);assert.equal(c.getCurrentTotals().folderCount,6);
inputs['.qty-total'].value='0';assert.equal(c.collectItems().length,0);assert.equal(c.getCurrentTotals().folderCount,0);assert.equal(c.getCurrentTotals().paperCount,0);
c.updateProductCard(card,true);assert.equal(inputs['.qty-folder'].value,'0');assert.equal(inputs['.qty-paper'].value,'0');
inputs['.qty-total'].value='10';inputs['.qty-folder'].value='6';inputs['.qty-paper'].value='4';c.updateProductCard(card,false);assert.equal(c.getCurrentTotals().itemsCount,10);assert.equal(c.getCurrentTotals().folderCount,6);assert.equal(c.getCurrentTotals().paperCount,4);
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
console.log('PASS: removed products clear wrapping counts, stale zero-quantity drafts do not affect totals, positive mixed quantities remain unchanged, scripts parse.');
