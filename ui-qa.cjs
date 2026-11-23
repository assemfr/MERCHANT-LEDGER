const {JSDOM, VirtualConsole}=require('jsdom');
const crypto=require('node:crypto').webcrypto;
const {TextEncoder,TextDecoder}=require('node:util');
const base='http://127.0.0.1:8080';
let fetchCalls=0;
const errors=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!String(e.message).includes('Not implemented'))errors.push(e.message)});
vc.on('error',(...args)=>errors.push(args.join(' ')));
vc.on('warn',(...args)=>errors.push(args.join(' ')));
const wait=(fn,label,timeout=8000)=>new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{try{if(fn()){clearInterval(timer);resolve()}else if(Date.now()-start>timeout){clearInterval(timer);reject(new Error('Timed out: '+label))}}catch(e){clearInterval(timer);reject(e)}},30)});
(async()=>{
 const dom=await JSDOM.fromURL(base+'/',{
  runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(window){
   Object.defineProperty(window,'crypto',{value:crypto,configurable:true});
   window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;
   Object.defineProperty(window.navigator,'onLine',{value:false,configurable:true});
   window.Headers=global.Headers;
   window.fetch=async()=>{fetchCalls++;throw new Error('Unexpected network request in local-only mode')};
   window.scrollTo=()=>{};
   window.confirm=()=>true;
   window.Element.prototype.scrollIntoView=()=>{};
   window.URL.createObjectURL=()=> 'blob:qa';
   window.URL.revokeObjectURL=()=>{};
   window.open=()=>({opener:null,document:{open(){},write(){},close(){}}});
  }
 });
 await wait(()=>dom.window.document.readyState==='complete','document load');
 const w=dom.window,d=w.document;
 await wait(()=>typeof w.boot==='function'&&d.querySelector('#app-screen'),'app scripts loaded');
 await wait(()=>!d.querySelector('#app-screen').hidden,'local-only app opens');
 if(d.querySelector('[data-i18n="brand"]').textContent!=='دفتر التاجر')throw new Error('Arabic static translation failed: '+d.querySelector('[data-i18n="brand"]').textContent);
 await wait(()=>d.querySelector('#page-view').textContent.includes('ملخص حي'),'dashboard render');
 if(w.eval('workspace.id')!=='device-local'||w.eval('role')!=='owner')throw new Error('app did not start in local-only mode');
 if(d.querySelector('#auth-form')||d.querySelector('[data-page="team"]'))throw new Error('cloud account or team UI should be absent in local-only mode');
 if(fetchCalls)throw new Error('app made a network request during offline startup');
 // Deal and partial-payment workflow.
 d.querySelector('[data-page="deals"]').click();await wait(()=>d.querySelector('form[data-form="deal"]'),'deal form');
 const deal=d.querySelector('form[data-form="deal"]');const set=(form,name,value)=>{const el=form.elements.namedItem(name);if(!el)throw new Error('missing field '+name);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}))};
 set(deal,'date','2026-11-23');set(deal,'time','14:15');set(deal,'item','QA wheat');set(deal,'qty','10');set(deal,'purchase','5000');set(deal,'sale','6800');set(deal,'expenses','200');set(deal,'paid','3000');set(deal,'received','4000');set(deal,'supplier','Supplier QA');set(deal,'customer','Customer QA');set(deal,'supplierPhone','0611223344');set(deal,'customerPhone','0611334455');
 deal.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>d.querySelector('#page-view').textContent.includes('QA wheat'),'deal saved');
 d.querySelector('[data-page="debts"]').click();await wait(()=>d.querySelector('[data-action="payment"]'),'debt/payment list');
 const payBtn=d.querySelector('[data-action="payment"][data-side="pay"]');if(!payBtn)throw new Error('supplier balance payment button missing');payBtn.click();
 await wait(()=>d.querySelector('#modal-root form[data-form="payment-modal"]'),'payment modal');
 const payform=d.querySelector('#modal-root form');set(payform,'amount','200');payform.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>!d.querySelector('#modal-root form[data-form="payment-modal"]'),'partial payment saved');
 const remaining=Number(w.eval("getDebtItems().find(x=>x.direction==='payable').remaining"));if(remaining!==1800)throw new Error('wrong payable remainder: '+remaining);
 // Standalone debt, repair ticket and cashbook voucher entry paths.
 const debtForm=d.querySelector('form[data-form="debt"]');set(debtForm,'person','QA Debtor');set(debtForm,'total','300');set(debtForm,'paid','100');set(debtForm,'reason','QA credit');debtForm.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA Debtor'),'standalone debt saved');
 d.querySelector('[data-page="repairs"]').click();await wait(()=>d.querySelector('form[data-form="repair"]'),'repair form');const rf=d.querySelector('form[data-form="repair"]');set(rf,'item','QA Phone Repair');set(rf,'customer','Repair Customer');set(rf,'charge','500');set(rf,'received','150');set(rf,'parts','60');set(rf,'labor','80');rf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA Phone Repair'),'repair saved');
 d.querySelector('[data-page="treasury"]').click();await wait(()=>d.querySelector('form[data-form="voucher"]'),'voucher form');const vf=d.querySelector('form[data-form="voucher"]');set(vf,'direction','income');set(vf,'date','2026-11-23');set(vf,'title','QA cash receipt');set(vf,'amount','75');set(vf,'party','QA party');vf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA cash receipt'),'cashbook voucher saved');const voucherCount=w.eval("recordsLive().filter(r=>r.kind==='voucher').length");d.querySelector('[data-action="edit"][data-kind="voucher"]').click();await wait(()=>d.querySelector('form[data-form="voucher"] h3')?.textContent.includes('تعديل'),'voucher edit form');const vef=d.querySelector('form[data-form="voucher"]');set(vef,'title','QA updated receipt');set(vef,'amount','90');vef.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA updated receipt'),'voucher update saved');if(w.eval("recordsLive().filter(r=>r.kind==='voucher').length")!==voucherCount||Number(w.eval("recordsLive().find(r=>r.title==='QA updated receipt').amount"))!==90)throw new Error('voucher edit duplicated or failed to update');
 // Local-only mode has no remote team invitations; all remaining local sections render.
 if(d.querySelector('[data-page="team"]'))throw new Error('team sharing should not be exposed in local-only mode');
 for(const p of ['ethics','settings']){d.querySelector(`[data-page="${p}"]`).click();await wait(()=>d.querySelector('#page-title').textContent.length>0,p+' page render')}
 // Add and track a livestock record and a manual catalog item.
 d.querySelector('[data-page="livestock"]').click();await wait(()=>d.querySelector('form[data-form="animal"]'),'animal form');const af=d.querySelector('form[data-form="animal"]');set(af,'name','QA Cow');set(af,'tag','QA-001');set(af,'species','cattle');af.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA Cow'),'animal saved');
 const animal=w.eval("liveDocs('animals').find(x=>x.name==='QA Cow')");const care=d.querySelector('form[data-form="care"]');set(care,'animalId',animal.id);set(care,'type','feed');set(care,'date','2026-11-23');set(care,'detail','QA feeding check');set(care,'feed','Barley');care.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA feeding check'),'care event saved');
 d.querySelector('[data-page="lands"]').click();await wait(()=>d.querySelector('form[data-form="land"]'),'land form');const lf=d.querySelector('form[data-form="land"]');set(lf,'name','QA Field');set(lf,'location','Oujda');set(lf,'area','1 hectare');set(lf,'role','tenant');set(lf,'crop','Wheat');lf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA Field'),'land saved');
 d.querySelector('[data-page="catalog"]').click();await wait(()=>d.querySelector('form[data-form="catalog"]'),'catalog form');const cf=d.querySelector('form[data-form="catalog"]');set(cf,'name','QA flour');set(cf,'sku','QA-F01');set(cf,'unit','bag');set(cf,'cost','50');set(cf,'price','75');set(cf,'stock','20');set(cf,'minStock','5');cf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('QA flour'),'catalog saved');
 // Reports include the customer statement action and opening it is safe.
 d.querySelector('[data-page="reports"]').click();await wait(()=>d.querySelector('[data-action="statement"]'),'contact statements');const statementButton=[...d.querySelectorAll('[data-action="statement"]')].find(b=>b.dataset.person==='Customer QA');if(statementButton){statementButton.click();await wait(()=>d.querySelector('#modal-root').textContent.includes('كشف حساب'),'statement modal');if(!d.querySelector('#modal-root').textContent.includes('QA wheat'))throw new Error('statement missing deal detail');}
 // English switch must not expose translation identifiers.
 d.querySelector('#language-toggle').click();await wait(()=>d.documentElement.lang==='en','language switch');if(d.querySelector('[data-i18n="brand"]').textContent!=='Merchant Ledger')throw new Error('English static translation failed');if(d.querySelector('#sync-label').textContent!=='Saved on this device'||d.querySelector('#workspace-role').textContent!=='Local storage')throw new Error('local-only labels did not translate');
 // Legacy restore maps the previous standalone schema without replacing current tenant state.
 const before=w.eval('recordsLive().length');await w.importBackupObject({v:5,cur:'د.م.',language:'ar',records:[{id:99001,kind:'buy',date:'2025-01-01',item:'Old ledger item',buy:100,sell:140,paid:50,recv:140}],sectorData:{animals:[{id:'old-a',name:'Old cow',species:'بقر'}],activities:['بيع قطع الغيار']}});
 await wait(()=>d.querySelector('#toast').classList.contains('show'),'legacy import feedback');if(w.eval('recordsLive().length')<=before)throw new Error('legacy records were not merged');if(!w.eval("liveDocs('animals').some(x=>x.name==='Old cow')"))throw new Error('legacy specialist data missing');
 // Local records survive reopening; multiple isolated ledgers can coexist on this device.
 const localCount=w.eval('recordsLive().length');await w.openLocalApp();if(w.eval('recordsLive().length')!==localCount)throw new Error('local records did not persist after reopening');const firstId=w.eval('workspace.id');d.querySelector('#workspace-switcher').click();await wait(()=>d.querySelector('#modal-root form[data-form="local-workspace"]'),'local ledger manager');const wsf=d.querySelector('#modal-root form[data-form="local-workspace"]');set(wsf,'name','QA second local store');wsf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>w.eval('workspace.id')!==firstId,'second local ledger created');const secondId=w.eval('workspace.id');if(w.eval('recordsLive().length')!==0)throw new Error('local ledgers share records');d.querySelector('[data-page="debts"]').click();await wait(()=>d.querySelector('form[data-form="debt"]'),'second ledger debt form');const secondDebt=d.querySelector('form[data-form="debt"]');set(secondDebt,'person','Second store contact');set(secondDebt,'total','50');secondDebt.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('#page-view').textContent.includes('Second store contact'),'second ledger record saved');d.querySelector('#workspace-switcher').click();await wait(()=>d.querySelector('[data-action="switch-local-workspace"][data-id="'+firstId+'"]'),'ledger switcher');d.querySelector('[data-action="switch-local-workspace"][data-id="'+firstId+'"]').click();await wait(()=>w.eval('workspace.id')===firstId,'switch back to first local ledger');if(w.eval('recordsLive().length')!==localCount)throw new Error('first local ledger data changed while switching');await w.openLocalApp(secondId);if(!w.eval("recordsLive().some(r=>r.person==='Second store contact')"))throw new Error('second local ledger did not persist');await w.openLocalApp(firstId);if(fetchCalls)throw new Error('local-only workflow made a network request');
 // Encrypted backup uses PBKDF2 + AES-GCM and decrypts back to the same ledger payload.
 const encrypted=await w.encryptBackup('BackupPass-QA-123');const decrypted=await w.decryptBackup(encrypted,'BackupPass-QA-123');if(!decrypted.data||!decrypted.data.records.some(r=>r.item==='Old ledger item'))throw new Error('encrypted backup round-trip failed');
 if(errors.length)throw new Error('JS console errors: '+errors.join(' | '));
 console.log('UI QA PASS: offline local startup, no network calls, persistence, multiple isolated local ledgers, deals, partial payments, debt, repair, cashbook/voucher edit, livestock/care, land, catalog, statements, English, legacy import, encrypted backup');
 dom.window.close();
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
