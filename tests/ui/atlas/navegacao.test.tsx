// Cenários R01, R02 (KR1), R07 (área nova sem código) e P01–P05 (mapa, capa,
// menu, busca, progresso).
import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { FetchJSON } from "../../../src/core/content";
import { curriculum, manifest } from "../../core/helpers";
import { axeViolations, memoryStorage, renderApp } from "../harness";

const at = "2026-11-05T10:00:00.000Z";
const estado = (extra: object = {}) => JSON.stringify({ v: 3, marks: {}, notes: {}, lastAt: null, resetAt: null, totals: {}, size: "m", theme: "auto", ...extra });

describe("rotas do atlas (KR1)", () => {
  it("/atlas/politica/m8e3 abre o tema pelo título", async () => {
    renderApp("/atlas/politica/m8e3");
    expect(await screen.findByRole("heading", { level: 1, name: "Marx: dívida pública, impostos e capital fictício" })).toBeTruthy();
  });

  it("área planejada volta ao mapa com aviso", async () => {
    const { router } = renderApp("/atlas/historia");
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas"));
    expect(await screen.findByText("Esta área ainda não está disponível.")).toBeTruthy();
    expect(await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" })).toBeTruthy();
  });

  it("área desconhecida volta ao mapa com aviso", async () => {
    const { router } = renderApp("/atlas/xyz");
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas"));
    expect(await screen.findByText("Área não encontrada.")).toBeTruthy();
  });

  it("item desconhecido volta à capa da área", async () => {
    const { router } = renderApp("/atlas/politica/zzz");
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/politica"));
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas de política, economia e marxismo" })).toBeTruthy();
  });

  it("área sem conexão na primeira abertura volta ao mapa com o aviso de conexão", async () => {
    const offline: FetchJSON = async (url) => {
      if (url.endsWith("areas.json")) return JSON.parse((await import("node:fs")).readFileSync("public/content/areas.json", "utf8"));
      throw new Error("Failed to fetch");
    };
    const { router } = renderApp("/atlas/politica", { fetchJSON: offline });
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas"));
    expect(await screen.findByText("Esta área precisa de conexão na primeira abertura.")).toBeTruthy();
  });
});

describe("mapa (P01)", () => {
  it("áreas com link, planejadas em breve e o atalho para continuar", async () => {
    renderApp("/atlas", { storage: memoryStorage({ "atlas-v3": estado({ lastAt: { route: "politica/m3e2", at } }) }) });
    expect(await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" })).toBeTruthy();
    const lista = screen.getByRole("list", { name: "Áreas" });
    expect(within(lista).getByRole("link", { name: /Política, economia e marxismo/ }).getAttribute("href")).toBe("/atlas/politica");
    expect(within(lista).queryByText("História")).toBeNull();
    const embreve = screen.getByRole("list", { name: "Em breve" });
    const historia = within(embreve).getByRole("heading", { name: "História" }).closest("li")!;
    expect(within(historia).queryByRole("link")).toBeNull();
    expect(within(embreve).getAllByRole("listitem")).toHaveLength(5);
    const continuar = screen.getByRole("link", { name: /Continuar de onde parei/ });
    expect(continuar.getAttribute("href")).toBe("/atlas/politica/m3e2");
    expect(continuar.textContent).toContain("Módulo 3, tema 2");
  });

  it("sem posição salva, sem o atalho", async () => {
    renderApp("/atlas");
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    expect(screen.queryByRole("link", { name: /Continuar de onde parei/ })).toBeNull();
  });
});

describe("capa (P02)", () => {
  it("abertura com {temas} preenchido, três passos e os oito módulos", async () => {
    renderApp("/atlas/politica");
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas de política, economia e marxismo" })).toBeTruthy();
    expect(screen.getByText(/^Oito módulos, 35 temas\./)).toBeTruthy();
    expect(screen.getByText("Leia a definição")).toBeTruthy();
    const modulos = screen.getByRole("region", { name: "Módulos" });
    expect(within(modulos).getByText("Ajuste fiscal no Brasil")).toBeTruthy();
    expect(within(modulos).getAllByRole("progressbar", { name: /^Módulo \d$/ })).toHaveLength(8);
  });

  it("sem violações sérias de acessibilidade", async () => {
    renderApp("/atlas/politica");
    await screen.findByRole("heading", { level: 1, name: "Atlas de política, economia e marxismo" });
    expect(await axeViolations()).toEqual([]);
  });
});

describe("menu, busca e progresso (P03–P05)", () => {
  it("contagem por módulo, item atual marcado e seletor de área", async () => {
    const marks = { "politica/m1e1:def": { done: true, at }, "politica/m1e1:vid": { done: true, at } };
    const { router, user } = renderApp("/atlas/politica/m1e2", { storage: memoryStorage({ "atlas-v3": estado({ marks, totals: { politica: 108 } }) }) });
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    expect(within(nav).getByLabelText(/^2 de \d+ marcos$/)).toBeTruthy();
    const atual = within(nav).getByRole("link", { current: "page" });
    expect(atual.textContent).toContain("Esquerda e direita");
    await user.selectOptions(within(nav).getByLabelText("Área"), "");
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas"));
  });

  it("busca filtra os temas da área e oferece buscar em todas, agrupando por área", async () => {
    const { user } = renderApp("/atlas/politica");
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    await user.type(within(nav).getByLabelText("Buscar"), "Gramsci");
    expect(within(nav).getByRole("link", { name: /Hegemonia e sociedade civil/ })).toBeTruthy();
    expect(within(nav).queryByRole("link", { name: /Esquerda e direita/ })).toBeNull();
    await user.click(within(nav).getByRole("button", { name: "Buscar “Gramsci” em todas as áreas" }));
    const grupo = await within(nav).findByRole("region", { name: "Resultados em Política, economia e marxismo" });
    expect(within(grupo).getByRole("link", { name: /Hegemonia e sociedade civil/ })).toBeTruthy();
  });

  it("progresso da área no topo acompanha as marcações", async () => {
    const marks = { "politica/m1e1:def": { done: true, at } };
    renderApp("/atlas/politica", { storage: memoryStorage({ "atlas-v3": estado({ marks }) }) });
    const pct = await screen.findByLabelText(/% da área concluída$/);
    expect(pct.textContent).toBe("1%");
  });
});

describe("área nova sem código (R07, RN09)", () => {
  it("manifesto e currículo novos bastam para a área aparecer e navegar", async () => {
    const files: Record<string, unknown> = { "content/areas.json": manifest(), "content/teste/curriculum.json": curriculum() };
    const fetchJSON: FetchJSON = async (url) => {
      if (!(url in files)) throw new Error("404 " + url);
      return structuredClone(files[url]);
    };
    const { user } = renderApp("/atlas", { fetchJSON });
    const areas = await screen.findByRole("list", { name: "Áreas" });
    await user.click(within(areas).getByRole("link", { name: /Área de teste/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas de teste" })).toBeTruthy();
    await user.click(within(screen.getByRole("region", { name: "Módulos" })).getByRole("link", { name: /Tema m1e2/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Tema m1e2" })).toBeTruthy();
    expect(screen.getByText("Sem livro aqui.")).toBeTruthy();
  });
});
