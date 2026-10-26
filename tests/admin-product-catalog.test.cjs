const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('Admin.html','utf8');
const server=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})}});
vm.runInContext(fs.readFileSync('ProductCatalog.gs','utf8')+'\n'+fs.readFileSync('الرمز.js','utf8'),server);
const config={products:Object.entries(server.PRODUCTS).map(([key,p])=>({key,...p}))};
const ids=['monthly_tests_grade1','monthly_tests_grade2','monthly_tests_grade3','english_preparation','kindergarten_preparation'];
const nodes={},rows=[];let message='';
for(const id of ['itemsCount','folderCount','paperCount','productsTotal','deliveryFee','grandTotal','itemsText'])nodes[id]={value:id==='deliveryFee'?'2':''};
function row(id,qty=1,folder=0,paper=0){const controls={'.admin-product-select':{value:id},'.admin-product-qty':{value:qty},'.admin-product-folder':{value:folder},'.admin-product-paper':{value:paper}};return{querySelector:s=>controls[s]};}
const c=vm.createContext({config,$:id=>nodes[id]||null,document:{querySelectorAll:()=>rows},statusMsg:m=>message=m});
for(const name of ['adminProducts','calculateGrand','syncAdminProductSummary','validateAdminProductRows','setAdminProductMode']){
 const line=html.split('\n').find(l=>l.trim().startsWith('function '+name+'('));assert(line,name);vm.runInContext(line,c);
}
assert.deepEqual(Array.from(c.adminProducts(),p=>p.id),Object.keys(server.PRODUCTS));
ids.forEach(id=>rows.push(row(id)));
assert.equal(c.validateAdminProductRows(),true);assert.equal(nodes.productsTotal.value,'21.00');assert.equal(nodes.grandTotal.value,'23.00');
assert.equal(nodes.itemsCount.value,5);assert.equal(nodes.paperCount.value,5);assert.equal(nodes.folderCount.value,0);
assert.equal(nodes.itemsText.value.split('\n').length,5);
for(const id of ids)assert(nodes.itemsText.value.includes(server.PRODUCTS[id].name));
// The admin summary remains consumable by the actual sticker validator.
const sheetRow=[];sheetRow[1]='51';sheetRow[8]=5;sheetRow[9]=0;sheetRow[10]=5;sheetRow[14]=nodes.itemsText.value;
const stickerFn=Object.keys(server).find(k=>typeof server[k]==='function'&&String(server[k]).includes('تفاصيل المنتجات لا تطابق أعمدة'));
assert(stickerFn);assert.deepEqual(JSON.parse(JSON.stringify(server[stickerFn](sheetRow))),{itemsCount:5,folderCount:0,paperCount:5});
// Catalog updates are read from the shared bootstrap, without stale hardcoded prices.
config.products.find(p=>p.key==='english_preparation').price=8;c.syncAdminProductSummary();assert.equal(nodes.productsTotal.value,'23.00');
config.products.find(p=>p.key===ids[0]).soldOut=true;assert.equal(c.validateAdminProductRows(),false);assert.match(message,/متاح/);
config.products.find(p=>p.key===ids[0]).soldOut=false;
rows.splice(0,rows.length,row('grade1_bag',2,1,1));assert.equal(c.validateAdminProductRows(),true);assert.equal(nodes.folderCount.value,1);assert.equal(nodes.paperCount.value,1);
rows[0]=row('grade1_bag',2,2,1);assert.equal(c.validateAdminProductRows(),false);
rows[0]=row(ids[0],1.5);assert.equal(c.validateAdminProductRows(),false);
rows[0]=row('invented',1);assert.equal(c.validateAdminProductRows(),false);
rows.length=0;assert.equal(c.validateAdminProductRows(),false);
// Execute the actual field regrouping step: removing the old grid must retain the picker.
const groupedLine=html.split('\n').find(l=>l.includes("[['بيانات الطلب',")&&l.includes('grid.remove()'));assert(groupedLine);
const fieldIds=[...groupedLine.matchAll(/'([A-Za-z][A-Za-z0-9]+)'/g)].map(m=>m[1]).filter(id=>id!=='grid');
const remaining=new Set(fieldIds);remaining.add('adminProductPicker');
const fields={};for(const id of remaining)fields[id]={id,closest(){return this;},querySelector(){return {}}};
const groupContext=vm.createContext({el:id=>fields[id],grid:{before(){},remove(){for(const id of remaining)delete fields[id];}},document:{createElement:()=>({append(...els){for(const el of els)if(el?.id)remaining.delete(el.id)}})}});
vm.runInContext(groupedLine,groupContext);assert(fields.adminProductPicker,'product picker was removed by regrouping');
nodes.adminProductPicker=fields.adminProductPicker;nodes.adminProductRows={innerHTML:''};c.addAdminProductRow=()=>{};c.setAdminProductMode('create');assert.equal(nodes.adminProductPicker.hidden,false);c.setAdminProductMode('edit');assert.equal(nodes.adminProductPicker.hidden,true);
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1].replace(/<\?[\s\S]*?\?>/g,'false'));
console.log('PASS: admin picker survives layout, all 15 canonical products, five new products total 21 + 2, paper/sticker agreement, live prices, unavailable and invalid quantities rejected, existing split preserved.');
