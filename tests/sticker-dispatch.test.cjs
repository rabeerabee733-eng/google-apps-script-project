const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const tables={},orders=[],exportRows=[];
function sheet(name){
 tables[name]||=[];
 return {
  getLastRow:()=>tables[name].length+1,
  getRange(row,col,count,width){return {
   setNumberFormat(){return this;},
   setValues(values){for(let i=0;i<values.length;i++)tables[name][row-2+i]=values[i].slice();return this;},
   setValue(value){tables[name][row-2][col-1]=value;}
  };}
 };
}
const c={opsSheet_:sheet,opsRead_:name=>tables[name]||[],stickerExportLedger_:()=>exportRows,bookingNoticeOrderRows_:()=>orders,bookingNoticeValid_:r=>/^07\d{8}$/.test(r[3]),canonicalPhone_:p=>p,bookingNoticeId_:s=>'booking_'+crypto.createHash('sha256').update(s).digest('hex')};vm.createContext(c);vm.runInContext(fs.readFileSync('LifecycleNotifications.gs','utf8'),c);
function row(id,phone='0790000000'){const r=Array(17).fill('');r[0]='12';r[2]='سارة';r[3]=phone;r[16]=id;return r;}
orders.push(row('one'),row('two','0780000000'),row('excluded'));
exportRows.push(['one','12','','2026-10-27T12:00:00Z','first'],['two','13','','2026-10-27T12:00:00Z','first']);
const selected=[{key:'one',requestId:'one'},{key:'two',requestId:'two'}];
c.lifecycleQueueStickerDownloads_({batch:'first'},selected);assert.equal(tables[c.LIFECYCLE_OUTBOX_].length,2,'all selected orders queue even before first poll');
assert.equal(tables[c.LIFECYCLE_OUTBOX_][0][2],'962790000000');assert.equal(tables[c.LIFECYCLE_OUTBOX_][1][2],'962780000000');assert.equal(JSON.parse(tables[c.LIFECYCLE_OUTBOX_][0][4]).exportedAt,'2026-10-27T12:00:00Z');
c.lifecycleQueueStickerDownloads_({batch:'first'},selected);assert.equal(tables[c.LIFECYCLE_OUTBOX_].length,2,'same-batch retries never duplicate');
exportRows.push(['one','12','','2026-10-28T12:00:00Z','reprint']);c.lifecycleQueueStickerDownloads_({batch:'reprint'},selected);assert.equal(tables[c.LIFECYCLE_OUTBOX_].length,2,'new reprint batch never sends another notice');
orders.push(row('duplicate'),row('duplicate'),row('invalid','123'));exportRows.push(['duplicate','14','','2026-10-27T12:00:00Z','first'],['invalid','15','','2026-10-27T12:00:00Z','first']);
c.lifecycleQueueStickerDownloads_({batch:'first'},[{key:'duplicate'},{key:'invalid'},{key:'missing'}]);assert.equal(tables[c.LIFECYCLE_OUTBOX_].length,2,'ambiguous, invalid and deleted orders excluded');
const first=tables[c.LIFECYCLE_OUTBOX_][0];assert.equal(first[0],'lifecycle_'+c.bookingNoticeId_('one|status|خرج للتوصيل').slice(8),'dispatch hook and lifecycle polling share one id');
console.log('PASS: complete first-export batch, early-download race, stable identity/phone, retries, reprints, and shared lifecycle deduplication.');
