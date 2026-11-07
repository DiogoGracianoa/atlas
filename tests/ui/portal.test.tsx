// Cenários R05 (RN07, AC10) e R02 (rota desconhecida).
import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { axeViolations, memoryStorage, renderApp } from "./harness";

describe("portal", () => {
  it("lista só as seções que existem: Atlas com link; Dossiês (planejada) não aparece", async () => {
    renderApp("/");
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas" })).toBeTruthy();
    const lista = screen.getByRole("list", { name: "Seções" });
    const atlas = within(lista).getByRole("link", { name: /Atlas de estudos/ });
    expect(atlas.getAttribute("href")).toBe("/atlas");
    expect(screen.queryByText("Dossiês")).toBeNull();
    expect(screen.queryByText(/em breve/i)).toBeNull();
  });

  it("cartão do Atlas mostra progresso quando há total conhecido", async () => {
    const at = "2026-11-05T10:00:00.000Z";
    const estado = { v: 3, marks: { "politica/m1e1:def": { done: true, at } }, notes: {}, lastAt: null, resetAt: null, totals: { politica: 4 }, size: "m", theme: "auto" };
    renderApp("/", { storage: memoryStorage({ "atlas-v3": JSON.stringify(estado) }) });
    const bar = await screen.findByRole("progressbar", { name: "Progresso no atlas" });
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
