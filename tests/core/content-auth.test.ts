import { describe, expect, it } from "vitest";
import { createAuthenticatedFetch } from "../../src/core/content-auth";
import { createServices } from "../../src/app/services";
import { CONFIG, fakeSupabase } from "../ui/fake-supabase";
import { manifest } from "./helpers";

function storage() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; }
async function setup(fetchJSON?: (url: string) => Promise<unknown>) {
  const fake = fakeSupabase({ session: { access_token: "user-token", user: { id: "u1" } } });
  const services = createServices({ storage: storage(), config: CONFIG, fetchJSON, syncOptions: { loadSupabase: fake.loadSupabase, win: undefined } });
  await services.sync.init();
  return { ...services, fake };
}

describe("conteúdo autenticado e ciclo de sessão (S04, S06, S14, S16)", () => {
  it("envia token no cabeçalho, URL de API e proíbe armazenamento HTTP", async () => {
    const { sync } = await setup();
    const fetchJSON = createAuthenticatedFetch(sync, async (url, init) => {
      expect(String(url)).toBe("/api/conteudo?arquivo=content%2Fareas.json");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer user-token");
      expect(init?.cache).toBe("no-store");
      return Response.json({ areas: [{ slug: "teste" }] });
    });
    expect(await fetchJSON("content/areas.json")).toEqual({ areas: [{ slug: "teste" }] });
  });

  it("401 bloqueia sessão; 503 indica indisponibilidade sem encerrá-la", async () => {
    const { sync } = await setup();
    const unavailable = createAuthenticatedFetch(sync, async () => new Response(null, { status: 503 }));
    await expect(unavailable("content/areas.json")).rejects.toThrow(/indisponível/);
    expect(sync.state.user?.id).toBe("u1");
    const denied = createAuthenticatedFetch(sync, async () => new Response(null, { status: 401 }));
    await expect(denied("content/areas.json")).rejects.toThrow(/entrar|sessão/i);
    expect(sync.state.user).toBeNull();
  });

  it("sair limpa o conteúdo em memória sem apagar a marcação", async () => {
    const { content, sync, store } = await setup(async () => manifest());
    await content.loadManifest();
    store.setMark("teste/m1e1", "def", true);
    expect(content.areas()).toHaveLength(2);
    await sync.signOut();
    expect(content.areas()).toEqual([]);
    expect(store.isDone("teste/m1e1", "def")).toBe(true);
  });

  it("resposta de manifesto depois da saída não repopula a memória", async () => {
    let finish!: (data: unknown) => void;
    const pending = new Promise<unknown>(r => { finish = r; });
    const { content, sync } = await setup(async () => pending);
    const loading = content.loadManifest();
    await sync.signOut();
    finish(manifest());
    await expect(loading).rejects.toThrow(/sessão/i);
    expect(content.areas()).toEqual([]);
  });

  it("credencial rejeitada é removida do SDK e evento automático não reabre acesso", async () => {
    const { sync, fake } = await setup();
    sync.rejectSession();
    expect((await fake.client.auth.getSession()).data?.session).toBeNull();
    fake.emit("SIGNED_IN", { access_token: "user-token", user: { id: "u1" } });
    expect(sync.state.user).toBeNull();
    const result = await sync.verifyCode("eu@exemplo.com", "123456");
    expect(result.ok).toBe(true);
    expect(sync.state.user?.id).toBe("u1");
  });
});
