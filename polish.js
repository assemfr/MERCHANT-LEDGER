/* polish.js — in-app confirm dialog, theme (auto/light/dark), appearance settings, text size, hide amounts, page transitions */
(function(){
'use strict';
const B=(a,e)=>uiLang==='en'?e:a;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};

/* ---------- confirm dialog (window.confirm is blocked in embedded/sandboxed pages) ---------- */
window.askConfirm=function(message,opt){
  opt=opt||{};
  return new Promise(res=>{
    const old=document.getElementById('px-confirm');if(old)old.remove();
    const prev=document.activeElement,d=document.createElement('div');d.id='px-confirm';
    d.innerHTML='<div class="px-cbackdrop"></div><div class="px-cbox" role="alertdialog" aria-modal="true" aria-labelledby="px-ct"><div class="px-cico" aria-hidden="true">!</div><p id="px-ct"></p><div class="px-cbtns"><button type="button" class="btn btn-outline"></button><button type="button" class="btn"></button></div></div>';
    d.querySelector('#px-ct').textContent=message;
    const [no,yes]=d.querySelectorAll('button');yes.classList.add(opt.danger===false?'btn-primary':'px-danger');
    no.textContent=opt.cancel||B('إلغاء','Cancel');yes.textContent=opt.ok||B('حذف','Delete');
    const done=v=>{document.removeEventListener('keydown',key,true);d.remove();if(prev&&prev.isConnected&&prev.focus)prev.focus();res(v)};
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();done(false)}
      else if(e.key==='Tab'){e.preventDefault();(document.activeElement===no?yes:no).focus()}
    };
    no.onclick=()=>done(false);yes.onclick=()=>done(true);
    d.querySelector('.px-cbackdrop').onclick=()=>done(false);
    document.addEventListener('keydown',key,true);
    document.body.append(d);no.focus();
  });
};

/* ---------- theme ---------- */
const MODES=['auto','light','dark'];
let theme=LS('ledger-theme');if(MODES.indexOf(theme)<0)theme='auto';
const mq=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>theme==='dark'||(theme==='auto'&&mq.matches);
function applyTheme(){
  const d=isDark();document.documentElement.dataset.theme=d?'dark':'light';
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=d?'#0c1815':'#123a32';
}
if(mq.addEventListener)mq.addEventListener('change',()=>{if(theme==='auto')applyTheme()});
const rerender=()=>{try{if(typeof workspace!=='undefined'&&workspace)render()}catch(e){}};
function setTheme(t){theme=t;LS('ledger-theme',t);applyTheme();rerender()}
const TL={auto:['تلقائي','Auto'],light:['فاتح','Light'],dark:['داكن','Dark']};

/* ---------- text size + hide amounts ---------- */
const FONT=[['عادي','Normal',''],['كبير','Large','18px'],['أكبر','Larger','20px']];
let fontI=Math.min(2,Math.max(0,parseInt(LS('ledger-font')||'0')||0));
const applyFont=()=>{document.documentElement.style.fontSize=FONT[fontI][2]};
let hide=LS('ledger-hide-amounts')==='1';
const _money=money;money=function(v){return hide?'•••• '+esc(currency()):_money(v)};
function setHide(v){hide=!!v;LS('ledger-hide-amounts',hide?'1':'0');rerender()}

window.PX={
  dark:isDark,hide:()=>hide,theme:()=>theme,
  themeLabel:()=>B(TL[theme][0],TL[theme][1]),
  cycleTheme(){setTheme(MODES[(MODES.indexOf(theme)+1)%MODES.length]);toast(B('المظهر: ','Theme: ')+B(TL[theme][0],TL[theme][1]))},
  toggleHide(){setHide(!hide);toast(hide?B('أُخفيت المبالغ','Amounts hidden'):B('أُظهرت المبالغ','Amounts shown'))}
};

/* ---------- Settings → Appearance panel ---------- */
function appearancePanel(){
  const seg=(items,cur,attr)=>'<div class="segmented" role="group">'+items.map(i=>`<button type="button" class="${cur===i[0]?'active':''}" ${attr}="${i[0]}">${B(i[1],i[2])}</button>`).join('')+'</div>';
  const body=`<div class="px-pref"><div><strong>${B('المظهر','Theme')}</strong><small>${B('فاتح أو داكن، أو حسب نظام جهازك','Light, dark, or follow your device')}</small></div>${seg([['auto','تلقائي','Auto'],['light','☀ فاتح','☀ Light'],['dark','☾ داكن','☾ Dark']],theme,'data-theme-set')}</div>
<div class="px-pref"><div><strong>${B('حجم الخط','Text size')}</strong><small>${B('يكبّر النصوص في كل الشاشات','Enlarges text on every screen')}</small></div>${seg(FONT.map((f,i)=>[String(i),f[0],f[1]]),String(fontI),'data-font-set')}</div>
<div class="px-pref"><div><strong>${B('إخفاء المبالغ','Hide amounts')}</strong><small>${B('تظهر •••• بدل الأرقام أمام الآخرين','Shows •••• instead of figures around others')}</small></div><label class="px-switch"><input type="checkbox" data-amt-toggle ${hide?'checked':''} aria-label="${B('إخفاء المبالغ','Hide amounts')}"><span></span></label></div>`;
  return `<div class="stack" style="margin-top:14px">${panel(B('المظهر والعرض','Appearance'),body)}</div>`;
}
const _rs=renderSettings;
renderSettings=function(){
  const h=_rs(),i=h.indexOf('<div class="content-grid">'),p=appearancePanel().replace('margin-top:14px','margin-bottom:14px');
  return i>0?h.slice(0,i)+p+h.slice(i):h+p;
};

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-theme-set]');if(t){setTheme(t.dataset.themeSet);return}
  const f=e.target.closest('[data-font-set]');if(f){fontI=parseInt(f.dataset.fontSet)||0;LS('ledger-font',String(fontI));applyFont();rerender()}
});
document.addEventListener('change',e=>{if(e.target.matches&&e.target.matches('[data-amt-toggle]'))setHide(e.target.checked)});

/* ---------- soft page transition ---------- */
const _nav=navigate;
navigate=function(p){_nav(p);const v=document.getElementById('page-view');if(v){v.classList.remove('pv-in');void v.offsetWidth;v.classList.add('pv-in')}};

applyTheme();applyFont();
rerender();
})();
