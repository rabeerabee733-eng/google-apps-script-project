/* Account secrets stay in memory and are encrypted before POST. No localStorage. */
(function () {
  'use strict';
  const grades = {grade1_bag:'الأول',grade2_bag:'الثاني',grade3_bag:'الثالث'};
  const cards = new Map();
  let config;
  function selected() { return [...cards.values()].filter(x=>x.checkbox.checked); }
  function fee() { return selected().length * 3; }
  function sync() {
    const wanted = new Set();
    collectItems().forEach(item => {
      if (!grades[item.productId]) return;
      for (let n=1;n<=item.qty;n++) {
        const key=item.productId+':'+n; wanted.add(key);
        if (cards.has(key)) continue;
        const root=document.createElement('div');root.className='ajyal-card';
        const title='الصف '+grades[item.productId]+' — الحقيبة '+n;
        root.innerHTML='<label class="ajyal-toggle"><input type="checkbox"><span></span></label><div class="ajyal-fields" hidden></div>';
        root.querySelector('span').textContent=title+' — إضافة خدمة أجيال (+٣ دنانير)';
        const fields=root.querySelector('.ajyal-fields'), inputs={};
        [['name','اسم المعلم','text'],['username','اسم مستخدم أجيال','text'],['password','كلمة مرور أجيال','password'],['phone','واتساب المعلم','tel']].forEach(([field,label,type])=>{
          const wrap=document.createElement('div'),id='ajyal-'+key.replace(':','-')+'-'+field;
          const l=document.createElement('label');l.htmlFor=id;l.textContent=label+' *';
          const input=document.createElement('input');input.id=id;input.type=type;input.maxLength=field==='password'?128:120;input.autocomplete=field==='password'?'new-password':'off';
          wrap.append(l,input); fields.append(wrap); inputs[field]=input;
          input.addEventListener('input',summary);
        });
        const checkbox=root.querySelector('input[type=checkbox]');
        checkbox.addEventListener('change',()=>{
          fields.hidden=!checkbox.checked;
          Object.values(inputs).forEach(i=>{i.required=checkbox.checked;i.disabled=!checkbox.checked;});
          if(!checkbox.checked) inputs.password.value='';
          calculateTotals();
        });
        Object.values(inputs).forEach(i=>i.disabled=true);
        cards.set(key,{key,root,checkbox,inputs,productId:item.productId,slot:n,title});
      }
    });
    for(const [key,c] of cards) if(!wanted.has(key)) {
      if(c.checkbox.checked && Object.values(c.inputs).some(i=>i.value) && !confirm('تقليل عدد الحقائب سيحذف بيانات '+c.title+'. هل تريد المتابعة؟')) {
        const input=document.querySelector('[data-product-id="'+c.productId+'"] .qty-total');if(input)input.value=c.slot;
        wanted.add(key);continue;
      }
      c.inputs.password.value='';c.root.remove();cards.delete(key);
    }
    const list=document.getElementById('ajyal-options');
    [...cards.values()].sort((a,b)=>a.productId.localeCompare(b.productId)||a.slot-b.slot).forEach(c=>list.append(c.root));
    if(!cards.size) list.textContent='اختر عدد حقائب الصف الأول أو الثاني أو الثالث لإظهار خيارات الخدمة.';
    else [...list.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
    summary();
  }
  function summary(){
    document.getElementById('ajyal-fee').textContent=fee()+' د.أ ('+selected().length+' حقائب)';
    const box=document.getElementById('ajyal-summary');box.replaceChildren();
    selected().forEach(c=>{const p=document.createElement('p');p.textContent=c.title+' — '+(c.inputs.name.value.trim()||'لم يُدخل الاسم بعد')+' — ٣ دنانير';box.append(p);});
  }
  function readiness() {
    return new Promise((resolve,reject)=>{
      const cb='ajyalConfig_'+Date.now(),script=document.createElement('script');
      const clean=()=>{clearTimeout(timer);delete window[cb];script.remove();};
      const fail=()=>{clean();reject(new Error('خدمة الحجز قيد التجهيز. يرجى التواصل معنا عبر واتساب.'));};
      const timer=setTimeout(fail,12000);
      window[cb]=result=>{clean();if(!result||result.version!=='ajyal-v1'||!result.ready){reject(new Error('خدمة الحجز قيد التجهيز. يرجى التواصل معنا عبر واتساب.'));return;}config=result;resolve();};
      script.onerror=fail;script.src=WEB_APP_URL+'?action=ajyalConfig&callback='+cb;document.head.append(script);
    });
  }
  async function collect(){
    const rows=[];
    for(const c of selected()) {
      for(const i of Object.values(c.inputs)) if(!i.value.trim()) {i.focus();throw new Error('أكمل جميع بيانات '+c.title+' أو ألغِ اختيار الخدمة.');}
      const phone=c.inputs.phone.value.replace(/\D/g,'').replace(/^962/,'0');
      if(!/^07\d{8}$/.test(phone))throw new Error('رقم واتساب غير صحيح: '+c.title);
      const key=await crypto.subtle.importKey('jwk',config.publicKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
      const cipher=await crypto.subtle.encrypt({name:'RSA-OAEP'},key,new TextEncoder().encode(c.inputs.password.value));
      rows.push({productId:c.productId,slot:c.slot,name:c.inputs.name.value.trim(),username:c.inputs.username.value.trim(),phone,keyId:config.keyId,cipher:btoa(String.fromCharCode(...new Uint8Array(cipher)))});
    }
    return rows;
  }
  window.AjyalBooking={sync,fee,ready:readiness,collect,clearSecrets(){for(const c of cards.values())c.inputs.password.value='';}};
})();
