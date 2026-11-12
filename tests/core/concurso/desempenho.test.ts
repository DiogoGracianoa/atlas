// Preparatório, cenários S05 e S27–S34 (RN03, RN14, RN16–RN19, RN22).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createRegistros } from "../../../src/core/registros";
import { definirEstado, marcarLeitura } from "../../../src/core/concurso/estudo";
import {
  anotarErro, cadernoDeErros, marcarErroRevisado, marcarRevisao, notaObjetiva, progressoDisciplina, progressoTotal,
  responder, revisoes, revisoesPendentes, taxaDisciplina, taxaGeral, taxaTopico, temasFracos,
} from "../../../src/core/concurso/desempenho";
import type { Concurso } from "../../../src/core/concurso/tipos";
import { concurso as fixture } from "../concurso-fixture";
import { memoryStorage } from "../fake-backend";

const real = JSON.parse(readFileSync("private/content/contagem-2027/concurso.json", "utf8")) as Concurso;
const A = "contagem-2027";
function regs(inicio = "2026-12-01T12:00:00.000Z") {
  let t = Date.parse(inicio), n = 0;
  return createRegistros({ storage: memoryStorage(), now: () => new Date(t += 1000).toISOString(), uuid: () => "e" + ++n });
}
const q = (id: string, topico: string) => ({ id, topico, gabarito: 2 });

describe("progresso (RN14, RN03)", () => {
  it("S27: 30 tópicos, 6 concluídos e 4 em revisão → 20%", () => {
    const c = fixture();
    c.disciplinas[0]!.modulos[0]!.topicos = Array.from({ length: 30 }, (_, i) => ({ id: "rl-" + i, titulo: "T" + i, subtopicos: [], fonte: { ref: "anexo4", pagina: 4 }, validacao: "verificado" as const }));
    const r = regs();
    for (let i = 0; i < 6; i++) definirEstado(r, A, "rl-" + i, "concluido");
    for (let i = 6; i < 10; i++) definirEstado(r, A, "rl-" + i, "revisao-necessaria");
    expect(progressoDisciplina(c, r, A, "lp")).toEqual({ concluidos: 6, total: 30, pct: 20 });
  });

  it("S05: tópico opcional concluído não conta; total sem ponderação", () => {
    const r = regs();
    definirEstado(r, A, "cgm-desenvolvimento-local", "concluido");
    expect(progressoDisciplina(real, r, A, "cgm")).toEqual({ concluidos: 0, total: 12, pct: 0 });
    definirEstado(r, A, "cgm-historia", "concluido");
    definirEstado(r, A, "lp-crase", "concluido");
    expect(progressoTotal(real, r, A)).toEqual({ concluidos: 2, total: 72, pct: 3 });
  });
});

describe("taxa de acertos (RN16)", () => {
  it("S28: sem tentativas é 'sem dados' (null), nunca 0%", () => {
    expect(taxaTopico(regs(), A, "lp-regencia")).toBeNull();
    expect(taxaGeral(regs(), A)).toBeNull();
  });

  it("S28: 10 tentativas de Regência com 7 acertos → 70%", () => {
    const r = regs();
    for (let i = 0; i < 10; i++) responder(r, A, q("lp-regencia-q" + (i % 8 + 1), "lp-regencia"), i < 7 ? 2 : 0, "2026-12-15");
    expect(taxaTopico(r, A, "lp-regencia")).toEqual({ acertos: 7, total: 10, pct: 70 });
    expect(taxaDisciplina(real, r, A, "lp")).toEqual({ acertos: 7, total: 10, pct: 70 });
    expect(taxaDisciplina(real, r, A, "ce")).toBeNull();
  });

  it("responder devolve se acertou", () => {
    const r = regs();
    expect(responder(r, A, q("x1", "lp-crase"), 2, "2026-12-15")).toBe(true);
    expect(responder(r, A, q("x1", "lp-crase"), 1, "2026-12-15")).toBe(false);
  });
});

describe("caderno de erros (S29, RN17)", () => {
  it("erro entra; acerto posterior tira; a tentativa errada fica no histórico", () => {
    const r = regs();
    responder(r, A, q("lp-crase-q1", "lp-crase"), 1, "2026-12-03");
    anotarErro(r, A, "lp-crase-q1", "Confundi com a preposição antes de verbo.");
    expect(cadernoDeErros(r, A)).toEqual([{ questao: "lp-crase-q1", topico: "lp-crase", errouEm: "2026-12-03", anotacao: "Confundi com a preposição antes de verbo." }]);
    responder(r, A, q("lp-crase-q1", "lp-crase"), 2, "2026-12-05");
    expect(cadernoDeErros(r, A)).toEqual([]);
    expect(taxaTopico(r, A, "lp-crase")).toEqual({ acertos: 1, total: 2, pct: 50 });
  });

  it("marcar como revisada tira do caderno; errar de novo volta", () => {
    const r = regs();
    responder(r, A, q("lp-crase-q2", "lp-crase"), 0, "2026-12-03");
    marcarErroRevisado(r, A, "lp-crase-q2");
    expect(cadernoDeErros(r, A)).toEqual([]);
    responder(r, A, q("lp-crase-q2", "lp-crase"), 0, "2026-12-04");
    expect(cadernoDeErros(r, A).map(x => x.questao)).toEqual(["lp-crase-q2"]);
  });
});

describe("revisão espaçada (RN18)", () => {
  it("S30: leitura em 14/12/2026 → 15/12, 21/12 e 04/01/2027", () => {
    const r = regs();
    marcarLeitura(r, A, "lp-crase", "2026-12-14");
    expect(revisoes(real, r, A).map(x => x.dia)).toEqual(["2026-12-15", "2026-12-21", "2027-01-04"]);
  });

  it("S31: leitura em 10/01/2027 → 11/01 e 17/01; nada depois de 23/01", () => {
    const r = regs();
    marcarLeitura(r, A, "rl-probabilidade", "2027-01-10");
    expect(revisoes(real, r, A).map(x => x.dia)).toEqual(["2027-01-11", "2027-01-17"]);
  });

  it("S32: revisão de 15/12 não feita está pendente em 16/12; feita sai da lista", () => {
    const r = regs();
    marcarLeitura(r, A, "lp-crase", "2026-12-14");
    expect(revisoesPendentes(real, r, A, "2026-12-16").map(x => x.dia)).toEqual(["2026-12-15"]);
    marcarRevisao(r, A, "lp-crase", 1, "2026-12-16");
    expect(revisoesPendentes(real, r, A, "2026-12-16")).toEqual([]);
    expect(revisoes(real, r, A).filter(x => x.feita)).toHaveLength(1);
  });
});

describe("nota da objetiva (S33, RN19)", () => {
  it("LP 8, RL 3, CGM 6, CE 14 → 70 de 100, acima de 60", () => {
    expect(notaObjetiva(real, { lp: 8, rl: 3, cgm: 6, ce: 14 })).toEqual({ nota: 70, max: 100, minimo: 60, aprovado: true });
  });
  it("acertos acima do número de questões da disciplina são recusados", () => {
    expect(() => notaObjetiva(real, { lp: 11, rl: 0, cgm: 0, ce: 0 })).toThrow();
    expect(() => notaObjetiva(real, { lp: -1, rl: 0, cgm: 0, ce: 0 })).toThrow();
  });
});

describe("temas fracos (S34, RN22)", () => {
  it("os cinco de menor taxa com ao menos uma tentativa", () => {
    const r = regs();
    const casos: [string, number, number][] = [["lp-crase", 3, 10], ["ce-redes-ip", 9, 20], ["lp-regencia", 5, 10], ["ce-poo-relacoes", 11, 20], ["rl-divisibilidade", 6, 10], ["rl-porcentagem", 9, 10]];
    for (const [t, ac, tot] of casos) for (let i = 0; i < tot; i++) responder(r, A, q(t + "-q1", t), i < ac ? 2 : 0, "2026-12-20");
    expect(temasFracos(real, r, A, 5).map(x => [x.topico, x.taxa.pct])).toEqual([
      ["lp-crase", 30], ["ce-redes-ip", 45], ["lp-regencia", 50], ["ce-poo-relacoes", 55], ["rl-divisibilidade", 60],
    ]);
  });
});
