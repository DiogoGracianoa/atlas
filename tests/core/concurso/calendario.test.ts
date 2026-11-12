// Preparatório, cenários S11–S16 (RN07–RN09): calendário no fuso de Brasília,
// sobre a trilha real de Contagem 2027.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contagem, diaLocal, hoje, textoContagem } from "../../../src/core/concurso/calendario";
import type { Concurso } from "../../../src/core/concurso/tipos";

const c = JSON.parse(readFileSync("private/content/contagem-2027/concurso.json", "utf8")) as Concurso;
const plano = (concluidos: string[] = []) => ({
  semanaDe: (id: string) => c.trilha.semanas.find(s => s.topicos.includes(id))?.n ?? null,
  concluido: (id: string) => concluidos.includes(id),
});

describe("hoje", () => {
  it("S11: quarta 02/12/2026 é semana 3, Conhecimentos Específicos, com os tópicos de redes não concluídos", () => {
    const h = hoje(c, "2026-12-02T15:00:00.000Z", plano(["ce-redes-conceitos"]));
    expect(h.fase).toBe("durante");
    expect(h.semana?.n).toBe(3);
    expect(h.diaSemana).toBe("qua");
    expect(h.foco).toEqual(["ce"]);
    expect(h.topicos).toEqual(["ce-redes-ip", "ce-redes-protocolos"]);
  });

  it("S12: sábado 05/12/2026 é dia de revisão, questões e simulado, sem tópicos novos", () => {
    const h = hoje(c, "2026-12-05T13:00:00.000Z", plano());
    expect(h.foco).toEqual(["revisao", "questoes", "simulado"]);
    expect(h.topicos).toEqual([]);
  });

  it("S13: 23h30 de 15/11 em Brasília (02h30Z de 16/11) ainda é 15/11", () => {
    expect(diaLocal("2026-11-16T02:30:00.000Z", "America/Sao_Paulo")).toBe("2026-11-15");
    const h = hoje(c, "2026-11-16T02:30:00.000Z", plano());
    expect(h.fase).toBe("antes");
    expect(h.comecaEm).toBe(1);
  });

  it("S14: 11/11/2026 está antes da trilha: começa em 5 dias, semana 1 em foco", () => {
    const h = hoje(c, "2026-11-11T12:00:00.000Z", plano());
    expect(h.fase).toBe("antes");
    expect(h.comecaEm).toBe(5);
    expect(h.semana).toBeNull();
    expect(h.semanaEmFoco?.n).toBe(1);
  });

  it("S15: 25/01/2027 está depois da trilha: nenhuma semana atual", () => {
    const h = hoje(c, "2027-01-25T12:00:00.000Z", plano());
    expect(h.fase).toBe("depois");
    expect(h.semana).toBeNull();
    expect(h.semanaEmFoco).toBeNull();
  });

  it("tópico replanejado aparece na semana nova", () => {
    const p = { semanaDe: (id: string) => (id === "lp-crase" ? 3 : plano().semanaDe(id)), concluido: () => false };
    const h = hoje(c, "2026-11-30T12:00:00.000Z", p); // segunda da semana 3: LP
    expect(h.topicos).toEqual(["lp-verbos", "lp-discursos", "lp-crase"]);
  });
});

describe("contagem regressiva (S16)", () => {
  it("faltam 10 dias em 14/01/2027", () => {
    expect(contagem(c, "2027-01-14T12:00:00.000Z")).toEqual({ tipo: "faltam", dias: 10 });
    expect(textoContagem(contagem(c, "2027-01-14T12:00:00.000Z"))).toBe("Faltam 10 dias");
  });
  it("falta 1 dia na véspera", () => {
    expect(textoContagem(contagem(c, "2027-01-23T12:00:00.000Z"))).toBe("Falta 1 dia");
  });
  it("no dia: a prova é hoje", () => {
    expect(textoContagem(contagem(c, "2027-01-24T12:00:00.000Z"))).toBe("A prova é hoje");
  });
  it("depois: prova realizada", () => {
    expect(textoContagem(contagem(c, "2027-01-26T12:00:00.000Z"))).toBe("Prova realizada em 24/01/2027");
  });
});
