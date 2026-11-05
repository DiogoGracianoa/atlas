// Cenário D01 (RN02, AC02): aparelho com estado e fila do app antigo abre a
// nova versão sem perda; com sessão e rede, a fila é enviada e esvaziada.
import { describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { CONFIG, fakeSupabase } from "./fake-supabase";
import { memoryStorage, renderApp } from "./harness";

const at = "2026-11-04T21:00:00.000Z";
// Exatamente o formato que o app antigo grava (contrato K4).
const estadoAntigo = {
  v: 3,
  marks: { "politica/m1e1:def": { done: true, at }, "politica/m8e3:vid": { done: true, at } },
  notes: { "politica/m2e1": { body: "minha nota", at, base: null } },
  lastAt: { route: "politica/m3e2", at },
  resetAt: null,
  totals: { politica: 108 },
  size: "l",
  theme: "dark",
};
const filaAntiga = {
  "p|politica/m8e3|vid": { table: "progress", row: { area: "politica", item_id: "politica/m8e3", mark: "vid", done: true, updated_at: at } },
  "n|politica/m2e1": { table: "notes", row: { area: "politica", item_id: "politica/m2e1", body: "minha nota", updated_at: at } },
};

describe("atualização a partir do app antigo (D01)", () => {
  it("marcações, nota, continuar, tema e tamanho aparecem; a fila sobe e esvazia", async () => {
    const storage = memoryStorage({ "atlas-v3": JSON.stringify(estadoAntigo), "atlas-v3-queue": JSON.stringify(filaAntiga), "atlas-conta-vista": "1" });
    const fake = fakeSupabase({ session: { user: { id: "u1", email: "eu@exemplo.com" } } });
    const view = renderApp("/atlas", { storage, config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-size")).toBe("l");
    expect(screen.getByRole("link", { name: /Continuar de onde parei/ }).getAttribute("href")).toBe("/atlas/politica/m3e2");
    expect(view.services.store.isDone("politica/m1e1", "def")).toBe(true);
    expect(view.services.store.note("politica/m2e1")).toBe("minha nota");
    expect(view.services.sync.pending()).toBe(2);

    await act(async () => { await view.services.sync.init(); await view.services.sync.whenIdle(); });
    const ups = fake.calls.filter(c => c[0] === "upsert").map(c => (c[1] as { table: string }).table);
    expect(ups).toEqual(expect.arrayContaining(["progress", "notes"]));
    expect(view.services.sync.pending()).toBe(0);
    expect(JSON.parse(storage.getItem("atlas-v3-queue")!)).toEqual({});
  });

  it("só a chave v2 legada: marcação aparece e a v2 fica intacta (D02/AC03)", async () => {
    const v2 = JSON.stringify({ version: 2, done: { "m1e1:def": true }, notes: {} });
    const storage = memoryStorage({ "atlas-estudos-v2": v2 });
    const view = renderApp("/atlas/politica/m1e1", { storage });
    expect(await screen.findByRole("button", { name: "Definição lida" })).toBeTruthy();
    expect(view.services.store.isDone("politica/m1e1", "def")).toBe(true);
    expect(storage.getItem("atlas-estudos-v2")).toBe(v2);
  });
});
