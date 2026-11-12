import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/global.css";
import { App } from "./app/App";
import { createServices } from "./app/services";
import { legacyToPath } from "./core/legacy";
import { createCanonicalRedirect } from "./core/origem";
import { sections } from "./sections/registry";
import { applyPrefs, installTheme } from "./ui/theme";

// Links antigos (#/politica/m1e1, #m1e1…) viram rotas limpas antes de o
// roteador montar, substituindo o endereço sem entrada extra no histórico (KR2).
// O site antigo era uma página só, na raiz: hash em outras rotas (como o
// #conteudo do link de pular) é do próprio app e fica intocado.
const legacy = window.location.pathname === "/" ? legacyToPath(window.location.hash) : null;
if (legacy) window.history.replaceState(null, "", legacy + window.location.search);

installTheme();
const services = createServices();
applyPrefs({ theme: services.store.state.theme, size: services.store.state.size });

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root ausente em index.html");

createRoot(root).render(
  <StrictMode>
    <App services={services} sections={sections} />
  </StrictMode>,
);

void services.sync.init();

// Endereço antigo → domínio canônico, só depois de enviar as pendências (KO1).
createCanonicalRedirect({ canonical: import.meta.env.VITE_ORIGEM_CANONICA, win: window, sync: services.sync });

// Offline (ADR-007): o service worker só existe no build de produção.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e: unknown) => console.warn("Service worker não registrado:", e));
  });
}
