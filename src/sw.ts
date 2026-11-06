/// <reference lib="webworker" />
// Service worker (ADR-007, contrato KW1). Publicado em /sw.js, o mesmo caminho
// do service worker antigo, para substituí-lo nos aparelhos já em uso.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { clientsClaim } from "workbox-core";
import { cacheRule, CONTENT_CACHE, DIAGRAM_CACHE, OLD_CACHES } from "./sw-rules";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

void self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Arquivos do build (JS, CSS, fontes, index.html, ícones) com versão.
precacheAndRoute(self.__WB_MANIFEST);

// Qualquer rota do app abre offline a partir do index.html guardado.
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), {
  allowlist: [/^\/(?!content\/).*/],
}));

// Manifesto e currículos: sempre tenta a rede; sem ela (ou lenta), usa o cache.
registerRoute(
  ({ url, request }) => cacheRule(url, request.mode, self.location.origin) === "conteudo",
  new NetworkFirst({ cacheName: CONTENT_CACHE, networkTimeoutSeconds: 3 }),
);

// Mermaid (diagramas): só baixa quando um tema com diagrama abre; depois fica.
registerRoute(
  ({ url, request }) => cacheRule(url, request.mode, self.location.origin) === "diagramas",
  new CacheFirst({ cacheName: DIAGRAM_CACHE }),
);

// O resto (Supabase, links externos) passa direto para a rede.

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all(OLD_CACHES.map(name => caches.delete(name))));
});
