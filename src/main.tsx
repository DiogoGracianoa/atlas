import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/global.css";
import { App } from "./app/App";
import { createServices } from "./app/services";
import { legacyToPath } from "./core/legacy";
import { sections } from "./sections/registry";
import { applyPrefs, installTheme } from "./ui/theme";

// Links antigos (#/politica/m1e1, #m1e1…) viram rotas limpas antes de o
// roteador montar, substituindo o endereço sem entrada extra no histórico (KR2).
const legacy = legacyToPath(window.location.hash);
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
