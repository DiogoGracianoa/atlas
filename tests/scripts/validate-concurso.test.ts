// Preparatório de concurso, cenários S01, S06, S08, S09, S36, S38, S39:
// `npm run validate` confere o contrato K-C1.
import { expect, it } from "vitest";
import { manifest } from "../core/helpers";
import { concurso, manifestoConcursos, questoes, teoria } from "../core/concurso-fixture";
import { runValidate, writeAtlas } from "./helpers";

// Conteúdo inválido de propósito.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Livre = any;

function montar(over: { c?: Livre; t?: Livre; q?: Livre; files?: Record<string, string | null> } = {}) {
  const man = manifest() as Livre;
  man.areas.push(manifestoConcursos());
  const files: Record<string, string | null> = {
    "content/teste-2027/concurso.json": JSON.stringify(over.c ?? concurso()),
    "content/teste-2027/teoria/lp.json": JSON.stringify(over.t ?? teoria()),
    "content/teste-2027/questoes/lp.json": JSON.stringify(over.q ?? questoes()),
    ...over.files,
  };
  return runValidate(writeAtlas({ man, files }));
}

it("concurso mínimo válido passa", () => {
  const r = montar();
  expect(r.code, r.out).toBe(0);
});

it("S01: tópico obrigatório sem fonte ou sem estado de validação falha", () => {
  const c = concurso() as Livre;
  delete c.disciplinas[0].modulos[0].topicos[1].fonte;
  c.disciplinas[1].modulos[0].topicos[0].validacao = "talvez";
  const r = montar({ c });
  expect(r.code).toBe(1);
  expect(r.out).toMatch(/teste-2027\/lp-regencia: fonte/);
  expect(r.out).toMatch(/teste-2027\/ce-ip: validacao/);
});

it("S01: fonte que aponta para documento inexistente ou sem página falha", () => {
  const c = concurso() as Livre;
  c.disciplinas[0].modulos[0].topicos[1].fonte = { ref: "nada" };
  const r = montar({ c });
  expect(r.out).toMatch(/teste-2027\/lp-regencia: fonte\.ref desconhecida: nada/);
  expect(r.out).toMatch(/teste-2027\/lp-regencia: fonte\.pagina/);
});

it("S06: dado da prova sem fonte falha; soma de questões confere", () => {
  const c = concurso() as Livre;
  delete c.prova.objetiva.fonte;
  c.prova.objetiva.questoes = 7;
  const r = montar({ c });
  expect(r.out).toMatch(/teste-2027\/prova\.objetiva: fonte/);
  expect(r.out).toMatch(/teste-2027\/prova\.objetiva: soma das disciplinas \(6\) diferente do total \(7\)/);
});

it("S08: semanas com lacuna de datas ou sem uma disciplina falham", () => {
  const c = concurso() as Livre;
  c.trilha.semanas[1].inicio = "2026-11-24";
  c.trilha.semanas[0].topicos = ["lp-crase"];
  c.trilha.semanas[1].topicos.push("ce-ip");
  const r = montar({ c });
  expect(r.out).toMatch(/teste-2027\/semana 2: não começa no dia seguinte ao fim da semana 1/);
  expect(r.out).toMatch(/teste-2027\/semana 1: sem tópico de CE/);
});

it("S09: tópico obrigatório fora da trilha ou em duas semanas falha", () => {
  const c = concurso() as Livre;
  c.trilha.semanas[1].topicos = ["lp-regencia", "lp-crase", "ce-extra"];
  const r = montar({ c });
  expect(r.out).toMatch(/teste-2027\/ce-pccs: tópico obrigatório fora da trilha/);
  expect(r.out).toMatch(/teste-2027\/lp-crase: tópico em mais de uma semana/);
});

it("S38: tópico publicado com menos de 8 questões falha", () => {
  const r = montar({ q: questoes("lp-crase", 7) });
  expect(r.out).toMatch(/teste-2027\/lp-crase: 7 questões \(publicado exige 8 a 10\)/);
});

it("S36/S38: questão com origem ausente, 3 alternativas ou gabarito fora do intervalo falha", () => {
  const q = questoes() as Livre;
  delete q[0].origem;
  q[1].alternativas = ["A", "B", "C"];
  q[2].gabarito = 4;
  q[3].topico = "nao-existe";
  const r = montar({ q });
  expect(r.out).toMatch(/teste-2027\/lp-crase-q1: origem/);
  expect(r.out).toMatch(/teste-2027\/lp-crase-q2: alternativas \(exige 4\)/);
  expect(r.out).toMatch(/teste-2027\/lp-crase-q3: gabarito/);
  expect(r.out).toMatch(/teste-2027\/lp-crase-q4: tópico desconhecido: nao-existe/);
});

it("S39: tópico publicado sem teoria completa falha", () => {
  const t = teoria() as Livre;
  t["lp-crase"].exemplos = [];
  const r = montar({ t });
  expect(r.out).toMatch(/teste-2027\/lp-crase: teoria\.exemplos/);
});

it("S39: tópico publicado sem arquivo de teoria falha", () => {
  const r = montar({ files: { "content/teste-2027/teoria/lp.json": null } });
  expect(r.out).toMatch(/teste-2027\/lp-crase: teoria ausente/);
});

it("S08: semana de revisão cobre a disciplina com `revisar`; id desconhecido em `revisar` falha", () => {
  const c = concurso() as Livre;
  c.trilha.semanas[1].topicos = ["lp-regencia", "ce-pccs", "ce-extra"];
  c.trilha.semanas.push({ n: 3, inicio: "2026-11-30", fim: "2026-12-06", titulo: "Revisão", topicos: [], revisar: ["lp-crase", "ce-ip"], meta: "100 questões" });
  c.trilha.fim = "2026-12-06";
  expect(montar({ c }).code).toBe(0);
  c.trilha.semanas[2].revisar = ["lp-crase", "nada"];
  const r = montar({ c });
  expect(r.out).toMatch(/teste-2027\/semana 3: tópico desconhecido em revisar: nada/);
  expect(r.out).toMatch(/teste-2027\/semana 3: sem tópico de CE/);
});

it("leva 1: fontes da teoria são opcionais, mas, se houver, cada uma tem título e URL https", () => {
  const t = teoria() as Livre;
  t["lp-crase"].fontes = [{ titulo: "IBGE Cidades", url: "https://cidades.ibge.gov.br/" }];
  expect(montar({ t }).code).toBe(0);
  t["lp-crase"].fontes = [{ titulo: "", url: "http://exemplo.org" }];
  const r = montar({ t });
  expect(r.out).toMatch(/teste-2027\/lp-crase: teoria\.fontes/);
});
