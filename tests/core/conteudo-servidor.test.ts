// S05–S07, S12, S17: a decisão de entrega pertence ao servidor.
import { describe, expect, it } from "vitest";
import { serveContent } from "../../server/conteudo";

const config = { url: "https://auth.test", anonKey: "public-key" };
const user = { id: "user-1", aud: "authenticated", role: "authenticated", is_anonymous: false };
const authFetch: typeof fetch = async (_url, init) => {
  const headers = new Headers(init?.headers);
  if (headers.get("authorization") !== "Bearer accepted-token") return Response.json({ message: "Invalid JWT" }, { status: 401 });
  return Response.json(user);
};
const request = (file = "content/areas.json", token = "accepted-token", method = "GET") =>
  new Request("https://atlas.test/api/conteudo?arquivo=" + encodeURIComponent(file), {
    method, headers: { Authorization: "Bearer " + token },
  });

describe("entrega privada de conteúdo", () => {
  it("recusa download sem sessão, sem cache e sem material", async () => {
    const response = await serveContent(new Request("https://atlas.test/api/conteudo?arquivo=content/areas.json"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).not.toContain('"areas"');
  });

  it("entrega o manifesto somente após validação no Auth, sem cache", async () => {
    const response = await serveContent(request(), { config, authFetch });
    expect(response.status).toBe(200);
    expect((await response.json()).areas[0].slug).toBe("politica");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("cdn-cache-control")).toBe("no-store");
  });

  it.each(["forged-token", "expired-token", "public-key"])("recusa %s", async token => {
    const response = await serveContent(request("content/areas.json", token), { config, authFetch });
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain('"areas"');
  });

  it("recusa usuário anônimo do provedor", async () => {
    const response = await serveContent(request(), { config, authFetch: async () => Response.json({ ...user, is_anonymous: true }) });
    expect(response.status).toBe(401);
  });

  it.each(["../package.json", "content/../package.json", "/etc/passwd", "content/politica/../../package.json", "content/nada/curriculum.json"])("não entrega caminho não permitido: %s", async file => {
    const response = await serveContent(request(file), { config, authFetch });
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('"scripts"');
  });

  it("não aceita query duplicada nem método de escrita", async () => {
    const repeated = new Request(request().url + "&arquivo=content/areas.json", { headers: { Authorization: "Bearer accepted-token" } });
    expect((await serveContent(repeated, { config, authFetch })).status).toBe(404);
    const response = await serveContent(request("content/areas.json", "accepted-token", "POST"), { config, authFetch });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });

  it("sem configuração ou com Auth indisponível nega entrega com 503", async () => {
    expect((await serveContent(request(), { config: null })).status).toBe(503);
    const response = await serveContent(request(), { config, authFetch: async () => Response.json({ message: "internal details" }, { status: 503 }) });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("internal details");
  });
});

describe("arquivos de concurso (preparatório, K-C1)", () => {
  async function raiz(): Promise<string> {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const root = mkdtempSync(join(tmpdir(), "atlas-srv-"));
    const put = (rel: string, body: unknown) => { const p = join(root, "private", rel); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, JSON.stringify(body)); };
    put("content/areas.json", { areas: [{ slug: "concursos", status: "disponivel", subtemas: [{ slug: "teste-2027", tipo: "concurso", status: "disponivel", arquivo: "content/teste-2027/concurso.json" }] }, { slug: "politica", status: "disponivel", arquivo: "content/politica/curriculum.json" }] });
    put("content/teste-2027/concurso.json", { ok: "concurso" });
    put("content/teste-2027/teoria/lp.json", { ok: "teoria" });
    put("content/teste-2027/questoes/lp.json", [{ ok: "questoes" }]);
    put("content/teste-2027/discursiva.json", [{ ok: "discursiva" }]);
    put("content/politica/teoria/lp.json", { vazou: true });
    return root;
  }

  it.each([
    ["content/teste-2027/concurso.json", "concurso"],
    ["content/teste-2027/teoria/lp.json", "teoria"],
    ["content/teste-2027/questoes/lp.json", "questoes"],
    ["content/teste-2027/discursiva.json", "discursiva"],
  ])("entrega %s de um concurso do manifesto", async (file, marca) => {
    const response = await serveContent(request(file), { config, authFetch, root: await raiz() });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(marca);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it.each(["content/politica/teoria/lp.json", "content/teste-2027/teoria/../../politica/curriculum.json", "content/teste-2027/outro.json", "content/teste-2027/teoria/LP.json"])("não entrega %s", async file => {
    const response = await serveContent(request(file), { config, authFetch, root: await raiz() });
    expect(response.status).toBe(404);
  });

  it("concurso sem sessão não é entregue", async () => {
    const response = await serveContent(request("content/teste-2027/questoes/lp.json", "forged-token"), { config, authFetch, root: await raiz() });
    expect(response.status).toBe(401);
  });
});
