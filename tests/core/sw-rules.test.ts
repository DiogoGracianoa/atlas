// Cenário O04 e contrato KW1: o que o service worker guarda e o que nunca guarda.
import { describe, expect, it } from "vitest";
import { cacheRule, OLD_CACHES } from "../../src/sw-rules";

const origin = "https://atlas.example.app";
const rule = (url: string, mode: RequestMode = "cors") => cacheRule(new URL(url), mode, origin);

describe("regras de cache (KW1)", () => {
  it("navegação do app usa o index.html do precache", () => {
    expect(rule(origin + "/atlas/politica/m1e1", "navigate")).toBe("app-shell");
    expect(rule(origin + "/", "navigate")).toBe("app-shell");
  });

  it("conteúdo: rede primeiro, com cache de reserva", () => {
    expect(rule(origin + "/content/areas.json")).toBe("conteudo");
    expect(rule(origin + "/content/politica/curriculum.json")).toBe("conteudo");
  });

  it("Supabase e qualquer outro domínio nunca vão para o cache", () => {
    expect(rule("https://proj.supabase.co/rest/v1/progress?select=*")).toBe("rede");
    expect(rule("https://proj.supabase.co/auth/v1/token", "navigate")).toBe("rede");
    expect(rule("https://chatgpt.com/", "navigate")).toBe("rede");
  });

  it("arquivos do build ficam com o precache (não há regra própria)", () => {
    expect(rule(origin + "/assets/index-abc123.js")).toBe("precache");
  });

  it("o cache do service worker antigo é apagado", () => {
    expect(OLD_CACHES).toContain("atlas-v1");
  });
});
