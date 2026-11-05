// Monta o app real (shell, armazenamento e sincronização de verdade) com
// roteador em memória, armazenamento em memória e conteúdo lido de public/.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { createMemoryRouter } from "react-router";
import { App } from "../../src/app/App";
import { buildRoutes } from "../../src/app/routes";
import { createServices } from "../../src/app/services";
import type { FetchJSON } from "../../src/core/content";
import type { SyncOptions } from "../../src/core/sync";
import { sections as defaultSections } from "../../src/sections/registry";
import type { Section } from "../../src/sections/types";

export function memoryStorage(initial: Record<string, string> = {}) {
  const m = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    map: m,
  };
}

/** Lê arquivos de public/ (como o site serve em /content/...). */
export const diskFetch: FetchJSON = async (url) =>
  JSON.parse(readFileSync(join(process.cwd(), "public", url.replace(/^\//, "")), "utf8"));

export function renderApp(path: string, opts: {
  sections?: Section[];
  storage?: ReturnType<typeof memoryStorage>;
  fetchJSON?: FetchJSON;
  config?: SyncOptions["config"];
  syncOptions?: Partial<SyncOptions>;
} = {}) {
  const sections = opts.sections ?? defaultSections;
  const storage = opts.storage ?? memoryStorage();
  const services = createServices({
    storage,
    fetchJSON: opts.fetchJSON ?? diskFetch,
    config: opts.config ?? null,
    syncOptions: opts.syncOptions,
  });
  const router = createMemoryRouter(buildRoutes(sections), { initialEntries: [path] });
  const user = userEvent.setup();
  const view = render(<App services={services} sections={sections} router={router} />);
  return { ...view, router, services, storage, user };
}

/** Violações de acessibilidade sérias ou críticas (contraste fica com U01). */
export async function axeViolations(node: Element = document.body): Promise<string[]> {
  const res = await axe.run(node, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    resultTypes: ["violations"],
  });
  return res.violations
    .filter(v => v.impact === "serious" || v.impact === "critical")
    .map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);
}
