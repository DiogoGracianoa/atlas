// Cenários P11 (backup), P12 (Zerar), P13 (PDF), P14 (ajustes) e P16 (avisos).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { memoryStorage, renderApp } from "./harness";

const at = "2026-11-05T10:00:00.000Z";
const estado = (extra: object = {}) => JSON.stringify({ v: 3, marks: {}, notes: {}, lastAt: null, resetAt: null, totals: {}, size: "m", theme: "auto", ...extra });
const ferramentas = () => screen.getAllByText("Seu progresso")[0]!.parentElement!;

describe("ajustes de leitura (P14)", () => {
  it("tema e tamanho mudam o documento e ficam só neste aparelho", async () => {
    const { user, storage } = renderApp("/");
    await user.click(await screen.findByRole("button", { name: "Ajustes de leitura" }));
    const painel = screen.getByRole("dialog", { name: "Ajustes de leitura" });
    await user.click(within(painel).getByRole("button", { name: "Escuro" }));
    await user.click(within(painel).getByRole("button", { name: "Texto muito grande" }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-size")).toBe("xl");
    const salvo = JSON.parse(storage.getItem("atlas-v3")!);
    expect([salvo.theme, salvo.size]).toEqual(["dark", "xl"]);
    expect(Object.keys(JSON.parse(storage.getItem("atlas-v3-queue") ?? "{}"))).toHaveLength(0);
    await user.click(within(painel).getByRole("button", { name: "Auto" }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("backup (P11)", () => {
  let blobs: Blob[] = [];
  beforeEach(() => {
    blobs = [];
    URL.createObjectURL = vi.fn((b: Blob) => { blobs.push(b); return "blob:atlas"; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it("exportar gera o backup v4 (KB4) com todas as áreas e os registros do preparatório", async () => {
    const marks = { "politica/m1e1:def": { done: true, at } };
    const { user } = renderApp("/atlas", { storage: memoryStorage({ "atlas-v3": estado({ marks }) }) });
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    await user.click(within(ferramentas()).getByRole("button", { name: "Exportar" }));
    const out = JSON.parse(await blobs[0]!.text());
    expect(out.version).toBe(4);
    expect(out.registros).toEqual({});
    expect(out.marks["politica/m1e1:def"]).toEqual({ done: true, at });
    expect(await screen.findByText("Backup exportado.")).toBeTruthy();
  });

  it("importar v2 pede confirmação e mescla", async () => {
    const { user, services } = renderApp("/atlas");
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    const arquivo = new File([JSON.stringify({ version: 2, done: { "m1e2:def": true }, notes: { m1e2: "do backup" } })], "backup.json", { type: "application/json" });
    fireEvent.change(within(ferramentas()).getByLabelText("Arquivo de backup"), { target: { files: [arquivo] } });
    const dialogo = await screen.findByRole("dialog", { name: "Importar backup" });
    await user.click(within(dialogo).getByRole("button", { name: "Mesclar" }));
    expect(services.store.isDone("politica/m1e2", "def")).toBe(true);
    expect(services.store.note("politica/m1e2")).toBe("do backup");
    expect(await screen.findByText("Progresso importado (2 alterações).")).toBeTruthy();
  });

  it("arquivo inválido avisa e não muda nada", async () => {
    const { services } = renderApp("/atlas");
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    fireEvent.change(within(ferramentas()).getByLabelText("Arquivo de backup"), { target: { files: [new File(["{x"], "x.json")] } });
    expect(await screen.findByText("Não foi possível ler esse arquivo. Selecione um backup exportado pelo Letrume.")).toBeTruthy();
    expect(Object.keys(services.store.state.marks)).toEqual([]);
  });
});

describe("zerar (P12)", () => {
  it("pede confirmação, desmarca tudo com marca de corte e volta ao mapa", async () => {
    const marks = { "politica/m1e1:def": { done: true, at } };
    const { user, services, router } = renderApp("/atlas/politica/m1e1", { storage: memoryStorage({ "atlas-v3": estado({ marks }) }) });
    await screen.findByRole("heading", { level: 1 });
    await user.click(within(ferramentas()).getByRole("button", { name: "Zerar" }));
    const dialogo = screen.getByRole("dialog", { name: "Zerar o progresso" });
    expect(dialogo.textContent).toContain("Apagar todas as marcações e anotações");
    await user.click(within(dialogo).getByRole("button", { name: "Zerar" }));
    expect(services.store.isDone("politica/m1e1", "def")).toBe(false);
    expect(services.store.state.resetAt).toBeTruthy();
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas"));
    expect(await screen.findByText("Progresso zerado.")).toBeTruthy();
  });

  it("cancelar não muda nada", async () => {
    const marks = { "politica/m1e1:def": { done: true, at } };
    const { user, services } = renderApp("/atlas", { storage: memoryStorage({ "atlas-v3": estado({ marks }) }) });
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    await user.click(within(ferramentas()).getByRole("button", { name: "Zerar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(services.store.isDone("politica/m1e1", "def")).toBe(true);
  });
});

describe("PDF (P13, RN14)", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("gera o roteiro com todos os módulos, temas e oficinas e chama a impressão", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const { user } = renderApp("/atlas/politica");
    await screen.findByRole("heading", { level: 1, name: "Atlas de política, economia e marxismo" });
    await user.click(within(ferramentas()).getByRole("button", { name: "Salvar em PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
    const roteiro = screen.getByTestId("roteiro-impresso");
    expect(within(roteiro).getAllByRole("heading", { level: 2 })).toHaveLength(8);
    expect(within(roteiro).getAllByRole("heading", { level: 3 })).toHaveLength(35 + 8);
    expect(within(roteiro).getByRole("heading", { level: 2, name: "Módulo 8 · Ajuste fiscal no Brasil" })).toBeTruthy();
    fireEvent(window, new Event("afterprint"));
    await waitFor(() => expect(screen.queryByTestId("roteiro-impresso")).toBeNull());
  });

  it("no mapa (sem área aberta) o botão fica desativado", async () => {
    renderApp("/atlas");
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    expect((within(ferramentas()).getByRole("button", { name: "Salvar em PDF" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
