#!/usr/bin/env node
// Limite de tamanho (RN13, AC17): soma o gzip do chunk de entrada e de todos os
// seus imports estáticos (o que o navegador baixa para a primeira tela) e
// confere que o cliente do Supabase não está entre eles.
//
//   node scripts/size-budget.mjs [--dist dist] [--limit-kb 150]
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const args = process.argv.slice(2);
const arg = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = arg("--dist", join(root, "dist"));
const limitKb = Number(arg("--limit-kb", "150"));

const manifestPath = join(dist, ".vite", "manifest.json");
if (!existsSync(manifestPath)) {
  console.error("Sem " + manifestPath + ". Rode `npm run build` antes.");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entry = Object.keys(manifest).find(k => manifest[k].isEntry);
if (!entry) { console.error("Manifesto sem chunk de entrada."); process.exit(1); }

// Fecho dos imports estáticos a partir da entrada.
const initial = new Set();
const visit = (key) => {
  if (initial.has(key) || !manifest[key]) return;
  initial.add(key);
  for (const k of manifest[key].imports ?? []) visit(k);
};
visit(entry);

const errors = [];
let total = 0;
const rows = [];
for (const key of initial) {
  const file = manifest[key].file;
  if (!file.endsWith(".js")) continue;
  const gz = gzipSync(readFileSync(join(dist, file))).length;
  total += gz;
  rows.push(`  ${file}  ${(gz / 1024).toFixed(1)} KB`);
  if (/@supabase/.test(key)) errors.push("o cliente do supabase está no carregamento inicial (" + key + ")");
}

console.log(rows.join("\n"));
console.log(`JS inicial: ${(total / 1024).toFixed(1)} KB gzip (limite ${limitKb} KB)`);
if (total > limitKb * 1024) errors.push(`JS inicial acima do limite: ${(total / 1024).toFixed(1)} KB > ${limitKb} KB`);

if (errors.length) {
  errors.forEach(e => console.error("ERRO: " + e));
  process.exit(1);
}
