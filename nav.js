/* nav.js — navigation upgrade: bottom bar + quick-add FAB, "More" sheet, options menu, install help */
(function(){
'use strict';
const B=(a,e)=>uiLang==='en'?e:a;
const P={
home:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
swap:'<path d="M3 11V9a4 4 0 0 1 4-4h14M17 1l4 4-4 4M21 13v2a4 4 0 0 1-4 4H3M7 23l-4-4 4-4"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
box:'<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
wallet:'<path d="M3 7a2 2 0 0 1 2-2h14v4M3 7v10a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2zM17 14h2"/>',
wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
paw:'<circle cx="6.5" cy="10" r="1.6"/><circle cx="10.5" cy="6" r="1.6"/><circle cx="14.5" cy="6" r="1.6"/><circle cx="18.5" cy="10" r="1.6"/><path d="M12 21c-3 0-5-2-5-4s2-4 5-4 5 2 5 4-2 4-5 4z"/>',
pin:'<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/>',
chart:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
scale:'<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
download:'<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
flask:'<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3"/>',
store:'<path d="M3 9l1-5h16l1 5M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v9h14v-9M10 21v-5h4v5"/>',
phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M3 3l18 18M10.6 6.2A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7c1.7 0 3.2-.4 4.6-1.1"/>',
type:'<path d="M4 7V5h16v2M9 20h6M12 5v15"/>',
share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4.2M8.6 13.4l6.8 4.2"/>',
shieldcheck:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
dots:'<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'
};
const ic=(n,s=22)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const allowed=p=>{try{return typeof pageAllowed==='function'?pageAllowed(p):true}catch(e){return true}};
let opener=null,menuOpener=null,deferred=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
window.addEventListener('appinstalled',()=>{deferred=null});

/* ----- data ----- */
const QA=[['new-deal','swap','صفقة شراء / بيع','Buy / sell deal'],['focus-debt','clock','دين أو قسط','Debt or instalment'],['new-repair','wrench','تذكرة إصلاح','Repair ticket'],['focus-voucher','wallet','سند قبض / صرف','Treasury voucher'],['focus-catalog','box','سلعة بالكتالوج','Catalog item'],['focus-animal','paw','حيوان أو طائر','Animal or bird'],['focus-land','pin','أرض / فلاحة','Land / farming']];
const GROUPS=[
['الأعمال','Business',[['catalog','box','الكتالوج والمخزون','Catalog & stock'],['treasury','wallet','الخزينة','Treasury'],['repairs','wrench','الحرف والإصلاح','Repairs & crafts']]],
['سجلات متخصصة','Specialised records',[['livestock','paw','الحيوانات والرعاية','Livestock & care'],['lands','pin','الأراضي والفلاحة','Land & farming']]],
['معرفة وتقارير','Insight',[['reports','chart','التقارير والمتعاملون','Reports & contacts'],['ethics','scale','التجارة المسؤولة والزكاة','Responsible trade & zakat']]]];
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const FONT=[['عادي','Normal',''],['كبير','Large','18px'],['أكبر','Larger','20px']];
let fontI=Math.min(2,parseInt(LS('ledger-font')||'0')||0),hideAmt=LS('ledger-hide-amounts')==='1',persisted=null;
const applyFont=()=>{document.documentElement.style.fontSize=FONT[fontI][2]};
const _money=money;money=function(v){return hideAmt?`•••• ${esc(currency())}`:_money(v)};
if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>persisted=p).catch(()=>{});
const lastBackup=()=>{const t=LS('ledger-last-backup');return t?Math.floor((Date.now()-new Date(t))/864e5):null};
const _dl=downloadBlob;downloadBlob=function(n,b){if(/^merchant-ledger.*\.json$/.test(n))LS('ledger-last-backup',new Date().toISOString());_dl(n,b)};
const backupSub=()=>{const d=lastBackup();return d===null?B('لم تؤخذ نسخة بعد','No backup yet'):d===0?B('آخر نسخة: اليوم','Last backup: today'):B(`آخر نسخة: قبل ${d} يوم`,`Last backup: ${d} d ago`)};
/* Options menu = quick utilities only (navigation lives in the bottom bar / More sheet) */
const OPTG=()=>[
 [B('العرض','Display'),[
  {k:'nx:amounts',i:hideAmt?'eyeoff':'eye',l:hideAmt?B('إظهار المبالغ','Show amounts'):B('إخفاء المبالغ','Hide amounts'),s:hideAmt?B('مخفية','Hidden'):''},
  {k:'nx:font',i:'type',l:B('حجم الخط','Text size'),s:B(FONT[fontI][0],FONT[fontI][1])}]],
 [B('البيانات','Data'),[
  {k:'action:backup',i:'download',l:B('نسخة احتياطية (JSON)','Backup (JSON)'),sub:backupSub()},
  {k:'action:encrypted-backup',i:'lock',l:B('نسخة مشفّرة بكلمة مرور','Password-encrypted backup')},
  {k:'action:csv',i:'file',l:B('تصدير Excel (CSV)','Export Excel (CSV)')},
  {k:'nx:persist',i:'shieldcheck',l:B('حماية البيانات من المسح التلقائي','Protect data from auto-clean'),s:persisted?B('مفعّلة','On'):''},
  {k:'nx:ws',i:'store',l:B('دفاتر المتاجر على الجهاز','Ledgers on this device')}]],
 [B('التطبيق','App'),[
  ...(standalone()?[]:[{k:'nx:install',i:'phone',l:B('تثبيت على الجهاز','Install on device')}]),
  {k:'nx:share',i:'share',l:B('مشاركة رابط التطبيق','Share app link')},
  {k:'action:demo',i:'flask',l:B('تجربة بيانات نموذجية','Try sample data')},
  {k:'action:privacy',i:'shield',l:B('الخصوصية','Privacy')}]]
];
const optBtn=o=>{const [t,v]=o.k.split(':'),attr=t==='action'?`data-action="${v}"`:t==='page'?`data-page="${v}"`:`data-nx="${v}"`;return `<button type="button" class="nx-opt" role="menuitem" ${attr}>${ic(o.i,20)}<span>${esc(o.l)}${o.sub?`<span class="nx-sub">${esc(o.sub)}</span>`:''}</span>${o.s?`<em class="nx-state">${esc(o.s)}</em>`:''}</button>`};
const menuHTML=()=>OPTG().map(g=>`<div class="nx-mlabel">${esc(g[0])}</div>${g[1].map(optBtn).join('')}`).join('');
const HOT={deals:'new-deal',debts:'focus-debt',repairs:'new-repair',treasury:'focus-voucher',catalog:'focus-catalog',livestock:'focus-animal',lands:'focus-land'};
const quickHTML=()=>{const hot=HOT[typeof currentPage!=='undefined'?currentPage:''],L=[...QA].sort((a,b)=>(b[0]===hot)-(a[0]===hot));return `<div class="nx-grid">${L.map(q=>`<button type="button" class="nx-item${q[0]===hot?' nx-hot':''}" ${q[0]===hot?`data-hot="${B('هذه الصفحة','This page')}"`:''} data-action="${q[0]}">${ic(q[1],24)}<span>${B(q[2],q[3])}</span></button>`).join('')}</div>`};
const moreHTML=()=>[...GROUPS,['النظام','System',[['settings','gear','الإعدادات والنسخ','Settings & backups']]]].map(g=>{const it=g[2].filter(x=>allowed(x[0]));return it.length?`<div class="nx-label">${B(g[0],g[1])}</div><div class="nx-grid">${it.map(x=>`<button type="button" class="nx-item" data-page="${x[0]}">${ic(x[1],24)}<span>${B(x[2],x[3])}</span></button>`).join('')}</div>`:''}).join('');

/* ----- sheet ----- */
function closeSheet(){
  const s=$('#nx-sheet');if(!s||s.hidden)return;
  s.hidden=true;s.innerHTML='';
  const L=$('#lock-screen');if(!L||L.hidden)$('#app-screen').inert=false;
  if(opener&&opener.isConnected)opener.focus();opener=null;
}
function openSheet(title,body,from){
  closeMenu();
  let s=$('#nx-sheet');if(!s){s=document.createElement('div');s.id='nx-sheet';s.hidden=true;document.body.append(s)}
  s.innerHTML=`<div class="nx-backdrop" data-nx="close"></div><div class="nx-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="nx-grab nx-drag" aria-hidden="true"></div><div class="nx-head nx-drag"><strong>${esc(title)}</strong><button type="button" class="icon-button" data-nx="close" aria-label="${B('إغلاق','Close')}">×</button></div>${body}</div>`;
  s.hidden=false;$('#app-screen').inert=true;opener=from||null;
  const f=s.querySelector('.nx-item,.nx-opt');if(f)f.focus();
}

/* ----- options popover ----- */
function closeMenu(){const m=$('#nx-menu');if(!m||m.hidden)return;m.hidden=true;m.innerHTML='';const b=$('#nx-options');if(b)b.setAttribute('aria-expanded','false')}
function toggleMenu(btn){
  let m=$('#nx-menu');
  if(m&&!m.hidden){closeMenu();return}
  if(!m){m=document.createElement('div');m.id='nx-menu';m.setAttribute('role','menu');m.hidden=true;document.body.append(m)}
  m.innerHTML=menuHTML();
  m.setAttribute('aria-label',B('الخيارات','Options'));
  const r=btn.getBoundingClientRect(),w=262,rtl=document.documentElement.dir==='rtl';
  m.style.top=(r.bottom+8)+'px';
  const left=rtl?Math.min(r.left,innerWidth-w-8):Math.max(8,r.right-w);
  m.style.left=Math.max(8,left)+'px';m.style.right='auto';
  m.hidden=false;btn.setAttribute('aria-expanded','true');
  const f=m.querySelector('.nx-opt');if(f)f.focus();
}

/* ----- install help ----- */
function installHelp(){
  $('#modal-root').innerHTML=`<div class="modal-card" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${B('تثبيت التطبيق','Install the app')}</h2><p>${B('يعمل بعدها كتطبيق مستقل ودون إنترنت','Then it runs as a standalone, offline app')}</p></div><button class="icon-button" data-action="modal-close" type="button">×</button></div><ol class="guide-checklist"><li><b>iPhone / iPad (Safari):</b> ${B('اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».','tap Share, then “Add to Home Screen”.')}</li><li><b>Android (Chrome):</b> ${B('قائمة ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».','menu ⋮, then “Install app” or “Add to Home screen”.')}</li><li><b>${B('حاسوب (Chrome / Edge)','Desktop (Chrome / Edge)')}:</b> ${B('أيقونة التثبيت في شريط العنوان.','the install icon in the address bar.')}</li></ol><p class="form-note">${B('يلزم فتح الرابط بصيغة https من المتصفح نفسه (وليس من داخل تطبيق آخر).','Open the https link in the browser itself (not inside another app).')}</p></div>`;
  $('#modal-root').hidden=false;
}
async function doInstall(){
  if(standalone()){toast(B('التطبيق مثبّت بالفعل','Already installed'));return}
  if(deferred){const d=deferred;deferred=null;d.prompt();try{await d.userChoice}catch(e){}return}
  installHelp();
}
async function askPersist(){
  if(!(navigator.storage&&navigator.storage.persist)){toast(B('غير مدعوم في هذا المتصفح','Not supported in this browser'));return}
  try{persisted=await navigator.storage.persist()}catch(e){persisted=false}
  toast(persisted?B('تم التفعيل: لن يمسح المتصفح بياناتك تلقائياً','On: the browser will not auto-clear your data'):B('رفض المتصفح الطلب؛ ثبّت التطبيق وخذ نسخة احتياطية','The browser declined; install the app and keep backups'),persisted?'success':'error');
}
async function shareApp(){
  const url=location.href.split('#')[0],title=B('دفتر التاجر','Merchant Ledger');
  try{if(navigator.share){await navigator.share({title,text:B('دفتر تاجر يعمل دون إنترنت','Offline merchant ledger'),url});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(url);toast(B('نُسخ الرابط','Link copied'),'success')}catch(e){toast(url)}
}
function handleNx(k){
  if(k==='install')doInstall();
  else if(k==='ws')openWorkspaceModal();
  else if(k==='amounts'){hideAmt=!hideAmt;LS('ledger-hide-amounts',hideAmt?'1':'0');render();toast(hideAmt?B('أُخفيت المبالغ','Amounts hidden'):B('أُظهرت المبالغ','Amounts shown'))}
  else if(k==='font'){fontI=(fontI+1)%FONT.length;LS('ledger-font',String(fontI));applyFont();toast(B('حجم الخط: ','Text size: ')+B(FONT[fontI][0],FONT[fontI][1]))}
  else if(k==='persist')askPersist();
  else if(k==='share')shareApp();
}

/* ----- build bars ----- */
function buildBar(){
  const nav=$('#mobile-bottom-nav');if(!nav||nav.dataset.nx)return;nav.dataset.nx='1';
  const tab=(p,i)=>`<button type="button" class="mobile-tab" data-page="${p}" id="nx-t-${p}"><span>${ic(i,22)}</span><small></small><i class="tab-badge" hidden></i></button>`;
  nav.innerHTML=tab('dashboard','home')+tab('deals','swap')+`<button type="button" class="mobile-fab" id="nx-fab" aria-haspopup="dialog">${ic('plus',26)}</button>`+tab('debts','clock')+`<button type="button" class="mobile-tab" id="nx-more" aria-haspopup="dialog"><span>${ic('grid',22)}</span><small></small></button>`;
}
function buildTop(){
  const act=document.querySelector('.topbar-actions'),left=document.querySelector('.topbar-left');if(!act||act.dataset.nx)return;act.dataset.nx='1';
  const b=document.createElement('button');b.type='button';b.id='nx-options';b.className='nx-optbtn';b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.innerHTML=ic('dots',20);act.append(b);
  const n=document.createElement('button');n.type='button';n.id='nx-new';n.className='btn btn-primary btn-small nx-new';n.setAttribute('aria-haspopup','dialog');n.innerHTML='＋ <span></span>';left.append(n);
}
function overdue(){try{const t=today();return getDebtItems().filter(x=>x.remaining>0&&x.dueDate&&x.dueDate<t).length}catch(e){return 0}}
function syncNav(){
  if(!$('#nx-more'))return;
  const lab={dashboard:B('الرئيسية','Home'),deals:B('الصفقات','Deals'),debts:B('الديون','Debts')},main=['dashboard','deals','debts'],cp=typeof currentPage!=='undefined'?currentPage:'dashboard';
  for(const k in lab){const b=$('#nx-t-'+k);if(b){b.querySelector('small').textContent=lab[k];b.classList.toggle('active',cp===k)}}
  $('#nx-more small').textContent=B('المزيد','More');$('#nx-more').classList.toggle('active',!main.includes(cp));
  $('#nx-fab').setAttribute('aria-label',B('إضافة سريعة','Quick add'));
  const o=overdue(),bd=$('#nx-t-debts .tab-badge');if(bd){bd.textContent=o>9?'9+':o;bd.hidden=!o}
  const ob=$('#nx-options');if(ob){ob.setAttribute('aria-label',B('الخيارات','Options'));ob.title=B('الخيارات','Options')}
  const nw=$('#nx-new span');if(nw)nw.textContent=B('جديد','New');
  const sp=$('#sync-pill');if(sp){sp.title=B('النقطة الخضراء تعني أن البيانات محفوظة على هذا الجهاز فقط؛ لا توجد مزامنة سحابية.','The green dot means data is saved on this device only; there is no cloud sync.');sp.setAttribute('aria-label',sp.title);sp.dataset.shortLabel=B('محلي','Local')}
}
const _render=render;render=function(){_render();syncNav()};

/* ----- events (capture phase so we run before the app's own delegation) ----- */
document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#mobile-more,#nx-more,#mobile-menu')){e.preventDefault();e.stopImmediatePropagation();openSheet(B('المزيد','More'),moreHTML(),t.closest('button'));return}
  if(t.closest('#nx-fab,#nx-new')){e.preventDefault();openSheet(B('إضافة سريعة','Quick add'),quickHTML(),t.closest('button'));return}
  if(t.closest('#nx-options')){e.preventDefault();toggleMenu(t.closest('button'));return}
  const m=$('#nx-menu');
  if(m&&!m.hidden){
    if(!t.closest('#nx-menu')){closeMenu();return}
    const x=t.closest('[data-nx]');
    closeMenu();
    if(x){e.stopImmediatePropagation();handleNx(x.dataset.nx)}
    return;
  }
  if(t.closest('#nx-sheet')){
    const c=t.closest('[data-nx]');
    if(c){e.stopImmediatePropagation();closeSheet();if(c.dataset.nx!=='close')handleNx(c.dataset.nx);return}
    if(t.closest('[data-action],[data-page]'))closeSheet();
  }
},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeMenu();closeSheet();return}
  const m=$('#nx-menu');
  if(m&&!m.hidden&&(e.key==='ArrowDown'||e.key==='ArrowUp')){
    const it=[...m.querySelectorAll('.nx-opt')],i=it.indexOf(document.activeElement);
    it[(i+(e.key==='ArrowDown'?1:-1)+it.length)%it.length].focus();e.preventDefault();
  }
});
let y0=null;
document.addEventListener('touchstart',e=>{y0=e.target.closest('.nx-drag')?e.touches[0].clientY:null},{passive:true});
document.addEventListener('touchend',e=>{if(y0!==null&&e.changedTouches[0].clientY-y0>60)closeSheet();y0=null},{passive:true});
addEventListener('resize',closeMenu);

/* ----- "new version ready" banner (service-worker update) ----- */
if('serviceWorker'in navigator&&location.protocol!=='file:'){
  let had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!had){had=true;return}
    if($('#nx-update'))return;
    const d=document.createElement('div');d.id='nx-update';d.setAttribute('role','status');
    d.innerHTML=`<span>${B('نسخة جديدة من التطبيق جاهزة','A new version is ready')}</span><button type="button" class="btn btn-primary btn-small">${B('تحديث الآن','Update now')}</button>`;
    d.querySelector('button').onclick=()=>location.reload();document.body.append(d);
  });
}

applyFont();
buildBar();buildTop();syncNav();
setTimeout(()=>{try{if(sessionStorage.getItem('nx-bk'))return;sessionStorage.setItem('nx-bk','1');const d=lastBackup();if(recordsLive().length&&(d===null||d>14))toast(B('خذ نسخة احتياطية: ⋯ ← نسخة احتياطية','Take a backup: ⋯ → Backup'))}catch(e){}},4500);
})();
