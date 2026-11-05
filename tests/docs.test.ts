// Cenários Q04 e Q05 (RN15, AC19): documentação de portfólio completa e
// coerente com o repositório.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const REPO = process.cwd();
const read = (p: string) => readFileSync(join(REPO, p), "utf8");
const readme = read("README.md");
const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
const docs = ["README.md", "docs/arquitetura.md", "docs/sincronizacao.md", "docs/conteudo.md", "docs/deploy.md"];
const adrs = readdirSync(join(REPO, "docs/adr")).filter(f => /^\d{4}-.+\.md$/.test(f));

describe("README em inglês (RN15)", () => {
  it.each([
    "## Overview and motivation", "## Screenshots", "## Features", "## Architecture",
    "## Offline-first sync", "## Testing strategy", "## Tech stack", "## Running locally",
    "## Deployment", "## Project structure", "## Decisions", "## Roadmap", "## License",
  ])("tem a seção %s", (h) => {
    expect(readme).toContain(h);
  });

  it("aponta a demo e a licença MIT", () => {
    expect(readme).toMatch(/\*\*Live demo:\*\*/);
    expect(readme).toContain("[MIT](LICENSE)");
    const lic = read("LICENSE");
    expect(lic.startsWith("MIT License")).toBe(true);
    expect(lic).toMatch(/Copyright \(c\) 2026 \S+/);
  });

  it("tem diagramas de arquitetura e de sincronização", () => {
    expect((readme.match(/```mermaid/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("as capturas de tela existem", () => {
    for (const m of readme.matchAll(/!\[[^\]]+\]\(([^)]+)\)/g)) expect(existsSync(join(REPO, m[1]!)), m[1]).toBe(true);
  });
});

describe("docs/ em português", () => {
  it("existem os quatro documentos e todos os ADRs da tabela", () => {
    for (const d of docs) expect(existsSync(join(REPO, d)), d).toBe(true);
    expect(adrs.length).toBeGreaterThanOrEqual(11);
  });

  it.each(adrs)("ADR %s tem contexto, alternativas, decisão, consequências e gatilho", (f) => {
    const md = read("docs/adr/" + f);
    for (const h of ["## Contexto", "## Alternativas", "## Decisão", "## Consequências", "## Gatilho de revisão"]) expect(md, h).toContain(h);
  });

  it("todo `npm run X` citado existe em package.json", () => {
    const faltando: string[] = [];
    for (const d of docs) {
      for (const m of read(d).matchAll(/npm run ([a-z][\w:-]*)/g)) if (!(m[1]! in pkg.scripts)) faltando.push(`${d}: npm run ${m[1]}`);
    }
    expect(faltando).toEqual([]);
  });

  it("links relativos apontam para arquivos que existem", () => {
    const quebrados: string[] = [];
    for (const d of [...docs, ...adrs.map(f => "docs/adr/" + f), "docs/adr/README.md"]) {
      for (const m of read(d).matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
        const alvo = m[1]!;
        if (/^(https?:|mailto:)/.test(alvo)) continue;
        if (!existsSync(resolve(dirname(join(REPO, d)), alvo))) quebrados.push(`${d} → ${alvo}`);
      }
    }
    expect(quebrados).toEqual([]);
  });
});

describe("docs/conteudo.md (guia de conteúdo)", () => {
  const md = read("docs/conteudo.md");
  const man = JSON.parse(read("public/content/areas.json")) as { areas: { slug: string; status: string }[] };

  it("tabela de áreas cobre o manifesto, com o status certo", () => {
    for (const a of man.areas) {
      const row = md.split("\n").find(l => l.startsWith("|") && l.includes("`" + a.slug + "`"));
      expect(row, a.slug).toBeTruthy();
      expect(row).toContain(a.status === "disponivel" ? "disponível" : "planejada");
    }
  });

  it("passos de área nova são exatamente cinco", () => {
    const sec = md.split("## Como acrescentar uma área nova")[1]!.split("\n## ")[0]!;
    expect(sec.split("\n").filter(l => /^\d+\. /.test(l))).toHaveLength(5);
  });

  it("o exemplo mínimo de currículo é JSON válido com os campos obrigatórios", () => {
    const sec = md.split("## Formato do `curriculum.json`")[1]!.split("\n## ")[0]!;
    const cur = JSON.parse(sec.split("```json")[1]!.split("```")[0]!) as { modules: { workshop: { id: string }; steps: Record<string, unknown>[] }[] };
    const s = cur.modules[0]!.steps[0]!;
    for (const f of ["id", "title", "tagline", "tradition", "definition", "concepts", "theses", "check"]) expect(s[f], f).toBeTruthy();
    expect(cur.modules[0]!.workshop.id).toBeTruthy();
  });
});
