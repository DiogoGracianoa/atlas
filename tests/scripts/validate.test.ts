// Cenários C10 e C11: scripts/validate.mjs.
import { test } from "vitest";
import assert from "node:assert/strict";
import { writeAtlas, runValidate, manifest, curriculum, REPO } from "./helpers";

// Estes testes montam conteúdo inválido de propósito (campo faltando, tipo
// errado, status inexistente); a tipagem frouxa aqui é intencional.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Invalida = any;

test("Atlas mínimo válido passa (código 0)", () => {
  const r = runValidate(writeAtlas());
  assert.equal(r.code, 0, r.out);
});

test("conteúdo real do repositório passa", () => {
  const r = runValidate(REPO);
  assert.equal(r.code, 0, r.out);
});

test("arquivo de currículo ausente falha", () => {
  const r = runValidate(writeAtlas({ files: { "content/teste/curriculum.json": null } }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste: arquivo não encontrado: content\/teste\/curriculum\.json/);
});

test("JSON torto falha sem quebrar o script", () => {
  const r = runValidate(writeAtlas({ files: { "content/teste/curriculum.json": "{ \"modules\": [" } }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste: JSON inválido/);
});

test("ID duplicado na área falha", () => {
  const cur: Invalida = curriculum();
  cur.modules[0].steps[1].id = "m1e1";
  const r = runValidate(writeAtlas({ cur }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste\/m1e1: id repetido/);
});

for (const campo of ["id", "title", "tagline", "tradition", "definition", "concepts", "theses", "check"]) {
  test("tema sem " + campo + " falha", () => {
    const cur: Invalida = curriculum();
    Reflect.deleteProperty(cur.modules[0].steps[0], campo);
    const r = runValidate(writeAtlas({ cur }));
    assert.equal(r.code, 1);
    assert.match(r.out, new RegExp("campo obrigatório ausente: " + campo));
  });
}

test("tema com campo obrigatório vazio falha", () => {
  const cur: Invalida = curriculum();
  cur.modules[0].steps[0].check = [];
  const r = runValidate(writeAtlas({ cur }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste\/m1e1: campo obrigatório ausente: check/);
});

test("URL sem https:// falha", () => {
  const cur: Invalida = curriculum();
  cur.modules[0].steps[0].videos[0].url = "http://example.org/v";
  const r = runValidate(writeAtlas({ cur }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste\/m1e1: URL sem https:\/\/: http:\/\/example\.org\/v/);
});

test("tema sem book e sem bridge falha", () => {
  const cur: Invalida = curriculum();
  delete cur.modules[0].steps[1].bridge;
  const r = runValidate(writeAtlas({ cur }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste\/m1e2: sem book e sem bridge/);
});

test("tradição que não existe no manifesto falha", () => {
  const cur: Invalida = curriculum();
  cur.modules[0].steps[0].tradition = "inexistente";
  const r = runValidate(writeAtlas({ cur }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste\/m1e1: tradição sem entrada em areas\.json: inexistente/);
});

test("manifesto: slug repetido e status inválido falham", () => {
  const man: Invalida = manifest();
  man.areas.push({ slug: "futura", nome: "Dupla", status: "talvez" });
  const r = runValidate(writeAtlas({ man }));
  assert.equal(r.code, 1);
  assert.match(r.out, /futura: slug repetido/);
  assert.match(r.out, /futura: status inválido: talvez/);
});

test("manifesto: área disponível sem metadados falha", () => {
  const man: Invalida = manifest();
  delete man.areas[0].promptBase;
  delete man.areas[0].tradicoes;
  const r = runValidate(writeAtlas({ man }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste: campo obrigatório no manifesto: promptBase/);
  assert.match(r.out, /teste: campo obrigatório no manifesto: tradicoes/);
});

test("área planejada não precisa de arquivo", () => {
  const r = runValidate(writeAtlas());
  assert.doesNotMatch(r.out, /futura:/);
});

test("código do site que referencia exemplos/ falha", () => {
  const r = runValidate(writeAtlas({ files: { "src/app.ts": "fetch('exemplos/rascunho.json')" } }));
  assert.equal(r.code, 1);
  assert.match(r.out, /src\/app\.ts: referência a exemplos\//);
});

test("vários erros são todos listados", () => {
  const cur: Invalida = curriculum();
  delete cur.modules[0].steps[0].check;
  cur.modules[0].steps[1].videos[0].url = "ftp://x";
  const r = runValidate(writeAtlas({ cur }));
  assert.equal(r.code, 1);
  assert.match(r.out, /m1e1: campo obrigatório ausente: check/);
  assert.match(r.out, /m1e2: URL sem https:\/\//);
});

// Cenário S09 (atlas-tecnologia-subtemas): agrupadores e subtemas (K1 v2).
const comGrupo = (grupo: Invalida) => { const man: Invalida = manifest(); man.areas.push(grupo); return man; };
const subtema = (slug: string, extra: Invalida = {}): Invalida => ({ ...manifest().areas[0], slug, nome: "Sub " + slug, arquivo: `content/${slug}/curriculum.json`, ...extra });
const arquivoDe = (slug: string) => ({ [`content/${slug}/curriculum.json`]: JSON.stringify(curriculum()) });

test("agrupador com subtema disponível válido passa", () => {
  const man = comGrupo({ slug: "tec", nome: "Tecnologia", status: "disponivel", subtemas: [subtema("sub-um"), { slug: "sub-dois", nome: "Dois", status: "planejado" }] });
  const r = runValidate(writeAtlas({ man, files: arquivoDe("sub-um") }));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /2 área\(s\) disponível\(is\)/);
});

test("slug de subtema repetido (com área ou com outro subtema) falha", () => {
  const man = comGrupo({ slug: "tec", nome: "Tecnologia", status: "disponivel", subtemas: [subtema("teste"), subtema("sub-um"), subtema("sub-um")] });
  const r = runValidate(writeAtlas({ man, files: arquivoDe("sub-um") }));
  assert.equal(r.code, 1);
  assert.match(r.out, /teste: slug repetido/);
  assert.match(r.out, /sub-um: slug repetido/);
});

test("agrupador com arquivo próprio falha", () => {
  const man = comGrupo({ slug: "tec", nome: "Tecnologia", status: "disponivel", arquivo: "content/tec/curriculum.json", subtemas: [subtema("sub-um")] });
  const r = runValidate(writeAtlas({ man, files: arquivoDe("sub-um") }));
  assert.equal(r.code, 1);
  assert.match(r.out, /tec: agrupador não pode ter arquivo/);
});

test("agrupador disponível sem subtema disponível falha", () => {
  const man = comGrupo({ slug: "tec", nome: "Tecnologia", status: "disponivel", subtemas: [{ slug: "sub-dois", nome: "Dois", status: "planejado" }] });
  const r = runValidate(writeAtlas({ man }));
  assert.equal(r.code, 1);
  assert.match(r.out, /tec: agrupador disponível sem subtema disponível/);
});

test("subtema disponível sem metadados falha", () => {
  const man = comGrupo({ slug: "tec", nome: "Tecnologia", status: "disponivel", subtemas: [{ slug: "sub-um", nome: "Um", status: "disponivel", arquivo: "content/sub-um/curriculum.json" }] });
  const r = runValidate(writeAtlas({ man, files: arquivoDe("sub-um") }));
  assert.equal(r.code, 1);
  assert.match(r.out, /sub-um: campo obrigatório no manifesto: titulo/);
});
