// New booking SKUs are added before any quote, validation, admin or customer-edit read.
function catalogNewProducts_(){return {"monthly_tests_grade1":{"name":"الاختبارات الشهرية للصف الأول","price":3,"splitAllowed":false,"paperOnly":true,"description":"اختبارات الصف الأول: 3 نماذج لكل فترة تقويمية لكل مادة، شاملة جميع المواد، بإجمالي 72 اختبارًا. منتج مستقل عن حقيبة المعلم والاختبارات التشخيصية.","aliases":["اختبارات شهرية صف الأول","امتحانات الصف الأول الشهرية"]},"monthly_tests_grade2":{"name":"الاختبارات الشهرية للصف الثاني","price":3,"splitAllowed":false,"paperOnly":true,"description":"اختبارات الصف الثاني: 3 نماذج لكل فترة تقويمية لكل مادة، شاملة جميع المواد، بإجمالي 72 اختبارًا. منتج مستقل عن حقيبة المعلم والاختبارات التشخيصية.","aliases":["اختبارات شهرية صف الثاني","امتحانات الصف الثاني الشهرية"]},"monthly_tests_grade3":{"name":"الاختبارات الشهرية للصف الثالث","price":3,"splitAllowed":false,"paperOnly":true,"description":"اختبارات الصف الثالث: 3 نماذج لكل فترة تقويمية لكل مادة، شاملة جميع المواد، بإجمالي 72 اختبارًا. منتج مستقل عن حقيبة المعلم والاختبارات التشخيصية.","aliases":["اختبارات شهرية صف الثالث","امتحانات الصف الثالث الشهرية"]},"english_preparation":{"name":"تحضير وخطط وتحليل الإنجليزية للصفوف الثلاثة الأولى","price":6,"splitAllowed":true,"paperOnly":false,"description":"تحضير يومي وخطط فصلية وتحليل محتوى فقط لمادة اللغة الإنجليزية للصفوف الأول والثاني والثالث معًا، ولا تُفصل الصفوف عن بعضها. سعر الحزمة كاملة 6 دنانير، ورقيًا أو مجلدًا على شكل دفتر بالسعر نفسه. التوصيل: عمّان ديناران، وباقي المحافظات 3 دنانير. الفصل الدراسي الثاني من العام الدراسي 2026/2027.","aliases":["حقيبة اللغة الإنجليزية","حقيبة إنجليزي","حقيبة الإنجليزية","تحضير إنجليزي","تحضير اللغة الإنجليزية","خطط اللغة الإنجليزية","خطط إنجليزي","تحليل الإنجليزية","خطط وتحليل الإنجليزية"]},"kindergarten_preparation":{"name":"تحضير وخطط وتحليل رياض الأطفال (المنهاج الحكومي)","price":6,"splitAllowed":true,"paperOnly":false,"description":"حقيبة رياض الأطفال (المنهاج الحكومي) تشمل تحضيرًا يوميًا وخططًا فصلية وتحليل محتوى فقط. السعر 6 دنانير، ورقيًا أو مجلدًا على شكل دفتر بالسعر نفسه. التوصيل: عمّان ديناران، وباقي المحافظات 3 دنانير. الفصل الدراسي الثاني من العام الدراسي 2026/2027.","aliases":["حقيبة رياض الأطفال","حقيبة رياض اطفال","حقيبة الروضة","خطط رياض الأطفال","خطط رياض اطفال","تحضير رياض الأطفال","تحضير رياض اطفال","تحضير الروضة","تحضير المنهاج الحكومي لرياض الأطفال"]}};}
function catalogBookingSeason_(){return "الفصل الدراسي الثاني من العام الدراسي 2026/2027";}
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
 var additions=catalogNewProducts_();Object.keys(additions).forEach(function(id){if(!base[id])base[id]=JSON.parse(JSON.stringify(additions[id]));});
 ['english_preparation','kindergarten_preparation'].forEach(function(id){base[id].splitAllowed=true;base[id].paperOnly=false;});
 var defaults=catalogDefaults_();Object.keys(additions).forEach(function(id){defaults[id]=additions[id];});
 var props=typeof PropertiesService==='undefined'?null:PropertiesService.getScriptProperties();
 Object.keys(base).forEach(function(id){var p=base[id],d=defaults[id]||{};p.description=d.description||'';p.aliases=d.aliases||[];
  var raw=props&&props.getProperty('PRODUCT_V1_'+id);if(!raw)return;
  var v=JSON.parse(raw);if(!Number.isFinite(v.price)||v.price<=0||typeof v.description!=='string'||!Array.isArray(v.aliases))throw new Error('INVALID_PRODUCT_CONFIG');
  p.price=v.price;p.soldOut=v.soldOut===true;p.description=v.description;p.aliases=v.aliases;
 });
 Object.keys(base).forEach(function(id){var p=base[id];if(/^grade[123]_bag$|^prep_grade[123]$|^(?:english|kindergarten)_preparation$/.test(id)){p.bookingSeason=catalogBookingSeason_();if(p.description.indexOf(p.bookingSeason)===-1)p.description+=' الحجوزات القادمة: '+p.bookingSeason+'.';}});
 var order=['grade1_bag','grade2_bag','grade3_bag','monthly_tests_grade1','monthly_tests_grade2','monthly_tests_grade3','prep_grade1','prep_grade2','prep_grade3','english_preparation','kindergarten_preparation'],sorted={};order.concat(Object.keys(base)).forEach(function(id){if(base[id])sorted[id]=base[id];});return sorted;
}
function catalogView_(){return {ok:true,revision:portalDigest_(JSON.stringify(PRODUCTS)),products:PRODUCTS,bookingSeason:catalogBookingSeason_(),districts:DISTRICTS,delivery:{amman:2,other:3},canonical:true};}
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
