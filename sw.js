// Service worker do Atlas: abre e navega sem rede (RN17, RN30).
//
// - Mesmo site (app, manifesto, currículos): rede primeiro, com limite de 3 s;
//   sem resposta, usa o cache. Cada resposta boa atualiza o cache, então não há
//   número de versão para lembrar de trocar a cada deploy (D6).
// - Currículo de área só entra no cache quando a área é aberta (RN30).
// - supabase-js (URLs com versão fixa) e arquivos de fonte: cache primeiro.
// - API do Supabase e qualquer outra origem: nunca passam pelo cache.
const CACHE = "atlas-v1";
const SHELL = [
  "./",
  "index.html",
  "assets/app.css",
  "assets/app.js",
  "assets/sync.js",
  "assets/config.js",
  "assets/lib/backup.js",
  "assets/lib/content.js",
  "assets/lib/merge.js",
  "assets/lib/queue.js",
  "assets/lib/routes.js",
  "assets/lib/store.js",
  "content/areas.json"
];
const TIMEOUT_MS = 3000;
const IMMUTABLE = ["https://cdn.jsdelivr.net/npm/", "https://fonts.gstatic.com/"];
const REVALIDATE = ["https://fonts.googleapis.com/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("atlas-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(event, req, url));
  } else if (IMMUTABLE.some(p => req.url.startsWith(p))) {
    event.respondWith(cacheFirst(req));
  } else if (REVALIDATE.some(p => req.url.startsWith(p))) {
    event.respondWith(staleWhileRevalidate(event, req));
  }
  // demais origens (incluindo a API do Supabase): direto para a rede
});

// Navegações (inclusive o retorno do login com ?code=) usam o mesmo index.html.
const cacheKey = (req, url) => (req.mode === "navigate" ? new Request(new URL("index.html", self.registration.scope)) : req);

async function networkFirst(event, req, url) {
  const cache = await caches.open(CACHE);
  const key = cacheKey(req, url);
  const network = fetch(req).then(res => {
    if (res.ok) event.waitUntil(cache.put(key, res.clone()));
    return res;
  });
  const timeout = new Promise(resolve => setTimeout(resolve, TIMEOUT_MS, null));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch (e) { /* sem rede */ }
  const cached = await cache.match(key);
  if (cached) {
    event.waitUntil(network.catch(() => {})); // segue atualizando o cache em segundo plano
    return cached;
  }
  return network; // sem cache: espera a rede (ou falha como falharia sem SW)
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res.ok || res.type === "opaque") cache.put(req, res.clone());
    return res;
  });
  if (cached) { event.waitUntil(network.catch(() => {})); return cached; }
  return network;
}
