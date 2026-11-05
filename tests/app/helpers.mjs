// Utilitários de teste: monta um Atlas mínimo (manifesto + currículo) num
// diretório temporário, a partir de objetos que cada teste pode alterar.
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function step(id, extra = {}) {
  return {
    id,
    title: "Tema " + id,
    tagline: "Linha " + id,
    tradition: "geral",
    effort: "1 h",
    definition: ["Parágrafo único de " + id + "."],
    concepts: [{ t: "Conceito", d: "Descrição." }],
    theses: ["Tese."],
    debate: ["Crítica."],
    videos: [{ title: "Vídeo", source: "Canal", url: "https://example.org/v", focus: "Foco." }],
    book: { title: "Livro", author: "Autora", url: "https://example.org/b", label: "Ver", level: "Introdutório", focus: "Ler." },
    check: ["Pergunta?"],
    ...extra
  };
}

export function curriculum() {
  return {
    modules: [{
      id: "m1", number: 1, name: "Módulo", subtitle: "Sub", level: "Iniciante", overview: "Visão.",
      goals: ["Meta."],
      workshop: { id: "m1of", title: "Oficina", brief: "Breve.", exercise: "Exercício.", deliverable: "Entrega." },
      steps: [step("m1e1"), step("m1e2", { book: null, bridge: "Sem livro aqui." })]
    }]
  };
}

export function manifest() {
  return {
    areas: [
      {
        slug: "teste", nome: "Área de teste", resumo: "Resumo.", status: "disponivel",
        arquivo: "content/teste/curriculum.json",
        titulo: "Atlas de teste", subtitulo: "Trilha de teste", tituloPdf: "Atlas · Teste",
        capa: { rotulo: "TRILHA", lead: "{modulos} módulo, {temas} temas.", passos: [{ t: "Leia", d: "Leia." }] },
        tradicoes: { geral: { nome: "Geral", cor: "#123456", corEscura: "#ABCDEF" } },
        promptBase: "Você é meu tutor.\n\n"
      },
      { slug: "futura", nome: "Futura", status: "planejado" }
    ]
  };
}

// Escreve um Atlas em diretório temporário. `files` permite sobrescrever ou
// omitir arquivos (valor null = não escrever).
export function writeAtlas({ man = manifest(), cur = curriculum(), files = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "atlas-"));
  const all = {
    "content/areas.json": JSON.stringify(man, null, 2),
    "content/teste/curriculum.json": JSON.stringify(cur),
    ...files
  };
  for (const [rel, body] of Object.entries(all)) {
    if (body === null) continue;
    // Conteúdo fica em public/ (servido em /content/...); o resto, na raiz.
    const p = join(root, rel.startsWith("content/") ? join("public", rel) : rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  return root;
}

export function runValidate(root) {
  const r = spawnSync(process.execPath, [join(REPO, "scripts", "validate.mjs"), "--root", root], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
