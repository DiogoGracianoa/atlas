// Cenários A01–A08 (RN11, RN13, RN18) e P15: conta, login discreto e saída.
import { afterEach, describe, expect, it } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import { ACCOUNT_SEEN_KEY } from "../../src/app/account";
import { CONFIG, fakeSupabase } from "./fake-supabase";
import { memoryStorage, renderApp } from "./harness";

const seenStorage = () => memoryStorage({ [ACCOUNT_SEEN_KEY]: "1" });

async function boot(view: ReturnType<typeof renderApp>) {
  await act(async () => { await view.services.sync.init(); await view.services.sync.whenIdle(); });
}

afterEach(() => { window.history.replaceState(null, "", "/"); });

describe("visitante (A06, RN18)", () => {
  it("é redirecionado ao login sem receber o conteúdo", async () => {
    const fake = fakeSupabase();
    const view = renderApp("/atlas/politica", { config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    await screen.findByRole("heading", { level: 1, name: "Entrar" });
    expect(screen.queryByRole("button", { name: /Não sincronizado/ })).toBeNull();
    expect(document.querySelector('a[href="/entrar"]')).toBeNull();
    expect(view.router.state.location.pathname).toBe("/entrar");
    expect(screen.queryByText("Atlas de política, economia e marxismo")).toBeNull();
  });
});

describe("/entrar (A07, A03)", () => {
  it("e-mail → código errado → código certo: autentica, marca o aparelho e vai ao atlas", async () => {
    const fake = fakeSupabase();
    const view = renderApp("/entrar", { config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    const { user, router, storage } = view;
    await user.type(screen.getByLabelText("E-mail"), "Eu@Exemplo.com");
    await user.click(screen.getByRole("button", { name: "Enviar link e código" }));
    expect(fake.calls[0]).toEqual(["otp", { email: "eu@exemplo.com", options: { shouldCreateUser: false, emailRedirectTo: "http://localhost:3000/" } }]);
    await user.type(await screen.findByLabelText("Código de 6 dígitos"), "654321");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Código inválido ou expirado. Peça um novo.")).toBeTruthy();
    await user.clear(screen.getByLabelText("Código de 6 dígitos"));
    await user.type(screen.getByLabelText("Código de 6 dígitos"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas"));
    expect(storage.getItem(ACCOUNT_SEEN_KEY)).toBe("1");
    expect(await screen.findByRole("button", { name: /Sincroniza/ })).toBeTruthy();
    expect(await screen.findByText("Conectado como eu@exemplo.com.")).toBeTruthy();
  });
});

describe("autor com o aparelho marcado (A01, A02, A04, A08)", () => {
  it("marca de aparelho não autoriza acesso sem sessão", async () => {
    const fake = fakeSupabase();
    const view = renderApp("/atlas", { storage: seenStorage(), config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(view.router.state.location.pathname).toBe("/entrar");
  });

  it("sem sessão, pedir login usa a tela de entrada pública", async () => {
    window.history.replaceState(null, "", "/entrar");
    const fake = fakeSupabase();
    const view = renderApp("/atlas/politica/m2e1", { storage: seenStorage(), config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    await view.user.type(await screen.findByLabelText("E-mail"), "eu@exemplo.com");
    await view.user.click(screen.getByRole("button", { name: "Enviar link e código" }));
    expect(fake.calls[0]).toEqual(["otp", { email: "eu@exemplo.com", options: { shouldCreateUser: false, emailRedirectTo: "http://localhost:3000/entrar" } }]);
  });

  it("retorno pelo link remove ?code e mantém a página (A02)", async () => {
    window.history.replaceState(null, "", "/atlas/politica/m2e1?code=abc123");
    const fake = fakeSupabase({ session: { user: { id: "u1", email: "eu@exemplo.com" } } });
    const view = renderApp("/atlas/politica/m2e1", { config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    expect(window.location.pathname).toBe("/atlas/politica/m2e1");
    expect(window.location.search).toBe("");
    expect(view.storage.getItem(ACCOUNT_SEEN_KEY)).toBe("1");
  });

  it("sair mantém as marcações e volta a 'Não sincronizado' (A04, P15)", async () => {
    const fake = fakeSupabase({ session: { user: { id: "u1", email: "eu@exemplo.com" } } });
    const view = renderApp("/atlas/politica/m1e1", { storage: seenStorage(), config: CONFIG, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    const { user, services } = view;
    await user.click(await screen.findByRole("button", { name: "Marcar definição como lida" }));
    await user.click(await screen.findByRole("button", { name: /^Sincroniza/ }));
    const painel = screen.getByRole("dialog", { name: "Sincronização" });
    expect(within(painel).getByText("eu@exemplo.com")).toBeTruthy();
    await user.click(within(painel).getByRole("button", { name: "Sair deste aparelho" }));
    expect(fake.calls.at(-1)).toEqual(["signOut", { scope: "local" }]);
    expect(services.store.isDone("politica/m1e1", "def")).toBe(true);
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(await screen.findByText("Você saiu. O progresso continua neste aparelho.")).toBeTruthy();
  });
});

describe("sem configuração (A05, RN13)", () => {
  it("não carrega o cliente do Supabase", async () => {
    const fake = fakeSupabase();
    const view = renderApp("/atlas", { config: null, syncOptions: { loadSupabase: fake.loadSupabase } });
    await boot(view);
    expect(fake.loads()).toBe(0);
    expect(view.services.sync.state.reason).toBe("sem-config");
  });
});
