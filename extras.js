/* Merchant Ledger — extras v9: app lock, trade-rules guide, zakat calculator, native save/share bridge */
(function(){
'use strict';
const B=(a,e)=>uiLang==='en'?e:a;
const PK='ledger-pin-v1',FK='ledger-pin-fail',IDLE=60000;
let ruleF='all',ruleQ='';

/* ---------- 1) Native save / share bridge ---------- */
const _downloadBlob=downloadBlob;
function blobToB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob)})}
downloadBlob=function(filename,blob){
  const C=window.Capacitor,P=C&&C.Plugins;
  if(C&&C.isNativePlatform&&C.isNativePlatform()&&P&&P.Filesystem&&P.Share){
    (async()=>{const data=await blobToB64(blob);const w=await P.Filesystem.writeFile({path:filename,data,directory:'CACHE'});await P.Share.share({title:filename,url:w.uri,dialogTitle:filename})})()
      .catch(e=>{if(!/cancel/i.test(String(e&&e.message||e)))toast(B('تعذر حفظ الملف','Could not save the file'),'error')});
    return;
  }
  try{
    const file=new File([blob],filename,{type:blob.type||'application/octet-stream'});
    if(matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:filename}).catch(e=>{if(e&&e.name!=='AbortError')_downloadBlob(filename,blob)});return;
    }
  }catch(e){}
  _downloadBlob(filename,blob);
};

/* ---------- 2) Trade rules guide + formulas ---------- */
const RULES=[
['h',['بيع سلعة تملكها وتقبضها بثمن معلوم','Selling goods you own and hold at a known price'],['هذا أصل البيع الجائز: ملك وقبض وثمن وصفة معلومة.','The basic valid sale: ownership, possession, known price and description.']],
['h',['المرابحة: بيع بتكلفة معلومة وربح معلوم','Murabaha: sale at disclosed cost plus a known margin'],['تجوز بشرط الصدق في بيان التكلفة وعدم إخفاء خصم أو عيب.','Valid if you state the true cost and hide no discount or defect.']],
['h',['التقسيط بثمن مؤجل يُحدَّد عند العقد','Instalment sale at a price fixed at signing'],['يجوز أن يكون ثمن الأجل أعلى بشرط تثبيته عند العقد فلا يزيد عند التأخر.','The deferred price may be higher if fixed at signing and never increased for lateness.']],
['x',['زيادة الدين أو غرامة مالية على المدين المتأخر','Increasing a debt or fining a late debtor'],['من ربا الجاهلية: «أتقضي أم تربي».','This is the pre-Islamic riba: "pay or it increases".'],['أجّل بلا زيادة، أو اطلب ضامناً أو رهناً عند العقد.','Extend without increase, or take a guarantor or pledge at signing.']],
['x',['قرض يشترط فيه المقرض منفعة','A loan with a stipulated benefit for the lender'],['كل قرض جرّ نفعاً مشروطاً فهو ربا.','Any loan bringing a stipulated benefit is riba.'],['اجعله مضاربة أو شراكة بنسبة من الربح.','Make it a mudaraba or partnership sharing profit by percentage.']],
['x',['بيع ما لا تملك ولا قبضت','Selling what you neither own nor hold'],['نهى النبي ﷺ عن بيع ما ليس عندك.','The Prophet ﷺ forbade selling what you do not have.'],['اشترِ واقبض ثم بع، أو استعمل السَّلَم بشروطه.','Buy and take possession first, or use salam with its conditions.']],
['x',['بيع حيوان أو سلعة مع إخفاء عيب أو مرض','Selling an animal or goods while hiding a defect or illness'],['الغش حرام: «من غشنا فليس منا».','Fraud is forbidden: "Whoever cheats us is not one of us."'],['اذكر العيب وسجّله في الوصل.','Disclose the defect and write it on the receipt.']],
['x',['بيع الجنين في البطن أو اللبن في الضرع','Selling an unborn calf/lamb or milk still in the udder'],['من الغرر المنهي عنه: المبيع مجهول الوجود والصفة.','Forbidden gharar: existence and quality are unknown.'],['بع الحيوان نفسه، أو اللبن بعد الحلب، أو اعقد سَلَماً.','Sell the animal itself, milk after milking, or use salam.']],
['x',['بيع الثمر أو الحب قبل بدو صلاحه أو اشتداده','Selling fruit or grain before it ripens or hardens'],['ورد النهي عن بيع الثمار قبل بدو صلاحها والحب قبل اشتداده.','Selling fruit before ripeness and grain before hardening is prohibited.'],['انتظر الصلاح، أو بع بشرط القطع الفوري، أو اعقد سَلَماً.','Wait until ripe, sell with an immediate-harvest condition, or use salam.']],
['h',['السلم: ثمن كامل الآن لسلعة موصوفة تُسلَّم لأجل','Salam: full price now for described goods delivered later'],['يجوز في الحبوب والأغنام الموصوفة بكمية وصفة وأجل معلومين وثمن يُدفع في المجلس.','Valid for grains and well-described livestock with fixed quantity, description and date, price paid at signing.']],
['h',['كراء الأرض بأجرة نقدية ومدة معلومتين','Renting land for a known cash rent and term'],['إجارة صحيحة إذا حُدّدت الأجرة والمدة ووجه الانتفاع.','A valid lease when rent, term and use are defined.']],
['h',['مزارعة أو مساقاة بجزء شائع من الناتج','Sharecropping/orchard partnership for a shared fraction of the crop'],['تجوز بنصف أو ثلث مثلاً مع بيان من يتحمل البذر والسقي والآلة.','Valid for a fraction such as half or a third, stating who bears seed, water and machinery.'],['اكتب العقد واحسم التكاليف قبل الزرع.','Put it in writing and settle costs before planting.']],
['x',['كراء الأرض بقدر مقطوع من محصولها أو من بقعة معينة منها','Renting land for a fixed quantity of its crop or a specific strip'],['جاء النهي عنه لما فيه من غرر وظلم إن هلك الزرع أو زاد.','Forbidden for the gharar and injustice if the crop fails or exceeds.'],['استعمل أجرة نقدية أو نسبة شائعة من كل الناتج.','Use cash rent or a shared percentage of the whole crop.']],
['s',['أجرة تلقيح الفحل (عسب الفحل)','Fee for stud/breeding service'],['ورد فيه نهي وللعلماء خلاف وتفصيل.','A prohibition is reported and scholars differ in detail.'],['اسأل عالماً قبل أخذ أجرة مشروطة.','Ask a scholar before charging a stipulated fee.']],
['s',['التأمين التجاري على السلع أو الماشية','Commercial insurance on goods or livestock'],['أكثر المجامع الفقهية على المنع لما فيه من غرر وربا، والتكافل التعاوني بديل.','Most contemporary councils prohibit it; cooperative takaful is the alternative.']],
['x',['التسويق الهرمي الذي يأتي ربحه من التجنيد','Pyramid marketing whose profit comes from recruiting'],['فيه غرر وأكل مال بالباطل.','It contains gharar and consumes wealth unjustly.']],
['x',['الاحتكار لرفع ثمن ضرورات الناس','Hoarding essentials to raise prices'],['«لا يحتكر إلا خاطئ».','"None hoards but a sinner."']],
['h',['المضاربة: مال من طرف وعمل من آخر وربح بنسبة','Mudaraba: capital from one, work from the other, profit by percentage'],['الربح بنسبة شائعة، والخسارة المالية على صاحب المال والعامل يخسر جهده، دون ضمان.','Profit by a shared percentage; financial loss on the capital owner; no guaranteed return.']],
['s',['أعطيك بقرة تربيها ولي نصف نسلها أو لبنها','I give you a cow to raise for half its offspring or milk'],['تحديد حصة معيّنة من النسل أو اللبن فيه غرر وخلاف بين العلماء.','Fixing a share of offspring or milk involves gharar and scholarly disagreement.'],['اجعلها مضاربة: تُباع ويُقسم الربح بنسبة شائعة، واسأل عالماً.','Structure it as mudaraba: sell and split profit by percentage; ask a scholar.']]
];
const FORMS=[
['🧾',['المرابحة','Murabaha'],['اشترِ السلعة وتملّكها ثم بعها بزيادة معلنة. مناسبة للجملة والتجزئة.','Buy and own the goods, then resell at a disclosed margin. Suits wholesale and retail.']],
['🌾',['السلم','Salam'],['ادفع الثمن مقدماً للفلاح مقابل محصول موصوف: تمويل بلا ربا وربح من فرق السعر.','Pay a farmer upfront for a described crop: interest-free financing and margin from the price gap.']],
['🤝',['المضاربة','Mudaraba'],['مال منك وعمل من شريكك أو العكس، مع نسبة ربح واضحة. تصلح للورش والتجارة الموسمية.','Capital from you and work from a partner, or the reverse, with a clear profit share. Fits workshops and seasonal trade.']],
['🌱',['المزارعة والكراء','Sharecrop & lease'],['أرضك لمن يزرعها بنسبة من الناتج أو بأجرة معلومة، فلا تتعطل.','Let someone farm your land for a share of the crop or a known rent, so it never sits idle.']],
['🛠️',['الاستصناع وعقد الصيانة','Istisna & service contract'],['اتفق مع الحِرَفي على الصفة والثمن وأجل التسليم قبل البدء.','Agree with the craftsman on specification, price and delivery date before starting.']],
['🏪',['شركة العنان','Inan partnership'],['شريكان يضعان مالاً ويشتركان في العمل: ربح بنسبة متفق عليها وخسارة بقدر رأس المال.','Two partners invest and work together: profit by agreed ratio, loss by capital share.']]
];
const GOLD=[['اكتب العقد والوصل وسجّل كل دفعة.','Write the contract and receipt, and record every payment.'],['اشترِ، واقبض، ثم بع.','Buy, take possession, then sell.'],['بيّن العيوب وأمراض الحيوان.','Disclose defects and animal illnesses.'],['لا زيادة على الدين مقابل التأجيل.','Never add to a debt in return for delay.'],['افصل مال المحل عن مالك الشخصي.','Keep shop money separate from personal money.'],['أخرج زكاة التجارة عند بلوغ النصاب وتمام الحول.','Pay trade zakat once the nisab and a full lunar year are reached.'],['استشر عالماً في كل صيغة جديدة.','Ask a scholar about every new structure.']];
const cls={h:['green','حلال','Halal'],s:['amber','شبهة','Doubtful'],x:['red','حرام','Haram']};
function ruleCards(){
  const q=ruleQ.trim().toLowerCase();
  const L=RULES.filter(r=>(ruleF==='all'||r[0]===ruleF)&&(!q||(r[1][0]+r[1][1]+r[2][0]+r[2][1]).toLowerCase().includes(q)));
  if(!L.length)return `<div class="empty-state"><strong>${B('لا نتائج مطابقة','No matching results')}</strong></div>`;
  return L.map(r=>{const c=cls[r[0]],i=uiLang==='en'?1:0;return `<article class="rule-card ${r[0]}"><div class="rule-top"><strong>${esc(r[1][i])}</strong><span class="badge ${c[0]}">${esc(i?c[2]:c[1])}</span></div><p>${esc(r[2][i])}</p>${r[3]?`<div class="rule-alt"><b>${B('البديل الآمن','Safer alternative')}:</b> ${esc(r[3][i])}</div>`:''}</article>`}).join('');
}
function guideHTML(){
  const i=uiLang==='en'?1:0;
  const chips=[['all','الكل','All'],['h','حلال','Halal'],['s','شبهة','Doubtful'],['x','حرام','Haram']].map(c=>`<button type="button" class="filter-chip ${ruleF===c[0]?'active':''}" data-rule-f="${c[0]}">${c[i+1]}</button>`).join('');
  return `<div class="section-title">${B('أحكام مختصرة للمعاملات (حلال · شبهة · حرام)','Quick trade rulings (permissible · doubtful · forbidden)')}</div>
  <div class="notice" style="margin-bottom:12px">${B('إرشادات عامة للتوعية وليست فتوى. تختلف الأحكام بتفاصيل كل حالة وبين المذاهب، فاسأل عالماً ثقة أو المجلس العلمي المحلي قبل التعاقد.','General awareness guidance, not a fatwa. Rulings depend on each case and school; ask a trusted scholar or your local scholarly council before contracting.')}</div>
  <div class="panel"><div class="rule-tools"><div class="toolbar-left" style="display:flex;gap:6px;flex-wrap:wrap">${chips}</div><input id="rule-q" class="control" type="search" placeholder="${B('ابحث: ربا، ماشية، أرض…','Search: riba, livestock, land…')}" value="${esc(ruleQ)}" aria-label="${B('بحث','Search')}"></div><div id="rule-list" class="rule-grid">${ruleCards()}</div></div>
  <div class="section-title">${B('صيغ تجارية مشروعة ومربحة وآمنة','Lawful, profitable and safe commercial formulas')}</div>
  <div class="formula-grid">${FORMS.map(f=>`<article class="formula-card"><div class="formula-ico">${f[0]}</div><strong>${esc(f[1][i])}</strong><p>${esc(f[2][i])}</p></article>`).join('')}</div>
  <div class="section-title">${B('قواعد ذهبية للربح الآمن','Golden rules for safe profit')}</div>
  <div class="panel"><ol class="guide-checklist">${GOLD.map(g=>`<li>${esc(g[i])}</li>`).join('')}</ol></div>`;
}

/* ---------- 3) Zakat: trade goods · livestock · crops ---------- */
let zkTab='trade';
const zf=(n,l,v,st)=>`<label class="field"><span>${B(l[0],l[1])}</span><input name="${n}" class="control" type="number" min="0" step="${st||'any'}" inputmode="decimal" value="${v===''?'':Math.round((Number(v)||0)*100)/100}"></label>`;
const herdCounts=()=>{let c=0,s=0,k=0;try{liveDocs('animals').forEach(a=>{if(a.species==='cattle')c++;else if(a.species==='sheep'||a.species==='goat')s++;else if(a.species==='camel')k++})}catch(e){}return{c,s,k}};
function zkNote(ar,en){return `<p class="form-note" style="margin-top:8px">${B(ar,en)}</p>`}
function zkTradeForm(){
  let cash=0,rec=0,pay=0;
  try{cash=Object.values(accountBalances()).reduce((a,b)=>a+b,0);const t=totals();rec=t.rec||0;pay=t.pay||0}catch(e){}
  return `<form id="zk-form" data-tab="trade" onsubmit="return false"><div class="form-grid">${zf('gold',['سعر غرام الذهب (عيار 24)','Gold price per gram (24k)'],'')}${zf('cash',['السيولة والخزينة','Cash and treasury'],cash)}${zf('goods',['قيمة البضاعة بسعر السوق','Stock value at market price'],'')}${zf('rec',['ديون مرجوّة السداد لك','Debts you expect to collect'],rec)}${zf('debt',['ديون حالّة عليك','Debts due from you'],pay)}</div><div id="zk-out" class="zk-out" aria-live="polite"></div>${zkNote('النصاب = 85 غراماً من الذهب، والمقدار 2.5٪ بعد مرور حول هجري كامل. القيم الجاهزة مأخوذة من دفترك وقابلة للتعديل.','Nisab = 85 g of gold; rate 2.5% after a full lunar year. Prefilled values come from your ledger and are editable.')}</form>`;
}
function zkHerdForm(){
  const h=herdCounts();
  return `<form id="zk-form" data-tab="herd" onsubmit="return false"><div class="form-grid">${zf('cattle',['عدد البقر','Cattle'],h.c,1)}${zf('small',['عدد الغنم والماعز','Sheep and goats'],h.s,1)}${zf('camel',['عدد الإبل','Camels'],h.k,1)}</div><label class="chk"><input type="checkbox" name="trade"> ${B('معدّة للبيع والتجارة (تُزكّى بقيمتها كعروض تجارة)','Held for trade (zakat on value as trade goods)')}</label><div id="zk-out" class="zk-out" aria-live="polite"></div>${zkNote('الأعداد مأخوذة من سجل الحيوانات وقابلة للتعديل. الشروط: ملك تام، وبلوغ النصاب، وتمام حول هجري (ويُضمّ النتاج إلى أمهاته). ما بين النصابين لا زكاة فيه. عند المالكية تجب الزكاة ولو كانت الأنعام معلوفة، وعند الجمهور يُشترط السوم (الرعي أغلب العام). الغنم والماعز يُضمّان. سنّ التبيع والمسنة يختلف بين المذاهب فاسأل عالماً عن السن المعتبر. الدواجن لا زكاة فيها إلا للتجارة.','Conditions: full ownership, reaching the nisab and a full lunar year (offspring join their mothers). Nothing is due between thresholds. Malikis require zakat even if the animals are fed; the majority require free grazing most of the year. Sheep and goats combine. The age of tabi\' and musinna differs by school; ask a scholar. Poultry are only zakatable as trade goods.')}</form>`;
}
function zkCropForm(){
  return `<form id="zk-form" data-tab="crop" onsubmit="return false"><div class="form-grid">${zf('qty',['كمية المحصول (كلغ)','Harvest quantity (kg)'],'')}${zf('nisab',['النصاب (كلغ)','Nisab (kg)'],653)}<label class="field"><span>${B('طريقة السقي','Irrigation')}</span><select name="mode" class="control"><option value="0.1">${B('مطر أو أنهار بلا تكلفة (10٪)','Rain / natural, no cost (10%)')}</option><option value="0.05">${B('سقي بتكلفة: آبار ومضخات (5٪)','Irrigated at cost: wells/pumps (5%)')}</option><option value="0.075">${B('مختلط بالتساوي (7.5٪)','Mixed equally (7.5%)')}</option></select></label></div><div id="zk-out" class="zk-out" aria-live="polite"></div>${zkNote('تجب عند الحصاد دون اشتراط حول، وتُخرج من عين الحب عند الجمهور. النصاب 5 أوسق ≈ 653 كلغ تقريباً (يقدّره المعاصرون بين نحو 612 و653 حسب الحب والصاع؛ عدّل الخانة بما تفتي به جهتك الشرعية). الجمهور على أن تكاليف الزراعة لا تُخصم قبل الحساب. عند المالكية تجب في الحبوب والقطاني (الفول والعدس والحمص) والتمر والزبيب والزيتون، أما الخضر والفواكه الطرية فيدخل ثمنها في زكاة النقود إن بلغ النصاب وحال الحول. في الأرض المكتراة تكون الزكاة على صاحب الزرع، وأجرة الكراء مال المؤجّر يدخل في زكاة نقوده.','Due at harvest with no one-year condition; paid from the grain itself per the majority. Nisab = 5 awsuq ≈ 653 kg (contemporary estimates range roughly 612–653 kg by grain and sa\'; edit the field to follow your authority). The majority do not deduct farming costs first. Malikis apply it to grains, legumes, dates, raisins and olives; fresh vegetables and fruit enter cash zakat via their sale price once nisab and a year are met. On rented land the zakat is on the crop owner; the rent is the landlord\'s money in his cash zakat.')}</form>`;
}
function zakatHTML(){
  const PA=window.PXA,okT=t=>!PA||(t==='herd'?PA.has('livestock','poultry'):t==='crop'?PA.has('farming','land-rental'):true);
  if(!okT(zkTab))zkTab='trade';
  const tabs=[['trade','زكاة التجارة','Trade'],['herd','زكاة الماشية','Livestock'],['crop','زكاة الحبوب والثمار','Crops']].filter(t=>okT(t[0])).map(t=>`<button type="button" class="${zkTab===t[0]?'active':''}" data-zk-tab="${t[0]}">${B(t[1],t[2])}</button>`).join('');
  return `<div class="section-title">${B('حاسبات الزكاة','Zakat calculators')}</div><div class="panel"><div class="segmented zk-seg" role="tablist">${tabs}</div><div id="zk-body" style="margin-top:12px">${zkBody()}</div></div>`;
}
const zkBody=()=>zkTab==='herd'?zkHerdForm():zkTab==='crop'?zkCropForm():zkTradeForm();
const nm=(l)=>l.map(x=>`${x[0]} × ${B(x[1],x[2])}`).join(' + ');
function camelDue(n){
  if(n<5)return null;
  if(n<=24)return [[Math.floor(n/5),'شاة','sheep']];
  const T=[[35,'بنت مخاض (سنة)','bint makhad (1 yr)',1],[45,'بنت لبون (سنتان)','bint labun (2 yrs)',1],[60,'حقّة (3 سنوات)','hiqqa (3 yrs)',1],[75,'جذعة (4 سنوات)','jadha (4 yrs)',1],[90,'بنت لبون (سنتان)','bint labun (2 yrs)',2],[120,'حقّة (3 سنوات)','hiqqa (3 yrs)',2]];
  for(const t of T)if(n<=t[0])return [[t[3],t[1],t[2]]];
  let best=null;
  for(let b=Math.floor(n/50);b>=0;b--){const a=Math.floor((n-50*b)/40),r=n-50*b-40*a;if(!best||r<best.r)best={a,b,r}}
  return [[best.a,'بنت لبون (سنتان)','bint labun (2 yrs)'],[best.b,'حقّة (3 سنوات)','hiqqa (3 yrs)']].filter(x=>x[0]);
}
function cattleDue(n){
  if(n<30)return null;
  let best=[],min=1e9;
  for(let b=Math.floor(n/40);b>=0;b--){const a=Math.floor((n-40*b)/30),r=n-40*b-30*a;if(r<min){min=r;best=[[a,b]]}else if(r===min)best.push([a,b])}
  return best.slice(0,2).map(([a,b])=>[[a,'تبيع / تبيعة','tabi\' / tabi\'a'],[b,'مسنّة','musinna']].filter(x=>x[0]));
}
const smallDue=n=>n<40?0:n<=120?1:n<=200?2:n<400?3:Math.floor(n/100);
function zakatCalc(){
  const F=$('#zk-form');if(!F)return;const out=$('#zk-out'),v=n=>Math.max(0,parseFloat(F.elements[n]&&F.elements[n].value)||0);
  const tab=F.dataset.tab;
  if(tab==='trade'){
    const base=v('cash')+v('goods')+v('rec')-v('debt'),gold=v('gold'),nis=gold*85;
    if(!gold){out.textContent=B('أدخل سعر غرام الذهب لمعرفة النصاب.','Enter the gold price per gram to see the nisab.');return}
    out.innerHTML=`${B('الوعاء الزكوي','Zakatable base')}: <b>${money(base)}</b><br>${B('النصاب','Nisab')}: <b>${money(nis)}</b><br>${base>=nis?`${B('الزكاة الواجبة (2.5٪)','Zakat due (2.5%)')}: <b>${money(base*0.025)}</b>`:B('لم يبلغ الوعاء النصاب.','The base is below the nisab.')}`;
  }else if(tab==='herd'){
    if(F.elements.trade.checked){out.textContent=B('الأنعام المعدّة للتجارة تُزكّى بقيمتها السوقية 2.5٪ ضمن تبويب «زكاة التجارة».','Livestock held for trade is zakatable on market value at 2.5% under the Trade tab.');return}
    const c=Math.floor(v('cattle')),s=Math.floor(v('small')),k=Math.floor(v('camel')),L=[];
    const row=(ic,name,n,due,min)=>{if(!n)return;L.push(`${ic} ${name}: <b>${n}</b> → ${due?due:B(`دون النصاب (${min})`,`below nisab (${min})`)}`)};
    const cd=cattleDue(c);row('🐄',B('البقر','Cattle'),c,cd?cd.map(nm).join(B(' أو ',' or ')):'',30);
    const sd=smallDue(s);row('🐑',B('الغنم والماعز','Sheep & goats'),s,sd?`${sd} × ${B('شاة','sheep')}`:'',40);
    const kd=camelDue(k);row('🐪',B('الإبل','Camels'),k,kd?nm(kd):'',5);
    out.innerHTML=L.length?L.join('<br>'):B('أدخل أعداد الأنعام.','Enter the livestock counts.');
  }else{
    const q=v('qty'),nis=v('nisab'),rate=parseFloat(F.elements.mode.value);
    if(!q){out.textContent=B('أدخل كمية المحصول بالكيلوغرام.','Enter the harvest quantity in kg.');return}
    const nf=x=>x.toLocaleString(uiLang==='en'?'en-US':'ar-MA',{maximumFractionDigits:2});
    out.innerHTML=q>=nis?`${B('الزكاة الواجبة','Zakat due')} (${rate*100}٪): <b>${nf(q*rate)} ${B('كلغ','kg')}</b><br>${B('الباقي لك','Remaining for you')}: <b>${nf(q-q*rate)} ${B('كلغ','kg')}</b>`:B(`المحصول دون النصاب (${nf(nis)} كلغ).`,`The harvest is below the nisab (${nf(nis)} kg).`);
  }
}

/* ---------- 4) App lock (PIN) ---------- */
const enc=new TextEncoder();
const b64=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
const unb=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function hashPin(pin,salt){const k=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:150000},k,256))}
const getPin=()=>{try{return JSON.parse(localStorage.getItem(PK)||'null')}catch(e){return null}};
const canPin=()=>!!(window.crypto&&crypto.subtle);
let locked=false,hiddenAt=0;
function setInert(on){['#app-screen','#auth-screen','#modal-root'].forEach(s=>{const e=$(s);if(e)e.inert=on})}
function buildLock(){
  if($('#lock-screen'))return;
  const d=document.createElement('div');d.id='lock-screen';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
  d.innerHTML=`<div class="lock-card"><div class="brand-mark">د</div><h2 id="lock-title"></h2><p id="lock-sub"></p><input id="lock-input" class="control" type="password" inputmode="numeric" autocomplete="off" maxlength="8"><div id="lock-msg" role="alert"></div><button type="button" id="lock-go" class="btn btn-primary"></button><small id="lock-forgot"></small></div>`;
  document.body.append(d);
  $('#lock-go').onclick=tryUnlock;
  $('#lock-input').addEventListener('keydown',e=>{if(e.key==='Enter')tryUnlock()});
}
function lockTexts(){$('#lock-title').textContent=B('التطبيق مقفل','App locked');$('#lock-sub').textContent=B('أدخل رمز القفل لفتح دفترك','Enter your PIN to open your ledger');$('#lock-input').setAttribute('aria-label',B('رمز القفل','PIN'));$('#lock-go').textContent=B('فتح','Unlock');$('#lock-forgot').textContent=B('نسيت الرمز؟ لا يمكن استرجاعه؛ يلزم حذف بيانات التطبيق من إعدادات الجهاز ثم استرجاع نسخة احتياطية.','Forgot it? It cannot be recovered; you must clear app data in device settings and restore a backup.')}
function lockNow(){
  if(!getPin()||!canPin())return;buildLock();locked=true;lockTexts();$('#lock-screen').hidden=false;setInert(true);$('#lock-input').value='';$('#lock-msg').textContent='';setTimeout(()=>$('#lock-input').focus(),50);
}
async function tryUnlock(){
  const p=getPin();if(!p){unlockNow();return}
  let f={n:0,until:0};try{f=JSON.parse(localStorage.getItem(FK)||'')||f}catch(e){}
  const wait=f.until-Date.now();
  if(wait>0){$('#lock-msg').textContent=B(`حاول بعد ${Math.ceil(wait/1000)} ثانية`,`Try again in ${Math.ceil(wait/1000)} s`);return}
  const h=await hashPin($('#lock-input').value,unb(p.salt));
  if(h===p.hash){try{localStorage.removeItem(FK)}catch(e){}unlockNow();return}
  f.n++;if(f.n>=5)f.until=Date.now()+Math.min(300,30*(f.n-4))*1000;
  try{localStorage.setItem(FK,JSON.stringify(f))}catch(e){}
  $('#lock-input').value='';$('#lock-msg').textContent=B('الرمز غير صحيح','Incorrect PIN');
}
function unlockNow(){locked=false;$('#lock-screen').hidden=true;setInert(false);hiddenAt=0}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){hiddenAt=Date.now()}
  else if(hiddenAt&&!locked&&Date.now()-hiddenAt>IDLE)lockNow();
});

function pinDialog(mode){
  const has=!!getPin(),needCur=has&&mode!=='set',needNew=mode!=='off';
  const inp=(id,l)=>`<label class="field"><span>${l}</span><input id="${id}" class="control" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></label>`;
  const title={set:B('تفعيل رمز القفل','Enable app lock'),change:B('تغيير رمز القفل','Change PIN'),off:B('إلغاء رمز القفل','Disable app lock')}[mode];
  $('#modal-root').innerHTML=`<div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h2>${esc(title)}</h2></div><div class="form-grid" style="margin:12px 0">${needCur?inp('pin-cur',B('الرمز الحالي','Current PIN')):''}${needNew?inp('pin-new',B('رمز جديد (4–8 أرقام)','New PIN (4–8 digits)'))+inp('pin-new2',B('تأكيد الرمز','Confirm PIN')):''}</div><div id="pin-msg" class="form-note" role="alert"></div><div class="form-footer"><button type="button" class="btn btn-outline" data-action="modal-close">${B('إلغاء','Cancel')}</button><button type="button" class="btn btn-primary" id="pin-ok">${B('حفظ','Save')}</button></div></div>`;
  $('#modal-root').hidden=false;
  const err=t=>{$('#pin-msg').textContent=t};
  $('#pin-ok').onclick=async()=>{
    if(needCur){const p=getPin();if(await hashPin($('#pin-cur').value,unb(p.salt))!==p.hash)return err(B('الرمز الحالي غير صحيح','Current PIN is incorrect'))}
    if(mode==='off'){localStorage.removeItem(PK);closeModal();toast(B('أُلغي القفل','Lock disabled'),'success');render();return}
    const a=$('#pin-new').value;
    if(!/^\d{4,8}$/.test(a))return err(B('الرمز يجب أن يكون من 4 إلى 8 أرقام','PIN must be 4 to 8 digits'));
    if(a!==$('#pin-new2').value)return err(B('الرمزان غير متطابقين','PINs do not match'));
    const salt=crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(PK,JSON.stringify({salt:b64(salt),hash:await hashPin(a,salt)}));
    closeModal();toast(B('تم تفعيل القفل','Lock enabled'),'success');render();
  };
  setTimeout(()=>{const f=$('#pin-cur')||$('#pin-new');if(f)f.focus()},50);
}
function lockPanel(){
  const has=!!getPin();
  const body=!canPin()?`<div class="notice">${B('القفل غير متاح في هذا المتصفح.','App lock is not available in this browser.')}</div>`:`<div class="notice ${has?'success':'info'}" style="margin-bottom:12px">${has?B('القفل مفعّل: يُطلب الرمز عند الفتح وبعد دقيقة من مغادرة التطبيق.','Lock is on: the PIN is asked at launch and after a minute away.'):B('قفل اختياري يحجب الشاشة عمّن يلتقط جهازك. لا يشفّر البيانات المخزّنة؛ للحماية الكاملة استعمل قفل الجهاز أيضاً.','Optional lock that hides the screen from anyone picking up your device. It does not encrypt stored data; also use your device lock.')}</div><div class="toolbar-right" style="display:flex;gap:8px;flex-wrap:wrap">${has?`<button class="btn btn-outline" data-px="pin-change">${B('تغيير الرمز','Change PIN')}</button><button class="btn btn-outline" data-px="pin-off">${B('إلغاء القفل','Disable lock')}</button>`:`<button class="btn btn-primary" data-px="pin-set">${B('تفعيل القفل برمز','Enable PIN lock')}</button>`}<a class="btn btn-outline" href="./privacy.html" target="_blank" rel="noopener">${B('سياسة الخصوصية','Privacy policy')}</a></div>`;
  return `<div class="stack" style="margin-top:14px">${panel('قفل التطبيق',body)}</div>`;
}


/* ---------- richer demo data (all flagged isDemo so "clear demo" removes it) ---------- */
const _seed=seedDemo;
seedDemo=function(){
  const had=recordsLive().some(r=>r.isDemo);_seed();
  if(had||!settingsWrite())return;
  const d=today(),cow=createDoc('animals',{isDemo:true,name:'بقرة حلوب تجريبية',species:'cattle',tag:'DEMO-C02',breed:'هولشتاين',mother:'DEMO-C00',father:'DEMO-B07',birth:'2021-03-10',sex:'أنثى',feed:'برسيم + علف مركب',location:'الحظيرة 1',notes:'سجل توضيحي فقط'});
  createDoc('animals',{isDemo:true,name:'عجل تجريبي',species:'cattle',tag:'DEMO-C03',breed:'هولشتاين',mother:'DEMO-C02',father:'DEMO-B07',birth:'2026-02-14',sex:'ذكر',feed:'حليب وعلف مركّز',location:'الحظيرة 1',notes:'سجل توضيحي فقط'});
  createDoc('animals',{isDemo:true,name:'ديك تجريبي',species:'rooster',tag:'DEMO-R01',breed:'بلدي',mother:'',father:'',birth:'2026-05-01',sex:'ذكر',feed:'ذرة وشعير',location:'الدجاجية',notes:'سجل توضيحي فقط'});
  createDoc('events',{isDemo:true,animalId:cow.id,type:'vaccine',date:d,time:'09:00',feed:'',cost:60,detail:'تلقيح موسمي (مثال توضيحي)'});
  createDoc('lands',{isDemo:true,name:'أرض مؤجّرة تجريبية',location:'ضواحي المدينة',area:'3 هكتار',role:'landlord',person:'مكتري تجريبي',start:d,end:'',rent:4000,cycle:'سنوي',crop:'',water:'بئر',notes:'مثال توضيحي — ليس عقداً قانونياً'});
  commit({message:'بيانات تجريبية أضيفت'});
};

/* ---------- wiring ---------- */
const _re=renderEthics;renderEthics=function(){return _re()+guideHTML()+zakatHTML()};
const _rs=renderSettings;renderSettings=function(){return _rs()+lockPanel()};
Object.assign(EN,{'قفل التطبيق':'App lock'});

document.addEventListener('click',e=>{
  const zt=e.target.closest('[data-zk-tab]');
  if(zt){zkTab=zt.dataset.zkTab;document.querySelectorAll('[data-zk-tab]').forEach(x=>x.classList.toggle('active',x===zt));$('#zk-body').innerHTML=zkBody();zakatCalc();return}
  const c=e.target.closest('[data-rule-f]');
  if(c){ruleF=c.dataset.ruleF;document.querySelectorAll('[data-rule-f]').forEach(x=>x.classList.toggle('active',x===c));$('#rule-list').innerHTML=ruleCards();return}
  const p=e.target.closest('[data-px]');
  if(p){const m={ 'pin-set':'set','pin-change':'change','pin-off':'off'}[p.dataset.px];if(m)pinDialog(m)}
});
document.addEventListener('input',e=>{
  if(e.target.id==='rule-q'){ruleQ=e.target.value;$('#rule-list').innerHTML=ruleCards();return}
  if(e.target.closest&&e.target.closest('#zk-form'))zakatCalc();
});
new MutationObserver(()=>{if($('#zk-form')&&!$('#zk-out').dataset.init){$('#zk-out').dataset.init='1';zakatCalc()}}).observe(document.body,{childList:true,subtree:true});

buildLock();lockNow();
if(typeof workspace!=='undefined'&&workspace)render();
})();
