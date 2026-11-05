// Cenários C04, C05, C06, C08, C13: manifesto, carga sob demanda e índice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContent, indexArea, areaProgress } from "../../assets/lib/content.js";
import { manifest, curriculum, REPO } from "./helpers.mjs";

function fakeFetch(files) {
  const calls = [];
  const fetchJSON = async (url) => {
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
  const fetchJSON = async (url) => {
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
  const a = indexArea(manifest().areas[0], curriculum());
  assert.deepEqual(a.nodes.map(n => n.key), ["teste/m1e1", "teste/m1e2", "teste/m1of"]);
  assert.equal(a.byKey["teste/m1e2"].id, "m1e2");
  assert.equal(a.byId.m1of.kind, "workshop");
  assert.deepEqual(a.marksOf(a.byId.m1e1).map(m => m.k), ["def", "vid", "book"]);
  assert.deepEqual(a.marksOf(a.byId.m1e2).map(m => m.k), ["def", "vid"]);
  assert.deepEqual(a.marksOf(a.byId.m1of).map(m => m.k), ["do"]);
  assert.deepEqual(a.allMarks, ["teste/m1e1:def", "teste/m1e1:vid", "teste/m1e1:book", "teste/m1e2:def", "teste/m1e2:vid", "teste/m1of:do"]);
  assert.deepEqual(a.stats, { modulos: 1, temas: 2, livros: 1, videos: 2 });
});

test("política real: 36 itens, IDs compostos únicos", () => {
  const man = JSON.parse(readFileSync(join(REPO, "content", "areas.json"), "utf8"));
  const cur = JSON.parse(readFileSync(join(REPO, "content", "politica", "curriculum.json"), "utf8"));
  const a = indexArea(man.areas.find(x => x.slug === "politica"), cur);
  assert.equal(a.nodes.length, 36);
  assert.equal(new Set(a.nodes.map(n => n.key)).size, 36);
  assert.equal(a.nodes[0].key, "politica/m1e1");
  assert.deepEqual(a.stats, { modulos: 7, temas: 29, livros: 24, videos: 38 });
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
