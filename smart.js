/* smart.js — onboarding, activity-based filtering, hidden-expense engine, pricing assistant, fast entry, reports & sharing */
(function(){
'use strict';
const B=(a,e)=>uiLang==='en'?e:a;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const P=()=>(typeof state!=='undefined'&&state.prefs)||{};
const r2=x=>Math.round((Number(x)||0)*100)/100;
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const wsId=()=>(typeof workspace!=='undefined'&&workspace&&workspace.id)||'x';

/* ================= activities ================= */
const ACTS=[
['general','🛍️','تجارة عامة','General trade'],['retail','🏪','بيع بالتجزئة','Retail'],['wholesale','📦','بيع بالجملة','Wholesale'],
['electronics','📱','إلكترونيات','Electronics'],['clothing','👕','ملابس','Clothing'],['food','🥖','مواد غذائية','Food'],
['livestock','🐄','تربية المواشي','Livestock'],['poultry','🐓','الدواجن','Poultry'],['farming','🌾','فلاحة','Farming'],
['land-rental','🗺️','كراء الأراضي','Land rental'],['crafts','🔧','صيانة وحرف','Repairs & crafts'],['services','🚚','خدمات ونقل','Services & transport']];
const actsSel=()=>{const a=P().activities;return Array.isArray(a)&&a.length?a:null};
const has=(...ids)=>{const a=actsSel();return !a||ids.some(i=>a.includes(i))};
const PAGE_NEEDS={livestock:['livestock','poultry'],lands:['farming','land-rental'],repairs:['crafts','services']};
const ACT_PAGE={'new-repair':'repairs','focus-animal':'livestock','focus-land':'lands'};
window.PXA={
  has,acts:actsSel,
  pageOk:p=>PAGE_NEEDS[p]?has(...PAGE_NEEDS[p]):true,
  actionOk:a=>ACT_PAGE[a]?window.PXA.pageOk(ACT_PAGE[a]):true,
  list:ACTS
};
const SUGG={
electronics:['هاتف ذكي','شاحن','سماعات','كابل','بطارية خارجية','لابتوب','تلفاز','راوتر','شاشة'],
clothing:['قميص','سروال','جلباب','حذاء','فستان','معطف','قفطان'],
food:['سكر','زيت','دقيق','شاي','حليب','أرز','عسل','بيض'],
livestock:['بقرة','عجل','ثور','خروف','كبش','نعجة','ماعز'],
poultry:['دجاج','ديك','فروج','بيض'],
farming:['قمح','شعير','ذرة','زيتون','بذور','سماد','خضر'],
crafts:['إصلاح هاتف','إصلاح حاسوب','صيانة','قطع غيار'],
services:['نقل بضاعة','توصيل','تركيب'],
general:['سلعة','بضاعة'],retail:['سلعة','بضاعة'],wholesale:['كمية جملة'],'land-rental':['كراء أرض']};
const lastAct=()=>LS('px-act:'+wsId());
const _ao=activityOptions;
activityOptions=function(selected){
  const a=actsSel(),all=categoryDefs(state.activities,DEFAULT_ACTIVITIES);
  const rows=a?all.filter(x=>!x.default||a.includes(x.id)||x.id===selected):all;
  let sel=selected;
  if(!sel&&!editingId){const l=lastAct();sel=(l&&rows.some(x=>x.id===l))?l:(a&&a.length===1?a[0]:'')}
  return optionList(rows,sel,'اختر النشاط');
};
async function savePrefs(patch,msg){
  state.prefs={...state.prefs,...patch,_updatedAt:Date.now()};
  await commit({message:msg||'تم حفظ الإعدادات'});
}

/* ================= auto category ================= */
const KW=[
['cattle',/بقر|عجل|ثور|عجول|cow|bull|calf|vache|veau/i],
['sheep-goats',/خروف|كبش|نعج|غنم|ماعز|معز|شاة|أضحي|اضحي|sheep|goat|ram\b|mouton|chevre|chèvre/i],
['poultry',/دجاج|ديك|فروج|بط\b|ديوك|حبش|poul|chicken|rooster|hen\b/i],
['feed',/علف|تبن|نخالة|برسيم|فصة|feed|fodder|aliment/i],
['crops',/قمح|شعير|ذرة|فول|عدس|حمص|زيتون|بطاطس|طماطم|بصل|خضر|فواكه|بذور|wheat|barley|corn|olive|crop|blé/i],
['electronics',/هاتف|موبايل|جوال|لابتوب|حاسوب|كمبيوتر|تلفاز|تلفزيون|شاحن|سماع|كابل|بطارية|شاشة|راوتر|طابعة|iphone|samsung|laptop|phone|\btv\b|charger|écran|ecran/i],
['clothing',/قميص|سروال|حذاء|جلباب|فستان|معطف|ملابس|قفطان|سترة|shirt|jean|shoe|dress|robe|jacket/i],
['food',/سكر|زيت|دقيق|حليب|شاي|قهوة|أرز|ارز|معكرونة|عسل|بيض|لحم|سمك|جبن|خبز|sugar|oil|flour|milk|tea|rice|honey|egg|meat/i],
['equipment',/جرار|مضخة|محرك|آلة|ماكينة|معدات|أداة|اداة|tractor|pump|engine|machine|tool/i],
['services',/إصلاح|اصلاح|صيانة|خدمة|نقل|توصيل|تركيب|repair|service|delivery|install/i]];
const ACT_DEF={electronics:'electronics',clothing:'clothing',food:'food',livestock:'general',poultry:'poultry',farming:'crops','land-rental':'services',crafts:'services',services:'services',general:'general',retail:'general',wholesale:'general'};
const ANIMAL_GOODS=['cattle','sheep-goats','poultry'];
function classify(item,act){
  const t=(item||'').trim();if(!t)return ACT_DEF[act]||'general';
  const k=t.toLowerCase(),prev=recordsLive().find(r=>r.goodType&&(r.item||'').trim().toLowerCase()===k);
  if(prev)return prev.goodType;
  for(const [g,rx] of KW)if(rx.test(t))return g;
  return ACT_DEF[act]||'general';
}
const goodLabel=id=>{const g=categoryDefs(state.goods,DEFAULT_GOODS).find(x=>x.id===id);return g?choiceText(g):''};
window.autoCategoryField=function(edit){
  return `<div class="field full px-catbox"><span>${B('التصنيف (تلقائي)','Category (auto)')}</span><div class="px-cat"><b id="px-cat-label">${esc(edit?.goodType?goodLabel(edit.goodType):'—')}</b><em>${B('يُحدَّد من اسم السلعة والنشاط','Detected from item name and activity')}</em><button type="button" class="btn btn-outline btn-small" data-px="cat-edit">${B('تغيير','Change')}</button></div><select name="goodType" class="control" hidden>${goodsOptions(edit?.goodType||'')}</select></div>`;
};

/* ================= expenses engine ================= */
const EXP=[
['rent','🏬','كراء المحل (حصة الصفقة)','Shop rent share'],['wages','👷','أجرة العمال','Workers wages'],
['transport','🚚','النقل والشحن','Transport'],['food','🍽️','الأكل والمشروبات','Meals & drinks'],
['utilities','💡','كهرباء وماء وإنترنت','Utilities'],['pack','📦','تغليف وأكياس','Packaging'],
['commission','🤝','عمولة ووساطة','Commission'],['phone','📞','اتصالات','Phone & calls'],
['tax','🧾','ضرائب ورسوم','Taxes & fees'],['loss','🗑️','ضياع وتلف','Loss & spoilage'],['other','➕','مصاريف أخرى','Other']];
const EXPN=Object.fromEntries(EXP.map(x=>[x[0],[x[2],x[3]]]).concat([['feed',['علف','Feed']],['vet',['أدوية وتلقيح','Vet & vaccines']],['care',['مأوى وعمالة التربية','Housing & rearing labour']],['legacy',['مصاريف غير مفصّلة','Unitemised expenses']]]));
const expName=k=>{const n=EXPN[k];return n?B(n[0],n[1]):k};
window.expensesTotalField=function(edit){
  return `<label class="field"><span>${B('إجمالي المصاريف (يُحسب من التفاصيل أدناه)','Total expenses (from the breakdown below)')}</span><input name="expenses" type="number" readonly class="px-ro" value="${esc(edit?.expenses??edit?.exp??0)}"></label>`;
};
window.dealExpenseSection=function(edit){
  const items=Object.fromEntries((edit?.expenseItems||[]).map(x=>[x.k,x.v]));
  const legacy=(!edit?.expenseItems?.length&&num(edit?.expenses??edit?.exp)>0)?num(edit?.expenses??edit?.exp):0;
  const rr=edit?.rearing||{};
  const cell=(k,ic,l,v)=>`<label class="px-exp-cell"><span>${ic} ${esc(l)}</span><input type="number" min="0" step="any" inputmode="decimal" data-exp="${k}" value="${v!==undefined?v:''}" placeholder="0"></label>`;
  const rf=(k,l,v)=>`<label class="px-exp-cell"><span>${l}</span><input type="number" min="0" step="any" inputmode="decimal" data-rear="${k}" value="${v||''}" placeholder="0"></label>`;
  return `<section class="form-section px-exp" id="px-exp"><h4>💡 ${B('المصاريف الخفية','Hidden expenses')}</h4>
<p>${B('هي ما يفرّق التاجر الماهر عن المبتدئ. سجّل كل ما أنفقته على هذه الصفقة؛ وإن حدّدت الكراء والأجور في الإعدادات وُزّعت عليها تلقائياً.','These separate the skilled trader from the beginner. Record everything spent on this deal; fixed rent and wages from Settings are spread across deals automatically.')}</p>
<div class="px-exp-grid">${EXP.map(x=>cell(x[0],x[1],B(x[2],x[3]),items[x[0]])).join('')}${legacy?cell('legacy','📋',expName('legacy'),legacy):''}</div>
<div id="px-autochip" class="px-hint" hidden></div>
<div id="px-rearing" class="px-rear" hidden><h5>🐄 ${B('تكلفة التربية (للمواشي والدواجن)','Rearing cost (livestock & poultry)')}</h5><div class="px-exp-grid">${rf('days',B('مدة التربية (أيام)','Rearing days'),rr.days)}${rf('feedDay',B('علف الرأس يومياً','Feed per head per day'),rr.feedDay)}${rf('vet',B('أدوية وتلقيح (إجمالي)','Vet & vaccines (total)'),rr.vet)}${rf('careDay',B('مأوى وعمالة يومياً (للقطيع)','Housing & labour per day (herd)'),rr.careDay)}</div><div id="px-rear-calc" class="px-hint"></div></div>
<input type="hidden" name="expenseItems" id="px-items"><input type="hidden" name="rearing" id="px-rear">
<div class="px-total"><span>${B('إجمالي المصاريف','Total expenses')}</span><b id="px-exp-total">${money(edit?.expenses??edit?.exp??0)}</b></div>
<div id="px-alert"></div><div id="px-pricing"></div></section>`;
};
const DEFM={electronics:[5,12,25],clothing:[10,25,50],food:[3,8,15],general:[5,12,25],retail:[5,12,25],wholesale:[2,5,10],livestock:[5,12,25],poultry:[5,12,25],farming:[5,15,30],'land-rental':[0,0,0],crafts:[20,40,80],services:[20,40,80]};
const margins=a=>{const g=P().margins;return(g&&num(g.target)>0)?[num(g.min),num(g.target),num(g.max)]:(DEFM[a]||DEFM.general)};
const dealForm=()=>document.querySelector('form[data-form="deal"]');
const animalish=f=>{const a=f.elements.activity.value,g=f.elements.goodType.value;return ['livestock','poultry'].includes(a)||ANIMAL_GOODS.includes(g)};
function gather(f){
  const items=[];
  f.querySelectorAll('[data-exp]').forEach(i=>{const v=num(i.value);if(v>0)items.push({k:i.dataset.exp,l:expName(i.dataset.exp),v:r2(v)})});
  const qty=Math.max(0,num(f.elements.qty.value)),rg=$('#px-rearing'),on=rg&&!rg.hidden;
  const R={days:0,feedDay:0,vet:0,careDay:0};
  if(on){f.querySelectorAll('[data-rear]').forEach(i=>R[i.dataset.rear]=num(i.value));
    const feed=qty*R.days*R.feedDay,care=R.days*R.careDay;
    if(feed>0)items.push({k:'feed',l:expName('feed'),v:r2(feed)});
    if(R.vet>0)items.push({k:'vet',l:expName('vet'),v:r2(R.vet)});
    if(care>0)items.push({k:'care',l:expName('care'),v:r2(care)});
    const c=$('#px-rear-calc');if(c)c.textContent=feed>0?`${B('العلف','Feed')}: ${qty} × ${R.days} × ${R.feedDay} = ${money(feed)}`:B('أدخل المدة وتكلفة العلف اليومية لتُحسب تكلفة التربية.','Enter days and daily feed cost to compute rearing cost.')}
  return{items,total:r2(items.reduce((s,x)=>s+x.v,0)),R:on?R:null,qty};
}
function recalc(f){
  const g=gather(f);
  $('#px-items').value=JSON.stringify(g.items);$('#px-rear').value=g.R?JSON.stringify(g.R):'';
  const ex=f.elements.expenses;ex.value=g.total;
  $('#px-exp-total').textContent=money(g.total);
  ex.dispatchEvent(new Event('input',{bubbles:true}));
  const buy=num(f.elements.purchase.value),sale=num(f.elements.sale.value),qty=g.qty||1;
  const lv=$('#px-live');
  if(lv){const cost=buy+g.total,net=sale-cost;if(buy>0||sale>0){lv.hidden=false;lv.className='px-live '+(net<0?'bad':net===0?'':'good');lv.innerHTML=`<span>${B('التكلفة الحقيقية','True cost')}<b>${money(cost)}</b></span><span>${B('الربح الصافي','Net profit')}<b>${money(net)}</b></span><span>${B('الهامش','Margin')}<b>${sale>0?(net/sale*100).toFixed(1)+'٪':'—'}</b></span>`}else lv.hidden=true}
  const al=$('#px-alert');
  if(buy>0&&g.total===0)al.innerHTML=`<div class="px-warn">⚠️ ${B('لم تُدخل أي مصاريف! النقل والكراء والأجور والأكل تأكل من ربحك حتى لو لم تلحظها.','No expenses entered! Transport, rent, wages and meals eat your profit even when unnoticed.')}</div>`;
  else if(buy>0&&g.total/buy>0.15)al.innerHTML=`<div class="px-warn">📊 ${B(`مصاريفك تمثل ${(g.total/buy*100).toFixed(0)}٪ من ثمن الشراء، وهي مرتفعة؛ تأكد أنها محسوبة في سعر البيع.`,`Expenses are ${(g.total/buy*100).toFixed(0)}% of the purchase price — high; make sure the sale price covers them.`)}</div>`;
  else al.innerHTML='';
  const box=$('#px-pricing');
  if(!(buy>0)){box.innerHTML=`<div class="px-hint">${B('أدخل ثمن الشراء لتظهر لك الأسعار المقترحة للبيع.','Enter the purchase price to see suggested selling prices.')}</div>`;return}
  const unit=(buy+g.total)/qty,m=margins(f.elements.activity.value||'general'),pr=m.map(x=>unit*(1+x/100));
  const su=sale/qty;
  let verdict='';
  if(sale>0){
    if(su<unit)verdict=`<div class="px-v bad">🔻 ${B(`بيع بخسارة: السعر أقل من التكلفة الحقيقية بـ ${money(unit-su)} للوحدة`,`Selling at a loss: ${money(unit-su)} below true cost per unit`)}</div>`;
    else if(su<pr[0])verdict=`<div class="px-v warn">⚠️ ${B('ربح ضعيف: أقل من الحد الأدنى المقترح','Thin profit: below the suggested minimum')}</div>`;
    else if(su<=pr[2])verdict=`<div class="px-v good">✅ ${B('سعر جيد ضمن النطاق المقترح','Good price within the suggested range')}</div>`;
    else verdict=`<div class="px-v info">ℹ️ ${B('أعلى من السقف المقترح؛ قد يصعب البيع','Above the suggested ceiling; may be hard to sell')}</div>`;
  }
  const tile=(l,v,c)=>`<div class="px-pt ${c||''}"><small>${l}</small><b>${money(v)}</b>${qty>1?`<i>× ${qty} = ${money(v*qty)}</i>`:''}</div>`;
  box.innerHTML=`<div class="px-pricing"><div class="px-ph">🧮 ${B('المسعّر الذكي','Smart pricer')} <small>${B('التكلفة الحقيقية للوحدة','True unit cost')}: <b>${money(unit)}</b></small></div><div class="px-pgrid">${tile(B('التعادل (بلا ربح)','Break-even'),unit,'be')}${tile(`${B('الأدنى','Min')} +${m[0]}٪`,pr[0])}${tile(`${B('المقترح','Target')} +${m[1]}٪`,pr[1],'tg')}${tile(`${B('السقف','Ceiling')} +${m[2]}٪`,pr[2])}</div>${verdict}<button type="button" class="btn btn-outline btn-small" data-px="use-price">${B('اعتمد السعر المقترح','Use suggested price')}</button></div>`;
}
const itemText=f=>{const it=f.elements.namedItem('item');if(it)return it.value||'';const c=f.elements.namedItem('catalogItemId');return(c&&c.value&&c.selectedOptions&&c.selectedOptions[0])?c.selectedOptions[0].text.split(' · ')[0]:''};
function syncCategory(f,force){
  const sel=f.elements.goodType;
  if(force||!f.dataset.manualCat){
    const g=classify(itemText(f),f.elements.activity.value);
    if(g&&[...sel.options].some(o=>o.value===g))sel.value=g;
  }
  const l=$('#px-cat-label');if(l)l.textContent=goodLabel(sel.value)||'—';
  const an=f.elements.animalId;if(an){const lab=an.closest('label');if(lab)lab.hidden=!(animalish(f)||an.value)}
  const rg=$('#px-rearing');if(rg)rg.hidden=!animalish(f);
}
function lastDealHint(f){
  const box=$('#px-last');if(!box)return;
  const k=itemText(f).trim().toLowerCase();
  if(k.length<2){box.hidden=true;return}
  const r=recordsLive().filter(x=>['deal','buy'].includes(x.kind)&&x.id!==editingId&&(x.item||'').trim().toLowerCase()===k).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
  if(!r){box.hidden=true;return}
  const q=num(r.qty)||1,b=num(r.purchase??r.buy)/q,s=num(r.sale??r.sell)/q,days=Math.max(0,Math.round((Date.now()-new Date((r.date||today())+'T12:00:00'))/864e5));
  box.dataset.id=r.id;box.hidden=false;
  box.innerHTML=`🕘 ${B(`آخر مرة (قبل ${days} يوم): شراء ${money(b)} · بيع ${money(s)} للوحدة`,`Last time (${days} d ago): buy ${money(b)} · sell ${money(s)} per unit`)} <button type="button" class="btn btn-outline btn-small" data-px="use-last">${B('طبّقها على الكمية','Apply to quantity')}</button>`;
}
function autoOverhead(f,edit){
  const fx=P().fixed||{},d=num(fx.deals);
  if(edit||!fx.auto||!(d>0))return;
  let any=false;
  for(const [k,src] of [['rent','rent'],['wages','wages'],['utilities','utilities'],['other','other']]){
    const v=num(fx[src])/d,i=f.querySelector(`[data-exp="${k}"]`);
    if(v>0&&i&&!i.value){i.value=r2(v);any=true}
  }
  const c=$('#px-autochip');
  if(any&&c){c.hidden=false;c.innerHTML=`🏬 ${B('وُزّعت تلقائياً حصة الكراء والأجور والمصاريف الثابتة على هذه الصفقة (قابلة للتعديل).','Fixed rent, wages and overheads were spread on this deal automatically (editable).')} <button type="button" class="btn btn-outline btn-small" data-px="clear-auto">${B('إلغاء','Remove')}</button>`}
}
function initDealForm(){
  const f=dealForm();if(!f||f.dataset.px)return;f.dataset.px='1';
  const edit=editingId?docById('records',editingId):null;
  if(edit&&edit.goodType)f.dataset.manualCat='1';
  const lv=document.createElement('div');lv.id='px-live';lv.className='px-live';lv.hidden=true;lv.setAttribute('aria-live','polite');f.appendChild(lv);
  autoOverhead(f,edit);syncCategory(f,!edit);lastDealHint(f);recalc(f);
}

/* ---------- datalists ---------- */
window.itemSuggestions=function(){
  const seen=new Set(),out=[],add=n=>{n=(n||'').trim();if(n&&!seen.has(n.toLowerCase())){seen.add(n.toLowerCase());out.push(n)}};
  liveDocs('catalog').forEach(x=>add(x.name));
  const cnt=new Map();recordsLive().forEach(r=>{if(['deal','buy'].includes(r.kind)&&r.item)cnt.set(r.item.trim(),(cnt.get(r.item.trim())||0)+1)});
  [...cnt.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60).forEach(([n])=>add(n));
  (actsSel()||Object.keys(SUGG)).forEach(a=>(SUGG[a]||[]).forEach(add));
  return out.map(n=>`<option value="${esc(n)}"></option>`).join('');
};
window.contactLists=function(){
  const sup=new Set(),cus=new Set();
  recordsLive().forEach(r=>{const s=r.supplier||r.sn,c=r.customer||r.cn;if(s)sup.add(s);if(c)cus.add(c)});
  const o=s=>[...s].map(n=>`<option value="${esc(n)}"></option>`).join('');
  return `<datalist id="px-suppliers">${o(sup)}</datalist><datalist id="px-customers">${o(cus)}</datalist>`;
};
function fillPhone(f,nameField,phoneField,keys){
  const nm=f.elements[nameField].value.trim().toLowerCase(),ph=f.elements[phoneField];
  if(!nm||ph.value)return;
  const r=recordsLive().find(x=>(x[keys[0]]||x[keys[1]]||'').toLowerCase()===nm&&(x[keys[2]]||x[keys[3]]));
  if(r)ph.value=r[keys[2]]||r[keys[3]];
}

/* ---------- duplicate a deal ---------- */
function enhanceDeals(){
  document.querySelectorAll('button[data-action="edit"][data-kind="deal"]').forEach(b=>{
    if(b.previousElementSibling&&b.previousElementSibling.dataset.px==='dup')return;
    const d=document.createElement('button');d.type='button';d.className='icon-action-sm';d.dataset.px='dup';d.dataset.id=b.dataset.id;d.title=B('تكرار الصفقة','Duplicate deal');d.setAttribute('aria-label',d.title);d.textContent='⧉';
    b.parentNode.insertBefore(d,b);
  });
}
function duplicateDeal(id){
  const r=docById('records',id);if(!r)return;
  editingId=null;currentPage='deals';render();
  const f=dealForm();if(!f)return;
  const set=(n,v)=>{if(f.elements[n]&&v!==undefined&&v!==null)f.elements[n].value=v};
  set('activity',r.activity||'');set('item',r.item);set('qty',r.qty||1);
  set('supplier',r.supplier||r.sn||'');set('supplierPhone',r.supplierPhone||r.sp||'');set('customer',r.customer||r.cn||'');set('customerPhone',r.customerPhone||r.cp||'');
  set('purchase',r.purchase??r.buy??'');set('sale',r.sale??r.sell??'');set('method',r.method||'نقداً');
  f.querySelectorAll('[data-exp]').forEach(i=>i.value='');
  (r.expenseItems||[]).forEach(x=>{const i=f.querySelector(`[data-exp="${x.k}"]`);if(i&&!['feed','vet','care'].includes(x.k))i.value=x.v});
  if(r.rearing)f.querySelectorAll('[data-rear]').forEach(i=>{i.value=r.rearing[i.dataset.rear]||''});
  const ch=$('#px-autochip');if(ch)ch.hidden=true;
  syncCategory(f,true);lastDealHint(f);recalc(f);
  requestAnimationFrame(()=>{if(f.isConnected&&f.elements.item&&!f.elements.item.value&&r.item){f.elements.item.value=r.item;syncCategory(f,true);lastDealHint(f)}});
  scrollToForm('deal');toast(B('نُسخت بيانات الصفقة؛ عدّل ما يلزم ثم احفظ.','Deal copied — adjust and save.'));
}

/* ---------- events ---------- */
document.addEventListener('input',e=>{
  const f=e.target.closest&&e.target.closest('form[data-form="deal"]');if(!f||!f.dataset.px||e.target.name==='expenses')return;
  const n=e.target.name;
  if(n==='item'){syncCategory(f);lastDealHint(f)}
  recalc(f);
});
document.addEventListener('change',e=>{
  const f=e.target.closest&&e.target.closest('form[data-form="deal"]');if(!f||!f.dataset.px)return;
  const n=e.target.name;
  if(n==='catalogItemId'){syncCategory(f);lastDealHint(f);recalc(f)}
  else if(n==='goodType'){f.dataset.manualCat='1';syncCategory(f)}
  else if(n==='activity'){LS('px-act:'+wsId(),e.target.value);syncCategory(f);recalc(f)}
  else if(n==='supplier')fillPhone(f,'supplier','supplierPhone',['supplier','sn','supplierPhone','sp']);
  else if(n==='customer')fillPhone(f,'customer','customerPhone',['customer','cn','customerPhone','cp']);
});
document.addEventListener('submit',e=>{
  const f=e.target.closest&&e.target.closest('form[data-form="deal"]');if(!f||!f.dataset.px||f.dataset.expOk==='1')return;
  const g=gather(f);
  if(g.total===0&&num(f.elements.purchase.value)>0){
    e.preventDefault();e.stopImmediatePropagation();
    askConfirm(B('لم تُدخل أي مصاريف لهذه الصفقة. النقل والكراء والأجور والأكل تؤثر على ربحك الحقيقي. هل تريد الحفظ دون مصاريف؟','You entered no expenses. Transport, rent, wages and meals affect your real profit. Save without expenses?'),{ok:B('احفظ دون مصاريف','Save anyway'),cancel:B('سأضيف المصاريف','I will add them'),danger:false}).then(ok=>{
      if(ok){f.dataset.expOk='1';f.requestSubmit()}else{const s=$('#px-exp');if(s){s.scrollIntoView({behavior:'smooth',block:'center'});const i=s.querySelector('[data-exp="transport"]');if(i)i.focus()}}
    });
  }
},true);
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-px]');if(!b)return;
  const k=b.dataset.px,f=dealForm();
  if(k==='cat-edit'&&f){const s=f.elements.goodType;s.hidden=!s.hidden;if(!s.hidden)s.focus()}
  else if(k==='use-price'&&f){
    const g=gather(f),buy=num(f.elements.purchase.value),qty=g.qty||1,m=margins(f.elements.activity.value||'general');
    f.elements.sale.value=r2(((buy+g.total)/qty)*(1+m[1]/100)*qty);recalc(f);toast(B('اعتُمد السعر المقترح','Suggested price applied'));
  }else if(k==='use-last'&&f){
    const r=docById('records',($('#px-last')||{dataset:{}}).dataset.id);if(!r)return;
    const q=Math.max(1,num(f.elements.qty.value)||1),oq=num(r.qty)||1;
    f.elements.purchase.value=r2(num(r.purchase??r.buy)/oq*q);f.elements.sale.value=r2(num(r.sale??r.sell)/oq*q);
    if(!f.elements.activity.value&&r.activity)f.elements.activity.value=r.activity;
    if(f.elements.supplier&&!f.elements.supplier.value)f.elements.supplier.value=r.supplier||r.sn||'';
    recalc(f);toast(B('طُبّقت أسعار آخر صفقة','Last deal prices applied'));
  }else if(k==='clear-auto'&&f){['rent','wages','utilities','other'].forEach(n=>{const i=f.querySelector(`[data-exp="${n}"]`);if(i)i.value=''});$('#px-autochip').hidden=true;recalc(f)}
  else if(k==='dup')duplicateDeal(b.dataset.id);
  else if(k==='report-open')window.PXR.open();
});

/* ================= Settings panels ================= */
function activitiesPanel(){
  const sel=actsSel()||[];
  const chips=ACTS.map(a=>`<button type="button" class="px-act ${sel.includes(a[0])?'on':''}" data-pxact="${a[0]}" aria-pressed="${sel.includes(a[0])}"><span>${a[1]}</span>${B(a[2],a[3])}</button>`).join('');
  return `<div class="stack" style="margin-bottom:14px">${panel(B('أنشطة المحل','Shop activities'),`<p class="form-note" style="margin:0 0 10px">${B('اختر ما تمارسه فقط؛ تُخفى الأقسام والخيارات غير المرتبطة بنشاطك. إن لم تحدد شيئاً ظهر كل شيء.','Choose only what you do; unrelated sections and options are hidden. If none is chosen everything shows.')}</p><div class="px-acts">${chips}</div>`)}</div>`;
}
function costsPanel(){
  const fx=P().fixed||{},mg=P().margins||{};
  const f=(n,l,v,ph)=>`<label class="field"><span>${l}</span><input name="${n}" class="control" type="number" min="0" step="any" inputmode="decimal" value="${v?esc(v):''}" placeholder="${ph||'0'}"></label>`;
  return `<div class="stack" style="margin-bottom:14px">${panel(B('التكاليف الثابتة وهوامش الربح','Fixed costs & profit margins'),`<form data-pxform="costs"><p class="form-note" style="margin:0 0 10px">${B('تُوزَّع هذه المصاريف الخفية تلقائياً على كل صفقة لتعرف ربحك الحقيقي، وتُبنى عليها الأسعار المقترحة.','These hidden costs are spread across every deal so you see true profit and get suggested prices.')}</p><div class="form-grid">${f('rent',B('كراء المحل شهرياً','Monthly shop rent'),fx.rent)}${f('wages',B('أجور العمال شهرياً','Monthly wages'),fx.wages)}${f('utilities',B('كهرباء وماء وإنترنت شهرياً','Monthly utilities'),fx.utilities)}${f('other',B('مصاريف ثابتة أخرى شهرياً','Other monthly overheads'),fx.other)}${f('deals',B('عدد الصفقات المتوقعة شهرياً','Expected deals per month'),fx.deals,'30')}</div><label class="chk" style="margin:10px 0"><input type="checkbox" name="auto" ${fx.auto?'checked':''}> ${B('وزّعها تلقائياً على كل صفقة جديدة','Spread automatically on each new deal')}</label><div class="form-grid">${f('mmin',B('هامش الربح الأدنى ٪','Minimum margin %'),mg.min,B('حسب النشاط','by activity'))}${f('mtarget',B('هامش الربح المستهدف ٪','Target margin %'),mg.target,B('حسب النشاط','by activity'))}${f('mmax',B('السقف ٪','Ceiling %'),mg.max,B('حسب النشاط','by activity'))}</div><div class="form-footer"><span class="form-note">${B('اترك الهوامش فارغة لاستعمال القيم الجاهزة حسب كل نشاط.','Leave margins empty to use defaults per activity.')}</span><button class="btn btn-primary" type="submit">${B('حفظ','Save')}</button></div></form>`)}</div>`;
}
const _rs=renderSettings;
renderSettings=function(){
  const h=_rs(),i=h.indexOf('<div class="content-grid">'),p=activitiesPanel()+costsPanel();
  return i>0?h.slice(0,i)+p+h.slice(i):h+p;
};
document.addEventListener('click',e=>{
  const c=e.target.closest&&e.target.closest('[data-pxact]');if(!c)return;
  const id=c.dataset.pxact,cur=actsSel()||[];
  savePrefs({activities:cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]},'تم تحديث الأنشطة');
});
document.addEventListener('submit',e=>{
  const f=e.target.closest&&e.target.closest('form[data-pxform="costs"]');if(!f)return;
  e.preventDefault();e.stopImmediatePropagation();
  const v=n=>Math.max(0,num(f.elements[n].value));
  const mg=v('mtarget')>0?{min:v('mmin'),target:v('mtarget'),max:Math.max(v('mmax'),v('mtarget'))}:null;
  savePrefs({fixed:{rent:v('rent'),wages:v('wages'),utilities:v('utilities'),other:v('other'),deals:v('deals'),auto:f.elements.auto.checked},margins:mg},'تم حفظ التكاليف والهوامش');
},true);

/* ================= first-run wizard ================= */
let wz=null;
function wzOpen(){
  const p=P();
  wz={step:1,name:(p.shop&&p.shop.name&&!/^الدفتر المحلي$/.test(p.shop.name)?p.shop.name:'')||'',phone:(p.shop&&p.shop.phone)||'',address:(p.shop&&p.shop.address)||'',currency:p.currency||'د.م.',acts:[...(actsSel()||[])],fx:{rent:'',wages:'',utilities:'',other:'',deals:''}};
  wzDraw();
}
function wzDraw(){
  let d=$('#px-wizard');if(!d){d=document.createElement('div');d.id='px-wizard';document.body.append(d)}
  const S=wz.step,dots=[1,2,3].map(i=>`<i class="${i<=S?'on':''}"></i>`).join('');
  let body='';
  if(S===1)body=`<h2>${B('مرحباً بك في دفتر التاجر','Welcome to Merchant Ledger')}</h2><p>${B('لنجهّز دفتر محلك في دقيقة. سيبقى كل شيء على هذا الجهاز.','Let us set up your shop book in a minute. Everything stays on this device.')}</p>
<label class="field"><span>${B('اسم المحل أو النشاط *','Shop or business name *')}</span><input id="wz-name" class="control" value="${esc(wz.name)}" autocomplete="off" placeholder="${B('مثال: محل النور للإلكترونيات','e.g. Al-Nour Electronics')}"></label>
<div class="form-grid"><label class="field"><span>${B('هاتف المحل','Shop phone')}</span><input id="wz-phone" class="control" type="tel" value="${esc(wz.phone)}"></label><label class="field"><span>${B('المدينة / العنوان','City / address')}</span><input id="wz-addr" class="control" value="${esc(wz.address)}"></label></div>
<label class="field"><span>${B('العملة','Currency')}</span><input id="wz-cur" class="control" value="${esc(wz.currency)}"></label>`;
  else if(S===2)body=`<h2>${B('ما الأنشطة التي تمارسها؟','Which activities do you run?')}</h2><p>${B('اختر نشاطاً واحداً أو أكثر. سنُظهر لك الأقسام والخيارات المناسبة فقط، ويمكنك التغيير لاحقاً من الإعدادات.','Pick one or more. We will show only the relevant sections and options; change it later in Settings.')}</p><div class="px-acts">${ACTS.map(a=>`<button type="button" class="px-act ${wz.acts.includes(a[0])?'on':''}" data-wz-act="${a[0]}" aria-pressed="${wz.acts.includes(a[0])}"><span>${a[1]}</span>${B(a[2],a[3])}</button>`).join('')}</div>`;
  else body=`<h2>${B('المصاريف الثابتة (الخفية)','Fixed (hidden) costs')}</h2><p>${B('هي ما يفرّق التاجر الماهر عن المبتدئ. أدخل ما تدفعه شهرياً لنوزّعه على كل صفقة ونقترح عليك أسعار بيع تضمن الربح. يمكنك التخطي وإكمالها لاحقاً.','These separate the skilled trader from the beginner. Enter what you pay monthly; we spread it on each deal and suggest prices that protect profit. You may skip and finish later.')}</p>
<div class="form-grid">${[['rent',B('كراء المحل','Shop rent')],['wages',B('أجور العمال','Wages')],['utilities',B('كهرباء وماء وإنترنت','Utilities')],['other',B('مصاريف أخرى','Other')]].map(x=>`<label class="field"><span>${x[1]} / ${B('شهر','month')}</span><input id="wz-${x[0]}" class="control" type="number" min="0" step="any" inputmode="decimal" value="${esc(wz.fx[x[0]])}" placeholder="0"></label>`).join('')}</div>
<label class="field"><span>${B('عدد الصفقات المتوقعة شهرياً','Expected deals per month')}</span><input id="wz-deals" class="control" type="number" min="1" step="1" inputmode="numeric" value="${esc(wz.fx.deals)}" placeholder="30"></label><div id="wz-calc" class="px-hint"></div>`;
  d.innerHTML=`<div class="px-wback"></div><div class="px-wbox" role="dialog" aria-modal="true" aria-label="${B('الإعداد الأولي','Initial setup')}"><div class="px-wdots">${dots}</div><div class="px-wbody">${body}</div><div id="wz-err" class="px-werr" role="alert"></div><div class="px-wnav">${S>1?`<button type="button" class="btn btn-outline" data-wz="back">${B('رجوع','Back')}</button>`:'<span></span>'}<div>${S===1?`<button type="button" class="btn btn-outline" data-wz="skip">${B('تخطّي الآن','Skip for now')}</button> `:''}${S===3?`<button type="button" class="btn btn-outline" data-wz="finish0">${B('تخطّي','Skip')}</button> `:''}<button type="button" class="btn btn-primary" data-wz="${S===3?'finish':'next'}">${S===3?B('ابدأ ✓','Start ✓'):B('التالي →','Next →')}</button></div></div></div>`;
  d.hidden=false;
  const f=d.querySelector('input');if(f&&S!==2)setTimeout(()=>f.focus(),60);
  wzCalc();
}
function wzRead(){
  const g=id=>{const e=$('#'+id);return e?e.value.trim():''};
  if(wz.step===1){wz.name=g('wz-name');wz.phone=g('wz-phone');wz.address=g('wz-addr');wz.currency=g('wz-cur')||'د.م.'}
  if(wz.step===3)['rent','wages','utilities','other','deals'].forEach(k=>wz.fx[k]=g('wz-'+k));
}
function wzCalc(){
  const c=$('#wz-calc');if(!c)return;
  const t=['rent','wages','utilities','other'].reduce((s,k)=>s+num($('#wz-'+k).value),0),d=num($('#wz-deals').value)||0;
  c.textContent=t>0&&d>0?`${B('حصة كل صفقة من المصاريف الثابتة','Each deal carries')}: ${r2(t/d)} ${wz.currency}`:B('أدخل المبالغ وعدد الصفقات لتظهر حصة كل صفقة.','Enter amounts and deal count to see each deal\'s share.');
}
async function wzFinish(withCosts){
  wzRead();
  const fx=withCosts?{rent:num(wz.fx.rent),wages:num(wz.fx.wages),utilities:num(wz.fx.utilities),other:num(wz.fx.other),deals:num(wz.fx.deals)||30,auto:true}:undefined;
  const anyCost=fx&&(fx.rent+fx.wages+fx.utilities+fx.other)>0;
  const patch={shop:{...(P().shop||{}),name:wz.name,phone:wz.phone,address:wz.address},currency:wz.currency,activities:wz.acts,setupDone:true};
  if(anyCost)patch.fixed=fx;
  try{
    state.prefs={...state.prefs,...patch,_updatedAt:Date.now()};
    if(workspace){workspaceList=workspaceList.map(w=>w.id===workspace.id?{...w,name:wz.name}:w);await localWrite('local-workspaces',workspaceList);try{workspace.name=wz.name}catch(e){}}
    $('#px-wizard').remove();wz=null;currentPage='dashboard';
    await commit({message:'تم إعداد دفتر المحل'});
  }catch(err){toast(err.message||'تعذر الحفظ','error')}
}
async function wzSkip(){
  $('#px-wizard').remove();wz=null;
  state.prefs={...state.prefs,setupDone:true,_updatedAt:Date.now()};await commit({message:'يمكنك ضبط الأنشطة من الإعدادات'});
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-wz],[data-wz-act]');if(!b||!wz)return;
  if(b.dataset.wzAct){const id=b.dataset.wzAct;wz.acts=wz.acts.includes(id)?wz.acts.filter(x=>x!==id):[...wz.acts,id];b.classList.toggle('on',wz.acts.includes(id));b.setAttribute('aria-pressed',wz.acts.includes(id));$('#wz-err').textContent='';return}
  const a=b.dataset.wz,err=$('#wz-err');
  if(a==='skip'){wzSkip();return}
  if(a==='back'){wzRead();wz.step--;wzDraw();return}
  if(a==='next'){
    wzRead();
    if(wz.step===1&&!wz.name){err.textContent=B('اسم المحل مطلوب','Shop name is required');$('#wz-name').focus();return}
    if(wz.step===2&&!wz.acts.length){err.textContent=B('اختر نشاطاً واحداً على الأقل','Choose at least one activity');return}
    wz.step++;wzDraw();return;
  }
  if(a==='finish'){wzFinish(true);return}
  if(a==='finish0'){wzFinish(false)}
});
document.addEventListener('input',e=>{if(wz&&e.target.closest&&e.target.closest('#px-wizard'))wzCalc()});
document.addEventListener('keydown',e=>{if(wz&&e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();const n=document.querySelector('[data-wz="next"],[data-wz="finish"]');if(n)n.click()}});
function maybeWizard(){
  if(wz||$('#px-wizard'))return;
  try{
    const p=P(),L=$('#lock-screen');
    if(!workspace||p.setupDone||recordsLive().length>0||(L&&!L.hidden))return;
    wzOpen();
  }catch(e){}
}

/* ================= reports & sharing ================= */
const PRESETS=[['today','اليوم','Today'],['yesterday','أمس','Yesterday'],['week','آخر 7 أيام','Last 7 days'],['month','هذا الشهر','This month'],['lastmonth','الشهر الماضي','Last month'],['year','هذه السنة','This year'],['custom','فترة مخصصة','Custom']];
function rangeOf(k,from,to){
  const n=new Date(),Y=n.getFullYear(),M=n.getMonth(),D=n.getDate();
  if(k==='today')return[iso(n),iso(n)];
  if(k==='yesterday'){const y=new Date(Y,M,D-1);return[iso(y),iso(y)]}
  if(k==='week')return[iso(new Date(Y,M,D-6)),iso(n)];
  if(k==='month')return[iso(new Date(Y,M,1)),iso(n)];
  if(k==='lastmonth')return[iso(new Date(Y,M-1,1)),iso(new Date(Y,M,0))];
  if(k==='year')return[iso(new Date(Y,0,1)),iso(n)];
  return[from||iso(n),to||iso(n)];
}
function buildReport(s,e){
  const rows=recordsLive().filter(r=>{const d=r.date||'';return d>=s&&d<=e});
  const deals=rows.filter(r=>['deal','buy'].includes(r.kind)),reps=rows.filter(r=>['repair','rep'].includes(r.kind)),vs=rows.filter(r=>['voucher','vch'].includes(r.kind));
  const exp={},addE=(k,v)=>{if(v>0)exp[k]=(exp[k]||0)+v};
  let sales=0,purch=0,repRev=0,repCost=0,vin=0,vout=0,got=0,paid=0;
  const items=new Map(),acts=new Map();
  deals.forEach(r=>{
    const sale=num(r.sale??r.sell),buy=num(r.purchase??r.buy),ex=num(r.expenses??r.exp);
    sales+=sale;purch+=buy;got+=num(r.received??r.recv);paid+=num(r.paid);
    if(r.expenseItems&&r.expenseItems.length)r.expenseItems.forEach(x=>addE(x.k,num(x.v)));else addE('legacy',ex);
    const net=sale-buy-ex,k=(r.item||'—').trim();
    const x=items.get(k)||{n:k,c:0,net:0};x.c++;x.net+=net;items.set(k,x);
    const a=r.activity||'—',y=acts.get(a)||{a,c:0,net:0};y.c++;y.net+=net;acts.set(a,y);
  });
  reps.forEach(r=>{const rev=num(r.charge??r.price),pa=num(r.parts),la=num(r.labor??r.pay);repRev+=rev;repCost+=pa+la;addE('parts',pa);addE('labor',la)});
  vs.forEach(r=>{const a=num(r.amount??r.amt);if(r.direction==='income'||r.vtype==='inc')vin+=a;else{vout+=a;addE('v:'+(r.category||r.cat||r.title||'other'),a)}});
  const exTotal=Object.values(exp).reduce((s,x)=>s+x,0);
  const dealExp=deals.reduce((s,r)=>s+num(r.expenses??r.exp),0);
  const revenue=sales+repRev+vin,costs=purch+dealExp+repCost+vout,net=revenue-costs;
  let rec=0,pay=0;try{getDebtItems().forEach(d=>{if(d.direction==='receivable')rec+=d.remaining;else pay+=d.remaining})}catch(er){}
  return{s,e,rows,deals,reps,vs,sales,purch,dealExp,repRev,repCost,vin,vout,revenue,costs,net,got,paid,exp,exTotal,rec,pay,
    items:[...items.values()].sort((a,b)=>b.net-a.net),acts:[...acts.values()].sort((a,b)=>b.net-a.net)};
}
const expLabel=k=>k.startsWith('v:')?k.slice(2):k==='parts'?B('قطع غيار','Spare parts'):k==='labor'?B('أجور الإصلاح','Repair labour'):expName(k);
const actName=id=>{const a=categoryDefs(state.activities,DEFAULT_ACTIVITIES).find(x=>x.id===id);return a?choiceText(a):id};
function reportText(R){
  const sh=(P().shop&&P().shop.name)||B('دفتر التاجر','Merchant Ledger'),L=[];
  L.push(`📒 ${sh}`);L.push(`📅 ${R.s===R.e?R.s:R.s+' → '+R.e}`);L.push('');
  L.push(`${B('عدد العمليات','Operations')}: ${R.rows.length}`);
  L.push(`💰 ${B('الإيرادات','Revenue')}: ${money(R.revenue)}`);
  L.push(`🧾 ${B('المشتريات','Purchases')}: ${money(R.purch)}`);
  L.push(`📉 ${B('المصاريف والتكاليف الأخرى','Expenses & other costs')}: ${money(R.costs-R.purch)}`);
  L.push(`${R.net>=0?'✅':'🔻'} ${B('صافي الربح','Net profit')}: ${money(R.net)}${R.revenue>0?` (${(R.net/R.revenue*100).toFixed(1)}٪)`:''}`);
  const ex=Object.entries(R.exp).sort((a,b)=>b[1]-a[1]);
  if(ex.length){L.push('');L.push(`💡 ${B('أين ذهبت المصاريف','Where expenses went')}:`);ex.forEach(([k,v])=>L.push(` • ${expLabel(k)}: ${money(v)}`))}
  if(R.items.length){L.push('');L.push(`🏆 ${B('أفضل السلع ربحاً','Top items by profit')}:`);R.items.slice(0,3).forEach(x=>L.push(` • ${x.n}: ${money(x.net)}`))}
  if(R.acts.length>1){L.push('');L.push(`🏪 ${B('حسب النشاط','By activity')}:`);R.acts.forEach(x=>L.push(` • ${actName(x.a)}: ${money(x.net)}`))}
  L.push('');L.push(`💵 ${B('المقبوض من الزبائن','Collected')}: ${money(R.got)} · ${B('المدفوع للموردين','Paid to suppliers')}: ${money(R.paid)}`);
  L.push(`📌 ${B('الديون القائمة الآن','Outstanding debts now')} — ${B('لي','owed to me')}: ${money(R.rec)} · ${B('عليّ','I owe')}: ${money(R.pay)}`);
  return L.join('\n');
}
function reportCSV(R){
  const ks=[...new Set(R.deals.flatMap(r=>(r.expenseItems||[]).map(x=>x.k)))];
  const head=[B('التاريخ','Date'),B('النوع','Type'),B('المرجع','Ref'),B('البند','Item'),B('النشاط','Activity'),B('الكمية','Qty'),B('الشراء','Purchase'),B('البيع','Sale'),B('المصاريف','Expenses'),B('صافي الربح','Net profit'),B('المورد','Supplier'),B('الزبون','Customer'),...ks.map(k=>expLabel(k))];
  const rows=[head];
  R.deals.forEach(r=>{const sale=num(r.sale??r.sell),buy=num(r.purchase??r.buy),ex=num(r.expenses??r.exp);const m=Object.fromEntries((r.expenseItems||[]).map(x=>[x.k,x.v]));rows.push([r.date,B('صفقة','Deal'),r.ref,r.item,actName(r.activity||''),r.qty,buy,sale,ex,r2(sale-buy-ex),r.supplier||'',r.customer||'',...ks.map(k=>m[k]||'')])});
  R.reps.forEach(r=>{const rev=num(r.charge??r.price),c=num(r.parts)+num(r.labor??r.pay);rows.push([r.date,B('إصلاح','Repair'),r.ref,r.item,'','',c,rev,0,r2(rev-c),'',r.customer||'',...ks.map(()=>'')])});
  R.vs.forEach(r=>{const a=num(r.amount??r.amt),inc=r.direction==='income'||r.vtype==='inc';rows.push([r.date,inc?B('سند قبض','Income voucher'):B('سند صرف','Expense voucher'),r.ref,r.title||'','','',inc?'':a,inc?a:'',0,inc?a:-a,'','',...ks.map(()=>'')])});
  return '\ufeff'+rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
}
function expenseBars(exp,total){
  const ex=Object.entries(exp).sort((a,b)=>b[1]-a[1]);
  if(!ex.length)return `<p class="form-note" style="margin:0">${B('لا توجد مصاريف مسجّلة في هذه الفترة.','No expenses recorded in this period.')}</p>`;
  return ex.map(([k,v])=>{const pc=total>0?v/total*100:0;return `<div class="px-bar"><div class="px-bar-h"><span>${esc(expLabel(k))}</span><b>${money(v)} · ${pc.toFixed(0)}٪</b></div><div class="px-bar-t"><i style="width:${Math.min(100,pc).toFixed(1)}%"></i></div></div>`}).join('');
}
let rep={k:'month',from:'',to:''};
function repView(){
  const [s,e]=rangeOf(rep.k,rep.from,rep.to),R=buildReport(s,e),txt=reportText(R);
  const chips=PRESETS.map(p=>`<button type="button" class="filter-chip ${rep.k===p[0]?'active':''}" data-rp="${p[0]}">${B(p[1],p[2])}</button>`).join('');
  const kp=(l,v,c)=>`<div class="px-kp"><small>${l}</small><b class="${c||''}">${v}</b></div>`;
  return `<div class="nx-grab nx-drag"></div><div class="nx-head nx-drag"><strong>📤 ${B('تقرير ومشاركة','Report & share')}</strong><button type="button" class="icon-button" data-rp="close" aria-label="${B('إغلاق','Close')}">×</button></div>
<div class="px-chips">${chips}</div>
${rep.k==='custom'?`<div class="form-grid" style="margin:10px 0"><label class="field"><span>${B('من','From')}</span><input class="control" type="date" id="rp-from" value="${esc(s)}"></label><label class="field"><span>${B('إلى','To')}</span><input class="control" type="date" id="rp-to" value="${esc(e)}"></label></div>`:''}
<div class="px-kps">${kp(B('الإيرادات','Revenue'),money(R.revenue))}${kp(B('التكاليف','Costs'),money(R.costs))}${kp(B('صافي الربح','Net profit'),money(R.net),R.net>=0?'pos':'neg')}${kp(B('العمليات','Operations'),R.rows.length)}</div>
<div class="nx-label">💡 ${B('أين ذهبت المصاريف','Where expenses went')}</div>${expenseBars(R.exp,R.exTotal)}
<div class="nx-label">${B('نص التقرير','Report text')}</div><pre class="px-pre" id="rp-pre"></pre>
<div class="px-share"><button type="button" class="btn btn-primary" data-rp="share">${B('مشاركة','Share')}</button><button type="button" class="btn btn-outline" data-rp="wa">WhatsApp</button><button type="button" class="btn btn-outline" data-rp="copy">${B('نسخ','Copy')}</button><button type="button" class="btn btn-outline" data-rp="csv">Excel</button><button type="button" class="btn btn-outline" data-rp="txt">${B('ملف نصي','Text file')}</button></div>`;
}
function repDraw(keep){
  let d=$('#px-rep');
  if(!d){d=document.createElement('div');d.id='px-rep';document.body.append(d)}
  const sc=d.querySelector('.nx-panel');const top=sc?sc.scrollTop:0;
  d.innerHTML=`<div class="nx-backdrop" data-rp="close"></div><div class="nx-panel" role="dialog" aria-modal="true" aria-label="${B('تقرير ومشاركة','Report & share')}">${repView()}</div>`;
  const [s,e]=rangeOf(rep.k,rep.from,rep.to);$('#rp-pre').textContent=reportText(buildReport(s,e));
  d.hidden=false;if(keep){const p=d.querySelector('.nx-panel');if(p)p.scrollTop=top}
}
function repClose(){const d=$('#px-rep');if(d)d.remove();const a=$('#app-screen');if(a)a.inert=false}
async function repShare(kind){
  const [s,e]=rangeOf(rep.k,rep.from,rep.to),R=buildReport(s,e),text=reportText(R),name=`merchant-ledger-report-${s}_${e}`;
  if(kind==='share'){
    try{if(navigator.share){await navigator.share({title:B('تقرير دفتر التاجر','Ledger report'),text});return}}catch(er){if(er&&er.name==='AbortError')return}
    try{await navigator.clipboard.writeText(text);toast(B('نُسخ التقرير (المشاركة غير متاحة هنا)','Report copied (sharing unavailable here)'),'success')}catch(er){toast(B('تعذرت المشاركة','Could not share'),'error')}
  }else if(kind==='wa'){const u='https://wa.me/?text='+encodeURIComponent(text);const w=window.open(u,'_blank','noopener');if(!w)location.href=u}
  else if(kind==='copy'){try{await navigator.clipboard.writeText(text);toast(B('تم النسخ','Copied'),'success')}catch(er){toast(B('تعذر النسخ','Could not copy'),'error')}}
  else if(kind==='csv')downloadBlob(name+'.csv',new Blob([reportCSV(R)],{type:'text/csv;charset=utf-8'}));
  else if(kind==='txt')downloadBlob(name+'.txt',new Blob([text],{type:'text/plain;charset=utf-8'}));
}
window.PXR={open(k){if(k)rep.k=k;const L=$('#lock-screen');if(L&&!L.hidden)return;repDraw();const a=$('#app-screen');if(a)a.inert=true}};
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('#px-rep [data-rp]');if(!b)return;
  const k=b.dataset.rp;
  if(k==='close'){repClose();return}
  if(['share','wa','copy','csv','txt'].includes(k)){repShare(k);return}
  rep.k=k;if(k==='custom'&&!rep.from){const n=iso(new Date());rep.from=n;rep.to=n}repDraw(true);
});
document.addEventListener('change',e=>{
  if(!(e.target.id==='rp-from'||e.target.id==='rp-to'))return;
  rep.from=($('#rp-from')||{}).value||rep.from;rep.to=($('#rp-to')||{}).value||rep.to;
  if(rep.from>rep.to)[rep.from,rep.to]=[rep.to,rep.from];repDraw(true);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#px-rep'))repClose()});
let ty0=null;
document.addEventListener('touchstart',e=>{ty0=(e.target.closest&&e.target.closest('#px-rep .nx-drag'))?e.touches[0].clientY:null},{passive:true});
document.addEventListener('touchend',e=>{if(ty0!==null&&e.changedTouches[0].clientY-ty0>60)repClose();ty0=null},{passive:true});

/* reports page toolbar + dashboard "where does money go" */
const _rr=renderReports;
renderReports=function(){
  const h=_rr(),m=/<div class="(?:section-title|content-grid|kpi-grid)/.exec(h),bar=`<div class="toolbar" style="margin-bottom:12px"><div class="toolbar-left"><button type="button" class="btn btn-primary" data-px="report-open">📤 ${B('تقرير ومشاركة (يومي · شهري · سنوي · فترة)','Report & share (daily · monthly · yearly · period)')}</button></div></div>`;
  return m?h.slice(0,m.index)+bar+h.slice(m.index):bar+h;
};
const _rd=renderDashboard;
renderDashboard=function(){
  const h=_rd();
  try{
    const n=new Date(),yr=n.getFullYear(),mo=n.getMonth();
    const per=dashPeriod,[s,e]=per==='all'?['0000-01-01','9999-12-31']:per==='today'?rangeOf('today'):per==='week'?rangeOf('week'):per==='year'?rangeOf('year'):[iso(new Date(yr,mo,1)),iso(new Date(yr,mo+1,0))];
    const R=buildReport(s,e);
    const unk=R.exp.legacy||0,hint=R.exTotal>0&&unk/R.exTotal>0.4?`<div class="notice" style="margin-top:10px">${B(`${(unk/R.exTotal*100).toFixed(0)}٪ من مصاريفك غير مفصّلة. فصّلها (نقل، كراء، أجور…) لتعرف أين يضيع ربحك.`,`${(unk/R.exTotal*100).toFixed(0)}% of your expenses are unitemised. Break them down to see where profit leaks.`)}</div>`:'';
    return h+`<div class="stack" style="margin-top:14px">${panel(B('أين تذهب مصاريفك؟','Where does your money go?'),`${expenseBars(R.exp,R.exTotal)}${hint}`)}</div>`;
  }catch(err){return h}
};

/* ================= wiring ================= */
const _render=render;
render=function(){_render();initDealForm();enhanceDeals();maybeWizard()};
if(typeof workspace!=='undefined'&&workspace)render();
})();
