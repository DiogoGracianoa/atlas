// Fixture de um concurso mínimo (contrato K-C1) para validador, núcleo e telas.
// Duas disciplinas, duas semanas, um tópico publicado com teoria e 8 questões.
import type { Concurso, Questao, Teoria } from "../../src/core/concurso/tipos";

export function concurso(): Concurso {
  return {
    concurso: { nome: "Concurso de teste", orgao: "Prefeitura de Teste", edital: "Edital 01/2026", banca: "Banca X", cargo: { codigo: "501", nome: "Analista" } },
    fontes: [
      { id: "anexo4", documento: "Anexo IV – Conteúdos", versao: "Retificação nº 02", data: "2026-11-09", url: "https://example.org/anexo4.pdf" },
      { id: "anexo3", documento: "Anexo III – Quadro de Provas", versao: "Retificação nº 01", data: "2026-10-14", url: "https://example.org/anexo3.pdf" },
      { id: "edital", documento: "Edital consolidado", versao: "até a Retificação nº 02", data: "2026-11-09", url: "https://example.org/edital.pdf" },
    ],
    prova: {
      data: "2027-01-24", fuso: "America/Sao_Paulo", turno: "tarde, 14h45 às 18h45",
      fonte: { ref: "edital", item: "9.2.1" },
      objetiva: {
        questoes: 6, alternativas: 4, minimo: 60, duracaoMin: 240, fonte: { ref: "anexo3", pagina: 2 },
        disciplinas: [{ id: "lp", questoes: 2, peso: 2 }, { id: "ce", questoes: 4, peso: 3 }],
      },
      discursiva: {
        questoes: 2, pontos: 15, linhas: 10, minimoPct: 60, fonte: { ref: "edital", item: "9.4" },
        criterios: [{ id: "cp", nome: "Conteúdo", max: 6 }, { id: "pr", nome: "Pertinência", max: 3 }, { id: "cl", nome: "Língua", max: 1.5 }, { id: "el", nome: "Estrutura", max: 3 }, { id: "ec", nome: "Expressão", max: 1.5 }],
      },
    },
    disciplinas: [
      { id: "lp", nome: "Língua Portuguesa", sigla: "LP", modulos: [{ id: "lp-m1", nome: "Gramática", topicos: [
        { id: "lp-crase", titulo: "Crase", subtopicos: ["Emprego do acento grave"], fonte: { ref: "anexo4", pagina: 4, trecho: "Emprego do sinal indicativo da crase" }, validacao: "verificado", publicado: true },
        { id: "lp-regencia", titulo: "Regência", subtopicos: ["Verbal", "Nominal"], fonte: { ref: "anexo4", pagina: 4, trecho: "Regência verbal e nominal" }, validacao: "verificado" },
      ] }] },
      { id: "ce", nome: "Conhecimentos Específicos", sigla: "CE", modulos: [{ id: "ce-m1", nome: "Redes", topicos: [
        { id: "ce-ip", titulo: "Endereçamento IP", subtopicos: ["Máscaras", "Sub-redes"], fonte: { ref: "anexo4", pagina: 5, trecho: "Endereçamento: IP, máscaras e sub-rede" }, validacao: "verificado" },
        { id: "ce-pccs", titulo: "Lei 105/2011", subtopicos: [], fonte: { ref: "anexo4", pagina: 4, trecho: "Lei Municipal nº 105/2011" }, validacao: "pendente", nota: "Conferir a espécie normativa." },
        { id: "ce-extra", titulo: "Reforço opcional", subtopicos: [], opcional: true },
      ] }] },
    ],
    trilha: {
      inicio: "2026-11-16", fim: "2026-11-29", horasSemana: 10,
      semanas: [
        { n: 1, inicio: "2026-11-16", fim: "2026-11-22", titulo: "Fundamentos", topicos: ["lp-crase", "ce-ip"], meta: "60 questões" },
        { n: 2, inicio: "2026-11-23", fim: "2026-11-29", titulo: "Consolidação", topicos: ["lp-regencia", "ce-pccs", "ce-extra"], meta: "80 questões" },
      ],
    },
    rotina: {
      seg: { foco: ["lp"], horas: 1 }, ter: { foco: ["lp"], horas: 1 }, qua: { foco: ["ce"], horas: 1.5 }, qui: { foco: ["ce"], horas: 1 },
      sex: { foco: ["ce", "exercicios"], horas: 1.5 }, sab: { foco: ["revisao", "questoes", "simulado"], horas: 3 }, dom: { foco: ["erros", "revisao"], horas: 1 },
    },
    revisao: { dias: [1, 7, 21] },
    atividades: { exercicios: "Exercícios", revisao: "Revisão", questoes: "Questões", simulado: "Simulado", erros: "Correção de erros" },
  };
}

export function teoria(): Record<string, Teoria> {
  return {
    "lp-crase": {
      objetivos: ["Saber quando usar o acento grave."],
      explicacao: ["Crase é a fusão da preposição a com o artigo a."],
      exemplos: [{ enunciado: "Vou ___ escola.", resolucao: "à: ir a + a escola." }],
      conceitos: [{ t: "Crase", d: "Fusão de a + a." }],
      dominio: ["Acertar 8 de 10 questões."],
    },
  };
}

export function questoes(topico = "lp-crase", n = 8): Questao[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${topico}-q${i + 1}`, topico, enunciado: `Questão ${i + 1} de ${topico}?`,
    alternativas: ["A", "B", "C", "D"], gabarito: 2, comentario: "Porque C.", origem: "autoral" as const,
  }));
}

/** Entrada do manifesto: agrupador "Concursos" com o subtema do concurso. */
export function manifestoConcursos(slug = "teste-2027") {
  return {
    slug: "concursos", nome: "Concursos", resumo: "Preparatórios.", status: "disponivel",
    subtemas: [{
      slug, nome: "Concurso de teste", resumo: "Cargo 501.", status: "disponivel", tipo: "concurso",
      arquivo: `content/${slug}/concurso.json`, titulo: "Preparatório de teste", subtitulo: "Analista", tituloPdf: "Letrume · Teste",
      tradicoes: { lp: { nome: "Língua Portuguesa", cor: "#4A5E70", corEscura: "#9DB4CA" }, ce: { nome: "Conhecimentos Específicos", cor: "#5A5F8C", corEscura: "#A8A9DA" } },
    }],
  };
}
