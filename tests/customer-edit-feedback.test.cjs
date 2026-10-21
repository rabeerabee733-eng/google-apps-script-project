const test=require('node:test'),assert=require('node:assert/strict');
const {setup,tick}=require('./customer-edit-ui.test.cjs');
const submit={preventDefault(){}};
async function ready(){const u=setup('token='+'a'.repeat(64));await tick();return u;}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}

test('verified save shows a visible confirmation beside the mobile save button and updates the revision',async()=>{
 const u=await ready();await u.nodes.form.onsubmit(submit);
 assert.match(u.nodes['save-message'].textContent,/تم تعديل طلبك بنجاح.*51/);
 assert.equal(u.nodes['save-message'].hidden,false);assert.equal(u.nodes['saved-summary'].focused,true);assert.equal(u.nodes['saved-summary'].scrolled,true);assert.equal(u.nodes['saved-summary'].hidden,false);assert.match(u.nodes['saved-summary-details'].textContent,/عميل تجريبي/);assert.match(u.nodes['saved-summary-items'].textContent,/حقيبة الصف الأول × 2/);assert.match(u.nodes['saved-summary-totals'].textContent,/الإجمالي: 25.00 د/);
 assert.equal(u.nodes.save.textContent,'تم حفظ التعديلات ✓');assert.equal(u.nodes.form.hidden,false);assert.equal(u.nodes.fields.disabled,false);
 await u.nodes.form.onsubmit(submit);assert.equal(u.calls.filter(c=>c.name==='customerEditSave')[1].arg.revision,'v2');
});
test('temporary polling failures retain the form, typed edits and previous success message',async()=>{
 const u=await ready();await u.nodes.form.onsubmit(submit);const saved=u.nodes['save-message'].textContent;
 u.nodes.address.value='عنوان لم يحفظ';u.setCheck(new Error('Network connection failed'));u.timers[0]();await tick();
 assert.equal(u.nodes.form.hidden,false);assert.equal(u.nodes.address.value,'عنوان لم يحفظ');
 assert.equal(u.nodes['save-message'].textContent,saved);assert.match(u.nodes['connection-message'].textContent,/مؤقتًا/);
 u.setCheck({locked:false});u.timers[0]();await tick();assert.equal(u.nodes['connection-message'].hidden,true);
});
test('late polling failure cannot hide a successfully saved order',async()=>{
 const u=await ready(),check=deferred();u.setCheck(check.promise);u.timers[0]();await tick();
 await u.nodes.form.onsubmit(submit);check.reject(new Error('رابط التعديل غير صالح أو تم استبداله.'));await tick();
 assert.equal(u.nodes.form.hidden,false);assert.match(u.nodes['save-message'].textContent,/تم تعديل طلبك بنجاح/);
});
test('focus and timer checks do not run during a save and double submission sends one write',async()=>{
 const u=await ready(),save=deferred();u.setSave(save.promise);const pending=u.nodes.form.onsubmit(submit);await tick();
 u.events.focus();u.timers[0]();await u.nodes.form.onsubmit(submit);await tick();
 assert.equal(u.calls.filter(c=>c.name==='customerEditCheck').length,0);assert.equal(u.calls.filter(c=>c.name==='customerEditSave').length,1);
 assert.equal(u.nodes.fields.disabled,true);assert.match(u.nodes['save-message'].textContent,/جارٍ حفظ/);
 save.resolve({...u.v,revision:'v2',saved:true});await pending;
});
test('unconfirmed save responses never display success',async()=>{
 const u=await ready();u.setSave({saved:false});await u.nodes.form.onsubmit(submit);
 assert.match(u.nodes['save-message'].textContent,/تعذر تأكيد/);assert.doesNotMatch(u.nodes['save-message'].className,/success/);
});
test('a confirmed write remains confirmed if refreshing its view fails',async()=>{
 const u=await ready();u.setSave({saved:true,orderNumber:'51'});await u.nodes.form.onsubmit(submit);
 assert.match(u.nodes['save-message'].textContent,/تم حفظ التعديلات بنجاح.*تعذر تحديث/);
 assert.equal(u.nodes.fields.disabled,true);await u.nodes.form.onsubmit(submit);
 assert.equal(u.calls.filter(c=>c.name==='customerEditSave').length,1);
 u.nodes.reload.onclick();await tick();assert.equal(u.nodes.fields.disabled,false);
});
test('explicitly revoked links still hide protected form content',async()=>{
 const u=await ready();u.setCheck(new Error('رابط التعديل غير صالح أو تم استبداله. اطلب رابطًا جديدًا من الإدارة.'));u.timers[0]();await tick();
 assert.equal(u.nodes.form.hidden,true);assert.equal(u.nodes.tracking.hidden,true);assert.match(u.nodes.message.textContent,/غير صالح/);
 await u.nodes.form.onsubmit(submit);assert.equal(u.calls.filter(c=>c.name==='customerEditSave').length,0);
});
test('new edits clear the old success caption and null check responses do not erase the form',async()=>{
 const u=await ready();await u.nodes.form.onsubmit(submit);u.nodes.form.oninput();
 assert.equal(u.nodes.save.textContent,'حفظ التعديلات');assert.equal(u.nodes['save-message'].hidden,true);assert.equal(u.nodes['saved-summary'].hidden,true);
 u.setCheck(null);u.timers[0]();await tick();assert.equal(u.nodes.form.hidden,false);assert.match(u.nodes['connection-message'].textContent,/مؤقتًا/);
});
