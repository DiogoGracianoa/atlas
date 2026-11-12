// Preparatório, cenários S17–S21 (RN10–RN13): registros locais do estudante.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createRegistros, REGISTROS_KEY } from "../../src/core/registros";
import { estadoTopico, definirConfianca, definirEstado, historicoTopico, marcarLeitura, registrarSessao, replanejar, semanaEfetiva, tempoSemana } from "../../src/core/concurso/estudo";
import type { Concurso } from "../../src/core/concurso/tipos";
import { memoryStorage } from "./fake-backend";

const c = JSON.parse(readFileSync("private/content/contagem-2027/concurso.json", "utf8")) as Concurso;
const A = "contagem-2027";

function novo(storage = memoryStorage(), inicio = "2026-12-20T12:00:00.000Z") {
  let t = Date.parse(inicio);
  let n = 0;
  const regs = createRegistros({ storage, now: () => new Date(t++).toISOString(), uuid: () => "uuid-" + ++n });
  return { regs, storage };
}

describe("registros locais", () => {
  it("S21: grava no armazenamento antes de avisar a interface", () => {
    const { regs, storage } = novo();
    let visto: string | null = null;
    regs.on(() => { visto = storage.getItem(REGISTROS_KEY); });
    registrarSessao(regs, A, { disciplina: "lp", topicos: ["lp-crase"], data: "2026-12-14", minutos: 60 });
    expect(visto).toContain("lp-crase");
  });

  it("recarrega do armazenamento e ignora entradas inválidas", () => {
    const storage = memoryStorage();
    storage.setItem(REGISTROS_KEY, JSON.stringify({ v: 1, itens: { "topico:x": { tipo: "topico", id: "x", area: A, corpo: { estado: "concluido" }, at: "2026-12-01T00:00:00.000Z" }, "ruim": 3 } }));
    const { regs } = novo(storage);
    expect(regs.get("topico", "x")?.corpo).toEqual({ estado: "concluido" });
    expect(regs.todos()).toHaveLength(1);
  });

  it("applyOps só aplica a versão mais recente (vence o mais recente)", () => {
    const { regs } = novo();
    definirEstado(regs, A, "lp-crase", "em-andamento");
    const atual = regs.get("topico", A + "/lp-crase")!;
    regs.applyOps([{ ...atual, corpo: { estado: "concluido" }, at: "2000-01-01T00:00:00.000Z" }], { silent: true });
    expect(estadoTopico(regs, A, "lp-crase").estado).toBe("em-andamento");
    regs.applyOps([{ ...atual, corpo: { estado: "concluido" }, at: "2099-01-01T00:00:00.000Z" }], { silent: true });
    expect(estadoTopico(regs, A, "lp-crase").estado).toBe("concluido");
  });
});

describe("estado do tópico", () => {
  it("S17: sem registros, o tópico está não iniciado, sem leitura e sem confiança", () => {
    const { regs } = novo();
    expect(estadoTopico(regs, A, "lp-crase")).toEqual({ estado: "nao-iniciado", leitura: null, confianca: null });
  });

  it("S18: marcar a leitura não muda estado nem confiança", () => {
    const { regs } = novo();
    definirConfianca(regs, A, "lp-crase", "baixa");
    definirEstado(regs, A, "lp-crase", "em-andamento");
    marcarLeitura(regs, A, "lp-crase", "2026-12-14");
    expect(estadoTopico(regs, A, "lp-crase")).toEqual({ estado: "em-andamento", leitura: "2026-12-14", confianca: "baixa" });
  });

  it("estado inválido é recusado", () => {
    const { regs } = novo();
    expect(() => definirEstado(regs, A, "lp-crase", "dominado" as never)).toThrow();
  });
});

describe("replanejamento (S19, RN10)", () => {
  it("move Crase da semana 5 para a 7 com histórico", () => {
    const { regs } = novo();
    expect(semanaEfetiva(regs, c, A, "lp-crase")).toBe(5);
    replanejar(regs, c, A, "lp-crase", 7, "2026-12-20");
    expect(semanaEfetiva(regs, c, A, "lp-crase")).toBe(7);
    expect(historicoTopico(regs, c, A, "lp-crase")).toEqual({ planejada: 5, mudancas: [{ de: 5, para: 7, em: "2026-12-20" }] });
  });

  it("dois replanejamentos: vale o último", () => {
    const { regs } = novo();
    replanejar(regs, c, A, "lp-crase", 7, "2026-12-20");
    replanejar(regs, c, A, "lp-crase", 8, "2026-12-29");
    expect(semanaEfetiva(regs, c, A, "lp-crase")).toBe(8);
    expect(historicoTopico(regs, c, A, "lp-crase").mudancas).toHaveLength(2);
  });

  it("semana fora de 1–10 é recusada", () => {
    const { regs } = novo();
    expect(() => replanejar(regs, c, A, "lp-crase", 11, "2026-12-20")).toThrow();
    expect(() => replanejar(regs, c, A, "lp-crase", 0, "2026-12-20")).toThrow();
  });
});

describe("sessões e tempo (S20, RN11)", () => {
  it("1 h e 1 h 30 na semana 2 somam 150 de 600 minutos", () => {
    const { regs } = novo();
    registrarSessao(regs, A, { disciplina: "lp", topicos: ["lp-classes"], data: "2026-11-23", minutos: 60 });
    registrarSessao(regs, A, { disciplina: "ce", topicos: ["ce-windows"], data: "2026-11-25", minutos: 90 });
    registrarSessao(regs, A, { disciplina: "ce", topicos: [], data: "2026-11-30", minutos: 45 }); // semana 3
    expect(tempoSemana(regs, c, A, 2)).toEqual({ realizado: 150, previsto: 600 });
  });

  it("duração zero, negativa ou acima de 24 h é recusada", () => {
    const { regs } = novo();
    for (const minutos of [0, -5, 1441]) expect(() => registrarSessao(regs, A, { disciplina: "lp", topicos: [], data: "2026-11-23", minutos })).toThrow();
  });
});

describe("zerar tudo (S48)", () => {
  it("apaga os registros visíveis e deixa marcas de exclusão para sincronizar", () => {
    const { regs } = novo();
    definirEstado(regs, A, "lp-crase", "concluido");
    registrarSessao(regs, A, { disciplina: "lp", topicos: [], data: "2026-11-23", minutos: 60 });
    const emitidos: number[] = [];
    regs.on(e => { if (e.type === "batch" && !e.silent) emitidos.push(e.regs.length); });
    regs.resetAll();
    expect(estadoTopico(regs, A, "lp-crase").estado).toBe("nao-iniciado");
    expect(regs.lista("sessao", A)).toEqual([]);
    expect(regs.todos()).toHaveLength(2);
    expect(regs.resetAt).not.toBeNull();
    expect(emitidos).toEqual([2]);
  });
});
