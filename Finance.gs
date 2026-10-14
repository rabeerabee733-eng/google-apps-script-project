/* Manager-only bookkeeping. Monetary values are integer fils (1 JOD = 1000).
 * A record, its payments and audit history are written together in one row.
 * Read operations never create sheets or modify customer orders.
 */
var FINANCE_SHEETS_={payroll:'شؤون الموظفين',expense:'المصروفات والفواتير'};
var FINANCE_CATEGORIES_=['طباعة وتجليد','قرطاسية وتغليف','إيجار','كهرباء ومياه','اتصالات وإنترنت','صيانة','نقل وتوصيل','تسويق','أخرى'];
var FINANCE_METHODS_=['نقدًا','تحويل بنكي','محفظة إلكترونية','أخرى'];
function financeKind_(kind){if(!Object.prototype.hasOwnProperty.call(FINANCE_SHEETS_,kind))throw Error('نوع السجل غير صحيح.');return kind;}
function financeText_(value,max,required){var s=String(value==null?'':value).trim();if(s.length>max||required&&!s)throw Error('أكمل الحقول المطلوبة ضمن الطول المسموح.');return s;}
function financeMoney_(value){
  var s=opsDigits_(String(value==null?'':value)).replace(/٫/g,'.').trim();
  if(!/^\d{1,7}(\.\d{1,3})?$/.test(s))throw Error('أدخل مبلغًا غير سالب حتى 3 منازل عشرية.');
  var parts=s.split('.'),n=Number(parts[0])*1000+Number(((parts[1]||'')+'000').slice(0,3));
  if(!Number.isSafeInteger(n)||n>1000000000)throw Error('المبلغ يتجاوز الحد المسموح (مليون دينار).');return n;
}
function financeDate_(value,month){var s=String(value||''),pattern=month?/^20\d{2}-(0[1-9]|1[0-2])$/:/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;if(!pattern.test(s)||!month&&(isNaN(Date.parse(s))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s))throw Error('اختر تاريخًا صحيحًا.');return s;}
function financeEmployees_(){return AJYAL_EMPLOYEES.slice();}
function financeHeaders_(kind){return kind==='payroll'?['المعرف','الشهر','الموظف','الراتب الأساسي','الإضافات','الخصومات','السلف المحتسبة','صافي المستحق','المدفوع','المتبقي','الحالة','ملاحظات','آخر تعديل','السجل والتاريخ JSON']:['المعرف','التاريخ','النوع','التصنيف','البيان','الجهة','رقم الفاتورة','القيمة','المدفوع','المتبقي','الحالة','الاستحقاق','رابط الفاتورة','آخر تعديل','السجل والتاريخ JSON'];}
function financeRecords_(kind){financeKind_(kind);var width=financeHeaders_(kind).length;return opsRead_(FINANCE_SHEETS_[kind],width).filter(function(r){return !!r[0];}).map(function(r){var d;try{d=JSON.parse(r[width-1]);}catch(e){throw Error('تعذر قراءة سجل مالي. راجع بيانات الكشف قبل المتابعة.');}if(d.id!==r[0]||d.kind!==kind||!Array.isArray(d.payments)||!Array.isArray(d.history))throw Error('بنية السجل المالي غير صحيحة.');return d;});}
function financeTotals_(d){var total=d.kind==='payroll'?d.base+d.allowance-d.deduction-d.advance:d.amount,paid=d.payments.reduce(function(n,p){return n+(p.voidedAt?0:p.amount);},0);return {total:total,paid:paid,balance:total-paid,status:d.cancelled?'ملغي':total===paid?'مسدد':paid?'مسدد جزئيًا':'غير مسدد'};}
function financePublic_(d,detail){var t=financeTotals_(d),r=Object.assign({},d,t);if(!detail){delete r.history;delete r.payments;}return r;}
function financeWrite_(d){
  var t=financeTotals_(d),f=function(n){return (n/1000).toFixed(3);},safe=ajyalCell_,serialized=JSON.stringify(d);
  if(serialized.length>45000)throw Error('وصل السجل إلى الحد الأقصى للتعديلات. لم يحفظ الإجراء.');
  var row=d.kind==='payroll'?[d.id,d.month,safe(d.employee),f(d.base),f(d.allowance),f(d.deduction),f(d.advance),f(t.total),f(t.paid),f(t.balance),t.status,safe(d.notes),d.updatedAt,serialized]:[d.id,d.date,d.type,safe(d.category),safe(d.title),safe(d.payee),safe(d.invoiceNumber),f(d.amount),f(t.paid),f(t.balance),t.status,d.dueDate,safe(d.invoiceUrl),d.updatedAt,serialized];
  opsPut_(FINANCE_SHEETS_[d.kind],financeHeaders_(d.kind),row,d.id);
}
function financeSnapshot_(d){var copy=Object.assign({},d);delete copy.history;return copy;}
function adminFinanceList(payload){
  opsManager_();payload=payload||{};var kind=financeKind_(payload.kind),today=Utilities.formatDate(new Date(),'Asia/Amman','yyyy-MM-dd'),month=financeDate_(payload.month||today.slice(0,7),true),query=financeText_(payload.query,120,false).toLowerCase(),state=String(payload.status||''),records=financeRecords_(kind),summary={count:0,total:0,paid:0,balance:0,deductions:0,advances:0,overdue:0,cashPaid:0};
  var monthly=records.filter(function(d){return(kind==='payroll'?d.month:d.date.slice(0,7))===month;});
  monthly.forEach(function(d){if(d.cancelled)return;var t=financeTotals_(d);summary.count++;summary.total+=t.total;summary.paid+=t.paid;summary.balance+=t.balance;if(kind==='payroll'){summary.deductions+=d.deduction;summary.advances+=d.advance;}else if(d.dueDate&&d.dueDate<today&&t.balance>0)summary.overdue++;});
  records.forEach(function(d){d.payments.forEach(function(p){if(!p.voidedAt&&p.date.slice(0,7)===month)summary.cashPaid+=p.amount;});});
  var rows=monthly.map(function(d){return financePublic_(d,false);}).filter(function(d){return(!state||d.status===state)&&(!query||[d.employee,d.title,d.payee,d.invoiceNumber,d.category,d.notes].join(' ').toLowerCase().indexOf(query)!==-1);}).sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt));});
  var offset=Math.max(0,Math.floor(Number(payload.offset)||0));return {kind:kind,month:month,today:today,summary:summary,rows:rows.slice(offset,offset+50),total:rows.length,employees:financeEmployees_(),categories:FINANCE_CATEGORIES_,methods:FINANCE_METHODS_};
}
function adminFinanceGet(kind,id){opsManager_();var d=financeRecords_(financeKind_(kind)).filter(function(r){return r.id===id;})[0];if(!d)throw Error('السجل غير موجود.');return financePublic_(d,true);}
function adminFinanceSave(payload){
  var actor=opsManager_();payload=payload||{};var kind=financeKind_(payload.kind),id=String(payload.id||''),opId=String(payload.opId||''),action=String(payload.action||''),fingerprint=portalDigest_(JSON.stringify(payload));
  if(!/^fin_[a-zA-Z0-9_-]{16,90}$/.test(id)||!/^op_[a-zA-Z0-9_-]{16,90}$/.test(opId)||['save','pay','void','cancel','restore'].indexOf(action)<0)throw Error('معرف العملية غير صحيح.');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    var records=financeRecords_(kind),old=records.filter(function(r){return r.id===id;})[0],prior=old&&old.history.filter(function(h){return h.opId===opId;})[0];
    if(prior){if(prior.fingerprint!==fingerprint)throw Error('معرف العملية مستخدم لبيانات أخرى.');return financePublic_(old,true);}
    if(old&&old.version!==payload.version)throw Error('تغير السجل. أغلقه ثم أعد فتحه قبل الحفظ.');
    if(!old&&action!=='save')throw Error('السجل غير موجود.');
    if(old&&old.cancelled&&action!=='restore')throw Error('السجل ملغي. استعده أولًا.');
    var now=new Date().toISOString(),d=old?JSON.parse(JSON.stringify(old)):{id:id,kind:kind,payments:[],history:[],createdAt:now,cancelled:false},before=old?financeSnapshot_(old):null,p=payload.data||{},reason='';
    if(action==='save'){
      if(kind==='payroll'){
        d.employee=financeText_(p.employee,100,true);if(financeEmployees_().indexOf(d.employee)<0)throw Error('اختر موظفًا من القائمة.');d.month=financeDate_(p.month,true);
        if(old&&(old.employee!==d.employee||old.month!==d.month))throw Error('لا يمكن تغيير موظف أو شهر سجل محفوظ.');
        if(records.some(function(r){return r.id!==id&&!r.cancelled&&r.employee===d.employee&&r.month===d.month;}))throw Error('يوجد راتب لهذا الموظف في الشهر المحدد. افتح السجل الموجود.');
        ['base','allowance','deduction','advance'].forEach(function(k){d[k]=financeMoney_(p[k]);});
        d.deductionReason=financeText_(p.deductionReason,500,d.deduction>0);d.advanceReason=financeText_(p.advanceReason,500,d.advance>0);
        if(d.base+d.allowance<d.deduction+d.advance)throw Error('الخصومات والسلف أكبر من الراتب والإضافات.');
      }else{
        d.date=financeDate_(p.date,false);d.type=String(p.type||'');if(['مصروف','فاتورة'].indexOf(d.type)<0)throw Error('اختر نوع السجل.');
        d.category=String(p.category||'');if(FINANCE_CATEGORIES_.indexOf(d.category)<0)throw Error('اختر تصنيف المصروف.');
        d.title=financeText_(p.title,180,true);d.payee=financeText_(p.payee,150,true);d.invoiceNumber=financeText_(p.invoiceNumber,100,false);d.amount=financeMoney_(p.amount);if(!d.amount)throw Error('قيمة المصروف يجب أن تكون أكبر من صفر.');
        d.dueDate=p.dueDate?financeDate_(p.dueDate,false):'';d.invoiceUrl=financeText_(p.invoiceUrl,1000,false);
        if(d.invoiceUrl&&!/^https:\/\/(drive|docs)\.google\.com\//i.test(d.invoiceUrl))throw Error('أرفق رابط الفاتورة من Google Drive.');
        if(d.invoiceNumber&&records.some(function(r){return r.id!==id&&!r.cancelled&&r.payee.toLowerCase()===d.payee.toLowerCase()&&r.invoiceNumber.toLowerCase()===d.invoiceNumber.toLowerCase();}))throw Error('رقم الفاتورة مسجل مسبقًا لدى هذه الجهة.');
      }
      d.notes=financeText_(p.notes,1000,false);if(financeTotals_(d).balance<0)throw Error('القيمة الجديدة أقل من المدفوع. صحّح الدفعة أولًا.');
      if(old)reason=financeText_(payload.reason,500,true);
    }else if(action==='pay'){
      var amount=financeMoney_(p.amount),date=financeDate_(p.date,false),method=String(p.method||'');
      if(!amount||amount>financeTotals_(d).balance)throw Error('الدفعة يجب أن تكون أكبر من صفر ولا تتجاوز المتبقي.');
      if(FINANCE_METHODS_.indexOf(method)<0)throw Error('اختر طريقة الدفع.');
      if(date>Utilities.formatDate(new Date(),'Asia/Amman','yyyy-MM-dd'))throw Error('لا يمكن تسجيل دفعة بتاريخ مستقبلي.');
      d.payments.push({id:opId,amount:amount,date:date,method:method,reference:financeText_(p.reference,180,false),notes:financeText_(p.notes,500,false),recordedAt:now,recordedBy:actor.email});
    }else if(action==='void'){
      reason=financeText_(payload.reason,500,true);var payment=d.payments.filter(function(x){return x.id===p.paymentId;})[0];if(!payment||payment.voidedAt)throw Error('الدفعة غير موجودة أو ألغيت سابقًا.');payment.voidedAt=now;payment.voidedBy=actor.email;payment.voidReason=reason;
    }else if(action==='cancel'){
      reason=financeText_(payload.reason,500,true);if(financeTotals_(d).paid>0)throw Error('لا يمكن إلغاء سجل له دفعات فعالة.');d.cancelled=true;
    }else if(action==='restore'){
      reason=financeText_(payload.reason,500,true);if(!d.cancelled)throw Error('السجل غير ملغي.');
      if(records.some(function(r){return r.id!==id&&!r.cancelled&&(kind==='payroll'?r.employee===d.employee&&r.month===d.month:d.invoiceNumber&&r.payee.toLowerCase()===d.payee.toLowerCase()&&r.invoiceNumber.toLowerCase()===d.invoiceNumber.toLowerCase());}))throw Error('يوجد سجل فعال بنفس الموظف والشهر أو رقم الفاتورة.');d.cancelled=false;
    }
    d.updatedAt=now;d.version=Utilities.getUuid();d.history.push({opId:opId,fingerprint:fingerprint,action:action,reason:reason,at:now,by:actor.email,before:before?{employee:before.employee,month:before.month,base:before.base,allowance:before.allowance,deduction:before.deduction,advance:before.advance,deductionReason:before.deductionReason,advanceReason:before.advanceReason,date:before.date,type:before.type,category:before.category,title:before.title,payee:before.payee,invoiceNumber:before.invoiceNumber,amount:before.amount,dueDate:before.dueDate,invoiceUrl:before.invoiceUrl,notes:before.notes,cancelled:before.cancelled}:null});
    financeWrite_(d);return financePublic_(d,true);
  }finally{lock.releaseLock();}
}
