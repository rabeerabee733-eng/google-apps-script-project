const fs=require('fs'),vm=require('vm'),assert=require('assert');
const script=fs.readFileSync('AdminPortal.html','utf8').split('<script>')[1].split('</script>')[0];
const nodes={},node=id=>nodes[id]||(nodes[id]={value:'',checked:false,disabled:false,textContent:'',dataset:{},showModal(){this.open=true;}});
node('stickerDeliveryDate').value='2026-11-02';node('stickerFrom').value='803';node('stickerTo').value='803';node('stickerSort').value='sheet';
let resolveSettings,resolvePdf,rpcCalls=[],downloads=[];
const c=vm.createContext({console,config:{},identity:{native:true},preview:[],previewBusy:false,printBusy:false,previewAnchor:null,crypto:{randomUUID:()=> 'test'},Date,
 $:node,allowed:()=>true,clearStatus(){},statusMsg(){},createStickerArticles:async()=>['<article/>'],
 rpc:async(name,args)=>{rpcCalls.push({name,args});if(name==='adminStickerSettings')return new Promise(r=>resolveSettings=r);if(name==='adminStickerOrders')return{total:1,rows:[{stickerKey:'k803',stickerRevision:'rev803'}]};return{};},
 buildPreviewPdf:job=>new Promise(r=>resolvePdf=r),refreshStickerPanel:async()=>{},loadDashboard(){},
 URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},document:{getElementById:node,body:{append(){}},createElement:()=>({click(){downloads.push(this.download);},remove(){}})},setTimeout(){}
});
for(const name of ['stickerNotice','updateStickerControls','previewStickers','downloadStickerPdf']){
 const start=script.indexOf((['previewStickers','downloadStickerPdf'].includes(name)?'async ':'')+'function '+name+'(');
 const next=script.slice(start+1).search(/\n(?:async )?function |\n\$\('/);
 vm.runInContext(script.slice(start,start+1+next),c);
}
(async()=>{
 const first=c.previewStickers();assert(c.previewBusy);assert.equal(await c.previewStickers(),false);assert.equal(rpcCalls.length,1);assert(node('downloadStickerPdf').disabled);assert(node('stickerTo').disabled);
 node('stickerDeliveryDate').value='2026-11-03';node('includeExported').checked=true;resolveSettings({order:1,barcode:'1000000'});await first;
 assert.equal(c.preview.deliveryDate,'2026-11-02');assert.equal(rpcCalls[1].args[0].includeExported,false,'Options must be captured before async request');assert(!c.previewBusy);assert(c.preview.rows);assert(node('portalStickerNotice').textContent.includes('المعاينة جاهزة'));
 const pending=c.downloadStickerPdf(true);assert(c.printBusy);assert(node('portalClosePreview').disabled);await c.downloadStickerPdf(true);assert.equal(await c.previewStickers(),false);
 c.preview={rows:[{stickerKey:'changed'}],from:999,to:999};resolvePdf({});await pending;
 assert.deepEqual(downloads,['ستكرات_803_803.pdf']);assert.equal(rpcCalls.find(r=>r.name==='adminRecordStickerExport').args[0].ids[0],'k803');assert.equal(rpcCalls.find(r=>r.name==='adminRecordStickerExport').args[0].deliveryDate,'2026-11-02');assert(!c.printBusy);assert(!node('portalClosePreview').disabled);assert.equal(node('portalStickerNotice').dataset.type,'ok');
 c.preview={rows:[{stickerKey:'k803',stickerRevision:'rev803'}],from:803,to:803};c.buildPreviewPdf=async()=>{throw Error('اختبار فشل التحويل');};const before=rpcCalls.length;await c.downloadStickerPdf(true);assert.equal(rpcCalls.length,before);assert.equal(downloads.length,1);assert.equal(node('portalStickerNotice').dataset.type,'err');assert(!c.printBusy);assert(!node('downloadStickerPdf').disabled);
 console.log('PASS: double-click protection, frozen options/order snapshot, visible PDF progress/errors, failed-render recovery, and no export recorded on PDF failure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
