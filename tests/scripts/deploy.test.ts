// Configuração de deploy (Vercel com preset Vite) e regras de cache (KW1).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./helpers";

interface VercelHeader { source: string; headers: { key: string; value: string }[] }
interface Vercel { framework?: string; buildCommand?: string; outputDirectory?: string; rewrites?: { source: string; destination: string }[]; headers?: VercelHeader[] }

const read = (p: string) => readFileSync(join(REPO, p), "utf8");
const vercel = JSON.parse(read("vercel.json")) as Vercel;

// A Vercel aplica todas as regras que casam; a última define o valor.
function headerFor(path: string, key: string): string | undefined {
  let value: string | undefined;
  for (const rule of vercel.headers ?? []) {
    const re = new RegExp("^" + rule.source.replace(/\(\.\*\)/g, ".*") + "$");
    if (!re.test(path)) continue;
    for (const h of rule.headers) if (h.key.toLowerCase() === key.toLowerCase()) value = h.value;
  }
  return value;
}

describe("vercel.json", () => {
  it("preset Vite: build e saída em dist", () => {
    expect(vercel.framework).toBe("vite");
    expect(vercel.buildCommand).toBe("npm run build");
    expect(vercel.outputDirectory).toBe("dist");
  });

  it("rotas limpas caem no index.html; arquivos ausentes de assets, content e icons dão 404", () => {
    const rw = vercel.rewrites ?? [];
    expect(rw).toHaveLength(1);
    expect(rw[0]!.destination).toBe("/index.html");
    const re = new RegExp("^" + rw[0]!.source + "$");
    for (const p of ["/", "/atlas", "/atlas/politica/m1e1", "/entrar"]) expect(re.test(p), p).toBe(true);
    for (const p of ["/assets/index-velho.js", "/content/nada.json", "/icons/x.png"]) expect(re.test(p), p).toBe(false);
  });

  it("HTML e service worker sem cache; assets com hash imutáveis; conteúdo com cache curto", () => {
    for (const p of ["/", "/index.html", "/sw.js", "/atlas/politica/m1e1", "/manifest.webmanifest"]) {
      expect(headerFor(p, "Cache-Control"), p).toBe("no-cache");
    }
    expect(headerFor("/assets/index-abc123.js", "Cache-Control")).toBe("public, max-age=31536000, immutable");
    for (const p of ["/content/areas.json", "/content/politica/curriculum.json"]) {
      expect(headerFor(p, "Cache-Control"), p).toBe("private, no-store");
    }
    expect(headerFor("/qualquer", "X-Content-Type-Options")).toBe("nosniff");
  });
});

describe(".vercelignore", () => {
  const ig = read(".vercelignore").split(/\r?\n/).map(s => s.trim()).filter(l => l && !l.startsWith("#"));
  const has = (p: string) => ig.some(l => l.replace(/^\/|\/$/g, "") === p);

  it("deixa de fora o que não participa do build", () => {
    for (const p of ["exemplos", "tests", "e2e", "especificacoes", "supabase", "docs"]) expect(has(p), p).toBe(true);
  });

  it("não exclui nada de que o build precisa", () => {
    for (const p of ["index.html", "src", "public", "package.json", "package-lock.json", "vite.config.ts", "tsconfig.json"]) expect(has(p), p).toBe(false);
  });
});
