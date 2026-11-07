// Cenários C04, C05, C06, C08, C13: manifesto, carga sob demanda e índice.
import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createContent, indexArea, areaProgress } from "../../src/core/content";
import { manifest, curriculum, REPO } from "./helpers";
import type { AreaMeta, Curriculum, Manifest } from "../../src/core/types";

function fakeFetch(files: Record<string, unknown>) {
  const calls: string[] = [];
  const fetchJSON = async (url: string) => {
    calls.push(url);
    if (!(url in files)) throw new Error("404 " + url);
    return JSON.parse(JSON.stringify(files[url]));
  };
  return { fetchJSON, calls };
}

test("abertura busca só o manifesto", async () => {
  const f = fakeFetch({ "content/areas.json": manifest(), "content/teste/curriculum.json": curriculum() });
  const c = createContent(f);
  await c.loadManifest();
  assert.deepEqual(f.calls, ["content/areas.json"]);
  assert.deepEqual(c.areas().map(a => [a.slug, a.status]), [["teste", "disponivel"], ["futura", "planejado"]]);
});

test("currículo é buscado uma única vez por sessão", async () => {
  const f = fakeFetch({ "content/areas.json": manifest(), "content/teste/curriculum.json": curriculum() });
  const c = createContent(f);
  await c.loadManifest();
  const [a, b] = await Promise.all([c.loadArea("teste"), c.loadArea("teste")]);
  await c.loadArea("teste");
  assert.equal(a, b);
  assert.deepEqual(f.calls, ["content/areas.json", "content/teste/curriculum.json"]);
  assert.equal(c.isLoaded("teste"), true);
});

test("área planejada ou inexistente não carrega", async () => {
  const f = fakeFetch({ "content/areas.json": manifest() });
  const c = createContent(f);
  await c.loadManifest();
  await assert.rejects(c.loadArea("futura"), /indisponível/);
  await assert.rejects(c.loadArea("nada"), /indisponível/);
  assert.equal(c.isAvailable("futura"), false);
  assert.equal(c.isAvailable("teste"), true);
});

test("falha de rede ao carregar área não fica em cache", async () => {
  let fail = true;
  const fetchJSON = async (url: string) => {
    if (url.endsWith("curriculum.json") && fail) throw new Error("offline");
    return url.endsWith("areas.json") ? manifest() : curriculum();
  };
  const c = createContent({ fetchJSON });
  await c.loadManifest();
  await assert.rejects(c.loadArea("teste"), /offline/);
  fail = false;
  const a = await c.loadArea("teste");
  assert.equal(a.nodes.length, 3);
});

test("índice compõe IDs com namespace e marcas por item", () => {
  const a = indexArea(manifest().areas[0]!, curriculum());
  assert.deepEqual(a.nodes.map(n => n.key), ["teste/m1e1", "teste/m1e2", "teste/m1of"]);
  assert.equal(a.byKey["teste/m1e2"]!.id, "m1e2");
  assert.equal(a.byId.m1of!.kind, "workshop");
  assert.deepEqual(a.marksOf(a.byId.m1e1!).map(m => m.k), ["def", "vid", "book"]);
  assert.deepEqual(a.marksOf(a.byId.m1e2!).map(m => m.k), ["def", "vid"]);
  assert.deepEqual(a.marksOf(a.byId.m1of!).map(m => m.k), ["do"]);
  assert.deepEqual(a.allMarks, ["teste/m1e1:def", "teste/m1e1:vid", "teste/m1e1:book", "teste/m1e2:def", "teste/m1e2:vid", "teste/m1of:do"]);
  assert.deepEqual(a.stats, { modulos: 1, temas: 2, livros: 1, videos: 2 });
});

test("política real: 43 itens, IDs compostos únicos", () => {
  const man = JSON.parse(readFileSync(join(REPO, "private", "content", "areas.json"), "utf8")) as Manifest;
  const cur = JSON.parse(readFileSync(join(REPO, "private", "content", "politica", "curriculum.json"), "utf8")) as Curriculum;
  const a = indexArea(man.areas.find(x => x.slug === "politica") as AreaMeta, cur);
  assert.equal(a.nodes.length, 43);
  assert.equal(new Set(a.nodes.map(n => n.key)).size, 43);
  assert.equal(a.nodes[0]!.key, "politica/m1e1");
  assert.deepEqual(a.stats, { modulos: 8, temas: 35, livros: 30, videos: 50 });
});

test("política: módulos 1 a 7 seguem byte a byte iguais ao original extraído", () => {
  // O arquivo original terminava em "]}" (fecha a lista de módulos e o objeto).
  // Módulos novos entram antes desse fechamento; o prefixo não muda.
  const b = readFileSync(join(REPO, "private", "content", "politica", "curriculum.json"));
  const prefix = b.subarray(0, 198397 - 2);
  assert.equal(createHash("sha256").update(prefix).digest("hex"), "e4abb645cd24faf3413f3022cbfd2fb4daa44f38ef1f0c402f11475940a0994f");
});

test("política: módulo 8 sobre ajuste fiscal, com ênfase marxista", () => {
  const cur = JSON.parse(readFileSync(join(REPO, "private", "content", "politica", "curriculum.json"), "utf8")) as Curriculum;
  const m8 = cur.modules.find(m => m.id === "m8");
  assert.ok(m8, "módulo m8 ausente");
  assert.equal(m8.number, 8);
  assert.match(m8.name, /ajuste fiscal/i);
  const trads = m8.steps.map(s => s.tradition);
  assert.ok(trads.includes("liberal"), "precisa de ao menos um tema liberal");
  assert.ok(trads.filter(t => t === "marx").length > trads.filter(t => t === "liberal").length, "marxismo em maior número que liberalismo");
  assert.equal(m8.workshop.id, "m8of");
});

test("progresso da área usa total conhecido ou só a contagem", () => {
  const marks = {
    "teste/m1e1:def": { done: true, at: "2026-11-04T10:00:00.000Z" },
    "teste/m1e1:vid": { done: false, at: "2026-11-04T10:00:00.000Z" },
    "teste/m1of:do": { done: true, at: "2026-11-04T10:00:00.000Z" },
    "outra/m1e1:def": { done: true, at: "2026-11-04T10:00:00.000Z" },
    "testex/m1e1:def": { done: true, at: "2026-11-04T10:00:00.000Z" }
  };
  assert.deepEqual(areaProgress("teste", marks, 6), { done: 2, total: 6, pct: 33 });
  assert.deepEqual(areaProgress("teste", marks, undefined), { done: 2, total: null, pct: null });
});

// Cenário S14 (atlas-tecnologia-subtemas): subtemas no manifesto (K1 v2).
function manifestoComSubtemas(): Manifest {
  const base = manifest().areas[0]!;
  return {
    areas: [
      base,
      {
        slug: "tecnologia", nome: "Tecnologia", resumo: "Recortes.", status: "disponivel",
        subtemas: [
          { ...base, slug: "sub-um", nome: "Subtema um", arquivo: "content/sub-um/curriculum.json" },
          { slug: "sub-dois", nome: "Subtema dois", status: "planejado" },
        ],
      },
    ],
  };
}

test("subtemas: busca por slug, pai, folhas e disponibilidade", async () => {
  const f = fakeFetch({ "content/areas.json": manifestoComSubtemas(), "content/sub-um/curriculum.json": curriculum() });
  const c = createContent(f);
  await c.loadManifest();
  assert.deepEqual(c.areas().map(a => a.slug), ["teste", "tecnologia"]);
  assert.equal(c.area("sub-um")?.nome, "Subtema um");
  assert.equal(c.parentOf("sub-um")?.slug, "tecnologia");
  assert.equal(c.parentOf("teste"), null);
  assert.deepEqual(c.leaves().map(a => a.slug), ["teste", "sub-um", "sub-dois"]);
  assert.equal(c.isAvailable("sub-um"), true);
  assert.equal(c.isAvailable("sub-dois"), false);
  assert.equal(c.isAvailable("tecnologia"), false, "agrupador não tem currículo próprio");
  assert.equal(c.isGroup("tecnologia"), true);
  assert.equal(c.isGroup("teste"), false);
  const a = await c.loadArea("sub-um");
  assert.equal(a.nodes[0]!.key, "sub-um/m1e1");
  assert.deepEqual(f.calls, ["content/areas.json", "content/sub-um/curriculum.json"]);
});
