// Cenários R05 (RN07, AC10) e R02 (rota desconhecida).
import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { axeViolations, memoryStorage, renderApp } from "./harness";

describe("portal", () => {
  it("lista as seções: Atlas com link e progresso; Dossiês em breve, sem link", async () => {
    renderApp("/");
    expect(screen.getByRole("heading", { level: 1, name: "Atlas" })).toBeTruthy();
    const lista = screen.getByRole("list", { name: "Seções" });
    const atlas = within(lista).getByRole("link", { name: /Atlas de estudos/ });
    expect(atlas.getAttribute("href")).toBe("/atlas");
    const dossies = within(lista).getByRole("heading", { name: "Dossiês" }).closest("li")!;
    expect(within(dossies).queryByRole("link")).toBeNull();
    expect(within(dossies).getByText("Em breve")).toBeTruthy();
  });

  it("cartão do Atlas mostra progresso quando há total conhecido", () => {
    const at = "2026-11-05T10:00:00.000Z";
    const estado = { v: 3, marks: { "politica/m1e1:def": { done: true, at } }, notes: {}, lastAt: null, resetAt: null, totals: { politica: 4 }, size: "m", theme: "auto" };
    renderApp("/", { storage: memoryStorage({ "atlas-v3": JSON.stringify(estado) }) });
    const bar = screen.getByRole("progressbar", { name: "Progresso no atlas" });
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuemax")).toBe("4");
  });

  it("rota desconhecida volta ao portal com aviso", async () => {
    const { router } = renderApp("/xyz");
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(await screen.findByText("Página não encontrada.")).toBeTruthy();
  });

  it("não tem violações de acessibilidade sérias", async () => {
    renderApp("/");
    expect(await axeViolations()).toEqual([]);
  });
});
