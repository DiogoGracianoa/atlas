// Cenários S01–S08 e S10 (atlas-tecnologia-subtemas): agrupador, rotas,
// chaves, mapa, continuar, menu e busca com subtemas.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { screen, waitFor, within } from "@testing-library/react";
import type { FetchJSON } from "../../../src/core/content";
import type { Manifest } from "../../../src/core/types";
import { curriculum, manifest as manifestoTeste } from "../../core/helpers";
import { memoryStorage, renderApp } from "../harness";

const real = JSON.parse(readFileSync("private/content/areas.json", "utf8")) as Manifest;
const politica = real.areas.find(a => a.slug === "politica")!;
const base = manifestoTeste().areas[0]!;

// Currículo do subtema: o de teste, com um tema que fala de Conway.
const curSub = curriculum();
curSub.modules[0]!.steps[0]!.title = "Lei de Conway na prática";

function manifesto(extra: Manifest["areas"] = []): Manifest {
  return {
    areas: [
      politica,
      {
        slug: "tecnologia", nome: "Tecnologia", resumo: "Recortes de tecnologia.", status: "disponivel",
        subtemas: [
          { ...base, slug: "arq-lideranca", nome: "Arquitetura e liderança", titulo: "Atlas de arquitetura", arquivo: "content/arq-lideranca/curriculum.json" },
          { slug: "dados", nome: "Dados", resumo: "Em breve.", status: "planejado" },
          ...extra,
        ],
      },
    ],
  };
}

function fetcher(man: Manifest, files: Record<string, unknown> = {}): FetchJSON {
  return async (url) => {
    if (url === "content/areas.json") return structuredClone(man);
    if (url === "content/arq-lideranca/curriculum.json") return structuredClone(curSub);
    if (url in files) return structuredClone(files[url]);
    if (url.startsWith("content/")) return JSON.parse(readFileSync("private/" + url, "utf8"));
    throw new Error("404 " + url);
  };
}

const at = "2026-11-06T10:00:00.000Z";
const estado = (extra: object) => JSON.stringify({ v: 3, marks: {}, notes: {}, lastAt: null, resetAt: null, totals: {}, size: "m", theme: "auto", ...extra });

describe("agrupador (S01)", () => {
  it("/atlas/tecnologia lista os subtemas disponíveis; planejado não aparece", async () => {
    renderApp("/atlas/tecnologia", { fetchJSON: fetcher(manifesto()) });
    expect(await screen.findByRole("heading", { level: 1, name: "Tecnologia" })).toBeTruthy();
    const lista = screen.getByRole("list", { name: "Subtemas" });
    expect(within(lista).getByRole("link", { name: /Arquitetura e liderança/ }).getAttribute("href")).toBe("/atlas/tecnologia/arq-lideranca");
    expect(screen.queryByText("Dados")).toBeNull();
    expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
  });
});

describe("rotas com subtema (S02, S03)", () => {
  it("capa do subtema e tema", async () => {
    renderApp("/atlas/tecnologia/arq-lideranca/m1e1", { fetchJSON: fetcher(manifesto()) });
    expect(await screen.findByRole("heading", { level: 1, name: "Lei de Conway na prática" })).toBeTruthy();
  });

  it("subtema desconhecido ou planejado volta ao agrupador com aviso", async () => {
    const a = renderApp("/atlas/tecnologia/xyz", { fetchJSON: fetcher(manifesto()) });
    await waitFor(() => expect(a.router.state.location.pathname).toBe("/atlas/tecnologia"));
    expect(await screen.findByText("Subtema não encontrado.")).toBeTruthy();
    a.unmount();
    const b = renderApp("/atlas/tecnologia/dados", { fetchJSON: fetcher(manifesto()) });
    await waitFor(() => expect(b.router.state.location.pathname).toBe("/atlas/tecnologia"));
    expect(await screen.findByText("Subtema não encontrado.")).toBeTruthy();
  });

  it("item desconhecido no subtema volta à capa do subtema", async () => {
    const { router } = renderApp("/atlas/tecnologia/arq-lideranca/zzz", { fetchJSON: fetcher(manifesto()) });
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/tecnologia/arq-lideranca"));
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas de arquitetura" })).toBeTruthy();
  });

  it("área sem subtemas com três partes volta à capa da área", async () => {
    const { router } = renderApp("/atlas/politica/m1e1/extra", { fetchJSON: fetcher(manifesto()) });
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/politica"));
  });
});

describe("chaves e progresso (S04, S05)", () => {
  it("marcar no subtema grava a chave {subtema}/{id}; política segue igual", async () => {
    const { user, services } = renderApp("/atlas/tecnologia/arq-lideranca/m1e1", { fetchJSON: fetcher(manifesto()) });
    await user.click(await screen.findByRole("button", { name: "Marcar definição como lida" }));
    expect(services.store.isDone("arq-lideranca/m1e1", "def")).toBe(true);
    expect(Object.keys(services.store.state.marks)).toEqual(["arq-lideranca/m1e1:def"]);
  });

  it("cartão do agrupador no mapa soma o progresso dos subtemas", async () => {
    const marks = { "arq-lideranca/m1e1:def": { done: true, at }, "arq-lideranca/m1e2:def": { done: true, at } };
    renderApp("/atlas", { fetchJSON: fetcher(manifesto()), storage: memoryStorage({ "atlas-v3": estado({ marks, totals: { "arq-lideranca": 8 } }) }) });
    const lista = await screen.findByRole("list", { name: "Áreas" });
    const tec = within(lista).getByRole("link", { name: /Tecnologia/ });
    expect(tec.getAttribute("href")).toBe("/atlas/tecnologia");
    const bar = within(tec).getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(bar.getAttribute("aria-valuemax")).toBe("8");
  });
});

describe("continuar, menu e busca (S06–S08)", () => {
  it("continuar leva ao endereço completo do subtema", async () => {
    renderApp("/atlas", { fetchJSON: fetcher(manifesto()), storage: memoryStorage({ "atlas-v3": estado({ lastAt: { route: "arq-lideranca/m1e2", at } }) }) });
    const link = await screen.findByRole("link", { name: /Continuar de onde parei/ });
    expect(link.getAttribute("href")).toBe("/atlas/tecnologia/arq-lideranca/m1e2");
    expect(link.textContent).toContain("Arquitetura e liderança");
  });

  it("seletor lista o subtema sob o nome da área e leva ao endereço completo", async () => {
    const { user, router } = renderApp("/atlas", { fetchJSON: fetcher(manifesto()) });
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    await user.click(within(nav).getByRole("button", { name: /^Área/ }));
    const lista = within(nav).getByRole("listbox", { name: "Área" });
    // agrupador e seu subtema disponível; o planejado (Dados) não aparece
    expect(within(lista).getAllByRole("option").map(o => o.textContent)).toEqual(["Mapa do Atlas", "Política, economia e marxismo", "Tecnologia", "Arquitetura e liderança"]);
    await user.click(within(lista).getByRole("option", { name: "Arquitetura e liderança" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/tecnologia/arq-lideranca"));
  });

  it("buscar em todas as áreas inclui o subtema", async () => {
    const { user } = renderApp("/atlas/politica", { fetchJSON: fetcher(manifesto()) });
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    await user.type(within(nav).getByLabelText("Buscar"), "Conway");
    await user.click(within(nav).getByRole("button", { name: "Buscar “Conway” em todas as áreas" }));
    const grupo = await within(nav).findByRole("region", { name: "Resultados em Arquitetura e liderança" });
    const link = within(grupo).getByRole("link", { name: /Lei de Conway na prática/ });
    expect(link.getAttribute("href")).toBe("/atlas/tecnologia/arq-lideranca/m1e1");
  });
});

describe("subtema novo sem código (S10)", () => {
  it("um segundo subtema disponível aparece e navega", async () => {
    const outro = { ...base, slug: "outro-sub", nome: "Outro subtema", titulo: "Atlas do outro", arquivo: "content/outro-sub/curriculum.json" };
    const { user } = renderApp("/atlas/tecnologia", { fetchJSON: fetcher(manifesto([outro]), { "content/outro-sub/curriculum.json": curriculum() }) });
    const lista = await screen.findByRole("list", { name: "Subtemas" });
    await user.click(within(lista).getByRole("link", { name: /Outro subtema/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas do outro" })).toBeTruthy();
  });
});
