import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { diskFetch, renderApp } from "./harness";
import { CONFIG, fakeSupabase } from "./fake-supabase";

describe("acesso obrigatório (S01–S04, S12–S15)", () => {
  it.each(["/", "/atlas", "/atlas/politica/m1e1", "/atlas/tecnologia/arquitetura-lideranca-tecnica"])("sem sessão, %s leva ao login sem buscar material", async path => {
    const fake = fakeSupabase();
    const calls: string[] = [];
    const view = renderApp(path, { config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase }, fetchJSON: async url => { calls.push(url); return { areas: [] }; } });
    await act(async () => { await view.services.sync.init(); });
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/entrar"));
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /ajustes/i })).toBeNull();
    expect(calls).toEqual([]);
  });

  it("não exibe conteúdo enquanto restaura a sessão", async () => {
    let finish!: () => void;
    const pending = new Promise<void>(r => { finish = r; });
    const fake = fakeSupabase({ session: { user: { id: "u1" } } });
    const view = renderApp("/atlas", { config: CONFIG, syncOptions: { loadSupabase: async () => { await pending; return fake.loadSupabase(); } } });
    expect(screen.getByText("Verificando sessão…").getAttribute("role")).toBe("status");
    expect(screen.queryByRole("heading")).toBeNull();
    expect(view.router.state.location.pathname).toBe("/atlas");
    await act(async () => { finish(); await view.services.sync.init(); });
    expect(await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" })).toBeTruthy();
  });

  it("sem configuração apresenta login e aviso, nunca o portal local", async () => {
    const view = renderApp("/", { config: null });
    await act(async () => { await view.services.sync.init(); });
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/entrar"));
    expect(await screen.findByText(/não foi configurada/i)).toBeTruthy();
  });

  it("offline deixa de expor o conteúdo mesmo já carregado na memória", async () => {
    const fake = fakeSupabase({ session: { user: { id: "u1" } } });
    const view = renderApp("/atlas", { config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await screen.findByRole("heading", { name: "Mapa do Atlas" });
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      act(() => { window.dispatchEvent(new Event("offline")); });
      expect(screen.queryByRole("heading", { name: "Mapa do Atlas" })).toBeNull();
      expect(screen.getByText(/conexão para acessar/i)).toBeTruthy();
    } finally { online.mockRestore(); }
    await act(async () => { await view.services.sync.whenIdle(); });
  });

  it("troca direta de conta desmonta o material anterior e carrega sob a nova sessão", async () => {
    let switched = false;
    let finish!: () => void;
    const pending = new Promise<void>(r => { finish = r; });
    const calls: string[] = [];
    const fake = fakeSupabase({ session: { user: { id: "A" } } });
    renderApp("/atlas/politica/m1e1", {
      config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase },
      fetchJSON: async url => { calls.push(url); if (switched) await pending; return diskFetch(url); },
    });
    await screen.findByRole("heading", { name: "Poder, Estado e governo" });
    switched = true;
    act(() => { fake.emit("SIGNED_IN", { user: { id: "B" } }); });
    expect(screen.queryByRole("heading", { name: "Poder, Estado e governo" })).toBeNull();
    await act(async () => { finish(); });
    await screen.findByRole("heading", { name: "Poder, Estado e governo" });
    expect(calls.filter(url => url === "content/areas.json")).toHaveLength(2);
  });
});
