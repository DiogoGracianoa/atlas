#!/usr/bin/env node
// Valida o conteúdo do Atlas. Node puro, sem dependências.
//
//   node scripts/validate.mjs [--root <diretório>]
//
// Para cada área do manifesto (public/content/areas.json) confere: arquivo existe,
// IDs únicos dentro da área, campos obrigatórios em cada tema, toda URL com
// https://, todo tema sem `book` com `bridge`, e tradição declarada no
// manifesto. Também garante que o código do site não referencia exemplos/.
// Sai com código 1 se algo falhar.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const rootArg = args.indexOf("--root");
const ROOT = rootArg >= 0 ? args[rootArg + 1] : join(dirname(fileURLToPath(import.meta.url)), "..");

const STEP_REQUIRED = ["id", "title", "tagline", "tradition", "definition", "concepts", "theses", "check"];
const WORKSHOP_REQUIRED = ["id", "title", "brief", "exercise", "deliverable"];
const AREA_REQUIRED = ["arquivo", "titulo", "subtitulo", "tituloPdf", "capa", "tradicoes", "promptBase"];
const STATUS = ["disponivel", "planejado"];
const COLOR = /^#[0-9A-Fa-f]{6}$/;

const errors = [];
const err = (where, msg) => errors.push(where + ": " + msg);
const present = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

// O conteúdo é servido em /content/... a partir de public/; os caminhos do
// manifesto (campo arquivo) são relativos a public/.
function readJSON(rel, where) {
  const p = join(ROOT, "public", rel);
  if (!existsSync(p)) { err(where, "arquivo não encontrado: " + rel); return null; }
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch (e) { err(where, "JSON inválido em " + rel + " (" + e.message + ")"); return null; }
}

// Percorre qualquer valor procurando URLs: chaves "url" e strings com esquema.
function checkUrls(value, where) {
  const walk = (v, key) => {
    if (typeof v === "string") {
      if (key === "url" && !v.startsWith("https://")) err(where, "URL sem https://: " + v);
      else if (key !== "url" && /^[a-z][a-z0-9+.-]*:\/\//i.test(v) && !v.startsWith("https://")) err(where, "URL sem https://: " + v);
    } else if (Array.isArray(v)) v.forEach(x => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(value, null);
}

function validateArea(area) {
  const slug = area.slug;
  for (const f of AREA_REQUIRED) if (!present(area[f])) err(slug, "campo obrigatório no manifesto: " + f);
  const trad = area.tradicoes && typeof area.tradicoes === "object" ? area.tradicoes : {};
  if (area.tradicoes && !Object.keys(trad).length) err(slug, "campo obrigatório no manifesto: tradicoes");
  for (const [k, t] of Object.entries(trad)) {
    if (!t || !present(t.nome)) err(slug, "tradição sem nome: " + k);
    if (!t || !COLOR.test(t.cor || "")) err(slug, "tradição com cor inválida (#RRGGBB): " + k);
    if (!t || !COLOR.test(t.corEscura || "")) err(slug, "tradição com corEscura inválida (#RRGGBB): " + k);
  }
  if (!present(area.arquivo)) return;

  const data = readJSON(area.arquivo, slug);
  if (!data) return;
  if (!Array.isArray(data.modules) || !data.modules.length) { err(slug, "currículo sem modules"); return; }

  const seen = new Set();
  const useId = (id, where) => {
    if (!present(id)) return;
    if (seen.has(id)) err(where, "id repetido");
    seen.add(id);
  };
  data.modules.forEach((m, mi) => {
    const mw = slug + "/" + (m && m.id ? m.id : "módulo " + (mi + 1));
    if (!m || typeof m !== "object") { err(mw, "módulo inválido"); return; }
    useId(m.id, mw);
    if (!Array.isArray(m.steps) || !m.steps.length) err(mw, "módulo sem steps");
    (m.steps || []).forEach((s, si) => {
      const w = slug + "/" + (s && present(s.id) ? s.id : m.id + " tema " + (si + 1));
      if (!s || typeof s !== "object") { err(w, "tema inválido"); return; }
      for (const f of STEP_REQUIRED) if (!present(s[f])) err(w, "campo obrigatório ausente: " + f);
      useId(s.id, w);
      if (!s.book && !present(s.bridge)) err(w, "sem book e sem bridge");
      if (present(s.tradition) && !Object.prototype.hasOwnProperty.call(trad, s.tradition)) err(w, "tradição sem entrada em areas.json: " + s.tradition);
      checkUrls(s, w);
    });
    const ws = m.workshop;
    const ww = slug + "/" + (ws && present(ws.id) ? ws.id : m.id + " oficina");
    if (!ws || typeof ws !== "object") err(ww, "módulo sem workshop");
    else {
      for (const f of WORKSHOP_REQUIRED) if (!present(ws[f])) err(ww, "campo obrigatório ausente: " + f);
      useId(ws.id, ww);
      checkUrls(ws, ww);
    }
  });
  return data;
}

// Regra do Adendo 2: o site nunca lê exemplos/ em runtime.
function checkRuntimeIsolation() {
  const targets = ["index.html", "vercel.json", "vite.config.ts", "src", "public"];
  const files = [];
  const walk = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) readdirSync(p).forEach(n => walk(join(p, n)));
    else if (/\.(html|js|mjs|ts|tsx|css|json)$/.test(p)) files.push(p);
  };
  targets.forEach(t => walk(join(ROOT, t)));
  for (const f of files) {
    if (readFileSync(f, "utf8").includes("exemplos/")) err(relative(ROOT, f).split(sep).join("/"), "referência a exemplos/");
  }
}

const man = readJSON("content/areas.json", "areas.json");
let count = 0;
if (man) {
  if (!Array.isArray(man.areas) || !man.areas.length) err("areas.json", "lista areas ausente ou vazia");
  // Slugs são únicos em todo o manifesto: áreas e subtemas (K1 v2).
  const slugs = new Set();
  const entry = (area, where) => {
    const slug = area && area.slug;
    if (!area || typeof area !== "object" || !/^[a-z0-9-]+$/.test(slug || "")) { err(where, "área com slug inválido: " + JSON.stringify(slug)); return null; }
    if (slugs.has(slug)) err(slug, "slug repetido");
    slugs.add(slug);
    if (!present(area.nome)) err(slug, "campo obrigatório no manifesto: nome");
    if (!STATUS.includes(area.status)) { err(slug, "status inválido: " + area.status); return null; }
    return slug;
  };
  for (const area of man.areas || []) {
    const slug = entry(area, "areas.json");
    if (!slug) continue;
    if (Array.isArray(area.subtemas)) {
      // Agrupador: sem currículo próprio; cada subtema é validado como uma área.
      if (!area.subtemas.length) err(slug, "agrupador sem subtemas");
      for (const campo of ["arquivo", "tradicoes", "promptBase"]) if (present(area[campo])) err(slug, "agrupador não pode ter " + campo);
      let disponiveis = 0;
      for (const sub of area.subtemas) {
        if (sub && Array.isArray(sub.subtemas)) err(slug, "subtema não pode ter subtemas: " + sub.slug);
        const s = entry(sub, slug);
        if (s && sub.status === "disponivel") { validateArea(sub); count++; disponiveis++; }
      }
      if (area.status === "disponivel" && !disponiveis) err(slug, "agrupador disponível sem subtema disponível");
      continue;
    }
    if (area.status === "disponivel") { validateArea(area); count++; }
  }
}
checkRuntimeIsolation();

if (errors.length) {
  console.error("Conteúdo inválido (" + errors.length + " problema" + (errors.length > 1 ? "s" : "") + "):");
  errors.forEach(e => console.error("  - " + e));
  process.exit(1);
}
console.log("Conteúdo válido: " + count + " área(s) disponível(is) conferida(s).");
