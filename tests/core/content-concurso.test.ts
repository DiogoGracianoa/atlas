// Preparatório: carga do concurso (K-C1) pelo núcleo de conteúdo.
import { expect, it } from "vitest";
import { createContent } from "../../src/core/content";
import { manifest } from "./helpers";
import { concurso, manifestoConcursos, questoes, teoria } from "./concurso-fixture";

function arquivos() {
  const man = manifest();
  (man.areas as unknown[]).push(manifestoConcursos());
  const files: Record<string, unknown> = {
    "content/areas.json": man,
    "content/teste-2027/concurso.json": concurso(),
    "content/teste-2027/teoria/lp.json": teoria(),
    "content/teste-2027/questoes/lp.json": questoes(),
  };
  const calls: string[] = [];
  const fetchJSON = async (url: string) => { calls.push(url); if (!(url in files)) throw new Error("404 " + url); return JSON.parse(JSON.stringify(files[url])); };
  return { fetchJSON, calls };
}

it("concurso não é tratado como currículo: loadArea recusa e isAvailable é falso", async () => {
  const f = arquivos();
  const c = createContent(f);
  await c.loadManifest();
  expect(c.isConcurso("teste-2027")).toBe(true);
  expect(c.isAvailable("teste-2027")).toBe(false);
  await expect(c.loadArea("teste-2027")).rejects.toThrow();
  expect(f.calls).toEqual(["content/areas.json"]);
});

it("loadConcurso indexa tópicos por id com disciplina e módulo, uma vez por sessão", async () => {
  const f = arquivos();
  const c = createContent(f);
  await c.loadManifest();
  const x = await c.loadConcurso("teste-2027");
  await c.loadConcurso("teste-2027");
  expect(f.calls.filter(u => u.endsWith("concurso.json"))).toHaveLength(1);
  expect(x.topicos.get("ce-ip")).toMatchObject({ disciplina: { id: "ce" }, modulo: { id: "ce-m1" }, topico: { titulo: "Endereçamento IP" } });
  expect(x.fontes.get("anexo4")?.versao).toBe("Retificação nº 02");
});

it("teoria e questões vêm da pasta do concurso, por disciplina, com cache", async () => {
  const f = arquivos();
  const c = createContent(f);
  await c.loadManifest();
  expect((await c.loadTeoria("teste-2027", "lp"))["lp-crase"]?.objetivos).toHaveLength(1);
  expect(await c.loadQuestoes("teste-2027", "lp")).toHaveLength(8);
  await c.loadQuestoes("teste-2027", "lp");
  expect(f.calls.filter(u => u.includes("questoes/lp"))).toHaveLength(1);
});

it("concurso desconhecido é recusado", async () => {
  const c = createContent(arquivos());
  await c.loadManifest();
  await expect(c.loadConcurso("teste")).rejects.toThrow();
});
