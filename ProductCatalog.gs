// Authoritative product overrides are private script properties; public reads expose only product data.
function catalogDefaults_(){
 var bag='حقيبة المعلم: تحضير يومي، خطط فصلية، تحليل محتوى، أوراق عمل، سلالم تقدير ونموذج دفتر علامات. حقيبة استراتيجيات التعلم النشط منتج مستقل.';
 return {
  grade1_bag:{description:bag,aliases:['حقيبة المعلم صف أول']},grade2_bag:{description:bag,aliases:['حقيبة المعلم صف ثاني']},grade3_bag:{description:bag,aliases:['حقيبة المعلم صف ثالث']},
  prep_grade1:{description:'التحضير اليومي المطبوع فقط للصف الأول.',aliases:['تحضير أول']},prep_grade2:{description:'التحضير اليومي المطبوع فقط للصف الثاني.',aliases:['تحضير ثاني']},prep_grade3:{description:'التحضير اليومي المطبوع فقط للصف الثالث.',aliases:['تحضير ثالث']},
  active_learning:{description:'حقيبة استراتيجيات التعلم النشط: 12 استراتيجية و74 صورة إجمالًا، ملونة ومغلفة حراريًا، للمشاركة والتعاون والمراجعة الصفية. لا تتضمن حقيبة المعلم أو ملفات التحضير اليومي.',aliases:['حقيبة استراتيجيات التعلم النشط','حقيبة الاستراتيجيات']},
  number_cards:{description:'بطاقات الأعداد هي نفسها بطاقات الأرقام. من 0 إلى 100، مناسبة لرياض الأطفال والصفين الأول والثاني. قياس كل بطاقة 10×14 سم، تغليف حراري متين وألوان زاهية. تشمل إشارات (+ – × ÷ < > =) وتساعد على قراءة وكتابة وترتيب ومقارنة الأعداد والجمع والطرح والقسمة والمنزلة العددية، بتعلم تفاعلي ممتع.',aliases:['بطاقات الأرقام','بطاقات الارقام','بطاقات الاعداد']},
  letter_cards:{description:'مجموعة بطاقات الحروف، 174 بطاقة.',aliases:['بطاقات الحروف الهجائية']},
  classroom_rules:{description:'12 بطاقة للقوانين الصفية، قياس A4، ملونة ومغلفة.',aliases:['القوانين الصفية']}
 };
}
function catalogApply_(base){
 var defaults=catalogDefaults_(),props=typeof PropertiesService==='undefined'?null:PropertiesService.getScriptProperties();
 Object.keys(base).forEach(function(id){var p=base[id],d=defaults[id]||{};p.description=d.description||'';p.aliases=d.aliases||[];
  var raw=props&&props.getProperty('PRODUCT_V1_'+id);if(!raw)return;
  var v=JSON.parse(raw);if(!Number.isFinite(v.price)||v.price<=0||typeof v.description!=='string'||!Array.isArray(v.aliases))throw new Error('INVALID_PRODUCT_CONFIG');
  p.price=v.price;p.soldOut=v.soldOut===true;p.description=v.description;p.aliases=v.aliases;
 });return base;
}
function catalogView_(){return {ok:true,revision:portalDigest_(JSON.stringify(PRODUCTS)),products:PRODUCTS,districts:DISTRICTS,delivery:{amman:2,other:3},canonical:true};}
function catalogUpdate_(d){
 var lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  // Re-read inside the lock: a second editor cannot overwrite an unseen revision.
  catalogApply_(PRODUCTS);if(d.revision!==catalogView_().revision)return waFail_('STALE_CATALOG');
  var p=d.product,id=d.id;if(!Object.prototype.hasOwnProperty.call(PRODUCTS,id)||!p||!Number.isFinite(p.price)||p.price<=0||p.price>10000||Math.round(p.price*1000)!==p.price*1000||typeof p.soldOut!=='boolean'||typeof p.description!=='string'||p.description.length<3||p.description.length>1500||!Array.isArray(p.aliases)||p.aliases.length>20)return waFail_('INVALID_PRODUCT');
  if(p.aliases.some(function(a){return typeof a!=='string'||!a.trim()||a.length>100;}))return waFail_('INVALID_PRODUCT');
  var value={price:p.price,soldOut:p.soldOut,description:p.description.trim(),aliases:p.aliases.map(function(a){return a.trim();})};
  PropertiesService.getScriptProperties().setProperty('PRODUCT_V1_'+id,JSON.stringify(value));catalogApply_(PRODUCTS);
  return catalogView_();
 }finally{lock.releaseLock();}
}
