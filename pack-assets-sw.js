/* Cache media only: pack records, HTML and scripts always use the network. */
const CACHE='pack-creator-media-v1',MAX_ENTRIES=240,MAX_BYTES=16*1024*1024,MAX_AGE=7*24*60*60*1000;
const pending=new Map();
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
function mediaURL(url){const base=new URL(self.registration.scope);return url.origin===base.origin&&url.pathname.startsWith(base.pathname)&&/\/(images|border|music|sounds|fonts)\//i.test(url.pathname)&&/\.(png|gif|jpe?g|webp|mp3|ogg|wav|woff2?)(?:$)/i.test(url.pathname);}
async function obtain(request,cache){const response=await fetch(request);if(response.status===200&&response.type!=='opaque'){const length=Number(response.headers.get('content-length'));if(length&&length<=MAX_BYTES){const headers=new Headers(response.headers);headers.set('x-pack-cached-at',String(Date.now()));await cache.put(request,new Response(response.clone().body,{status:200,headers}));const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-MAX_ENTRIES)))await cache.delete(key);}}return response;}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||!mediaURL(new URL(request.url)))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(request.url);if(cached&&Date.now()-Number(cached.headers.get('x-pack-cached-at'))<MAX_AGE){const range=request.headers.get('range');if(!range)return cached;const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(match){const buffer=await cached.arrayBuffer(),start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):buffer.byteLength-1,buffer.byteLength-1);if(start<=end){const headers=new Headers(cached.headers);headers.set('content-range','bytes '+start+'-'+end+'/'+buffer.byteLength);headers.set('content-length',String(end-start+1));headers.set('accept-ranges','bytes');return new Response(buffer.slice(start,end+1),{status:206,headers});}}}
 if(request.headers.has('range'))return fetch(request);
 if(!pending.has(request.url))pending.set(request.url,obtain(request,cache).finally(()=>pending.delete(request.url)));return (await pending.get(request.url)).clone();})());
});
