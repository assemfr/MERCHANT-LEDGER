const CACHE='merchant-ledger-shell-v13';
const APP_ROOT=new URL('./',self.registration.scope);
const appURL=path=>new URL(path,APP_ROOT).href;
const SHELL=['','styles.css','app.js','pages.js','main.js','extras.js','polish.js','smart.js','nav.js','privacy.html','icon-maskable-512.png','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-180.png'].map(appURL);
const APP_HOME=appURL('');

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(caches.match(APP_HOME).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(APP_HOME,copy));}
      return response;
    }).catch(()=>new Response('Offline app shell is not installed yet. Open it once while the files are available.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}))));
    return;
  }

  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
    return response;
  }).catch(()=>new Response('',{status:504}))));
});
