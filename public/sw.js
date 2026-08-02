const CACHE="jusou-v11";
const CORE=["./","./index.html","./explore.html","./membership.html","./business.html","./app.html","./user.html","./detail.html","./play.html","./assets/css/style.css","./assets/css/product.css","./assets/js/data.js","./assets/js/ui.js","./assets/js/shell.js","./assets/js/app.js","./assets/js/player-pro.js","./assets/js/membership.js","./assets/js/hls.min.js","./favicon.svg","./manifest.webmanifest","./assets/payments/wechat.jpg","./assets/payments/alipay.jpg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=="GET"||url.pathname.startsWith("/api/")||request.destination==="video")return;
  if(request.destination==="image"){
    event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok||response.type==="opaque"){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})));
    return;
  }
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(hit=>hit||caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok&&url.origin===location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})));
});
