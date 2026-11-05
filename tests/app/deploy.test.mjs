// Etapa 5: vercel.json (cenário T5.1 / risco R4) e seções obrigatórias do README.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./helpers.mjs";

const read = (p) => readFileSync(join(REPO, p), "utf8");

function headerFor(vercel, path, key) {
  // As regras do Vercel usam padrões; aqui basta casar "/(.*)" e prefixos simples.
  let value;
  for (const rule of vercel.headers || []) {
    const re = new RegExp("^" + rule.source.replace(/\(\.\*\)/g, ".*") + "$");
    if (!re.test(path)) continue;
    for (const h of rule.headers) if (h.key.toLowerCase() === key.toLowerCase()) value = h.value;
  }
  return value;
}

test("vercel.json: HTML e service worker sem cache; assets e conteúdo com cache curto", () => {
  const v = JSON.parse(read("vercel.json"));
  for (const p of ["/", "/index.html", "/sw.js"]) assert.equal(headerFor(v, p, "Cache-Control"), "no-cache", p);
  for (const p of ["/assets/app.js", "/assets/lib/store.js", "/content/areas.json", "/content/politica/curriculum.json"]) {
    assert.equal(headerFor(v, p, "Cache-Control"), "public, max-age=300, must-revalidate", p);
  }
  assert.equal(headerFor(v, "/qualquer", "X-Content-Type-Options"), "nosniff");
  assert.equal(v.buildCommand ?? null, null, "sem build step");
});

test(".vercelignore deixa fora do deploy o que não é site", () => {
  const ig = read(".vercelignore").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  for (const p of ["exemplos", "tests", "especificacoes", "supabase", "scripts"]) assert.ok(ig.some(l => l.replace(/^\/|\/$/g, "") === p), p);
  for (const p of ["index.html", "assets", "content", "sw.js"]) assert.ok(!ig.some(l => l.replace(/^\/|\/$/g, "") === p), p);
});

test("README tem todas as seções que a visão pede", () => {
  const md = read("README.md");
  for (const h of [
    "## Áreas",
    "## Rodar localmente",
    "## Supabase: passo a passo",
    "## Vercel: passo a passo",
    "## GitHub Actions",
    "## Formato do `curriculum.json`",
    "## Como acrescentar uma área nova",
    "## A pasta `exemplos/`",
    "## Roteiro de verificação",
    "## Limitações conhecidas"
  ]) assert.ok(md.includes(h), "falta a seção: " + h);
  assert.match(md, /\{\{ \.Token \}\}/, "template de e-mail com o código");
  assert.match(md, /service_role/, "aviso sobre a chave service_role");
});

test("tabela de áreas do README cobre o manifesto, com o status certo", () => {
  const md = read("README.md");
  const man = JSON.parse(read("content/areas.json"));
  for (const a of man.areas) {
    const row = md.split("\n").find(l => l.startsWith("|") && l.includes("`" + a.slug + "`"));
    assert.ok(row, "área ausente na tabela: " + a.slug);
    assert.ok(row.includes(a.status === "disponivel" ? "disponível" : "planejada"), "status errado para " + a.slug);
  }
});

test("passos de nova área são exatamente cinco", () => {
  const md = read("README.md");
  const sec = md.split("## Como acrescentar uma área nova")[1].split("\n## ")[0];
  const steps = sec.split("\n").filter(l => /^\d+\. /.test(l));
  assert.equal(steps.length, 5);
});

test("exemplo mínimo de tema no README é JSON válido e passa nas regras do validate", () => {
  const md = read("README.md");
  const sec = md.split("## Formato do `curriculum.json`")[1].split("\n## ")[0];
  const block = sec.split("```json")[1].split("```")[0];
  const cur = JSON.parse(block);
  const s = cur.modules[0].steps[0];
  for (const f of ["id", "title", "tagline", "tradition", "definition", "concepts", "theses", "check"]) assert.ok(s[f], f);
  assert.ok(cur.modules[0].workshop.id);
  assert.ok(existsSync(join(REPO, "scripts", "validate.mjs")));
});
