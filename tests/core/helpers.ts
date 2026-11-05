// Fixtures de conteúdo para os testes do núcleo (portadas de tests/app/helpers.mjs).
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Curriculum, Manifest, Step } from "../../src/core/types";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function step(id: string, extra: Partial<Step> = {}): Step {
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

export function curriculum(): Curriculum {
  return {
    modules: [{
      id: "m1", number: 1, name: "Módulo", subtitle: "Sub", level: "Iniciante", overview: "Visão.",
      goals: ["Meta."],
      workshop: { id: "m1of", title: "Oficina", brief: "Breve.", exercise: "Exercício.", deliverable: "Entrega." },
      steps: [step("m1e1"), step("m1e2", { book: null, bridge: "Sem livro aqui." })]
    }]
  };
}

export function manifest(): Manifest {
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

