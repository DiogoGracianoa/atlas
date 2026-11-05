#!/usr/bin/env node
// Busca de segredos (RN17, AC21): procura no repositório versionado e no
// build (dist/) por chaves que nunca podem aparecer no front:
//   - JWT do Supabase com papel service_role;
//   - chave secreta nova (sb_secret_...);
//   - variável SERVICE_ROLE / SECRET preenchida.
// Mencionar "service_role" em texto (avisos) é permitido. Nunca imprime o
// valor encontrado, só o arquivo e a linha.
//
//   node scripts/check-secrets.mjs [--root .]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const i = args.indexOf("--root");
const root = i >= 0 ? args[i + 1] : join(dirname(fileURLToPath(import.meta.url)), "..");

const SKIP = new Set(["node_modules", ".git", "exemplos", "playwright-report", "test-results"]);
const TEXT = /\.(js|mjs|cjs|ts|tsx|json|html|css|md|yml|yaml|sql|sh|txt|example|env|webmanifest)$|^\.env/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.test(name)) out.push(p);
  }
  return out;
}

// Arquivos versionados (quando é um repositório git) + dist/ (build).
function files() {
  let list;
  try {
    list = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\0").filter(Boolean).map(f => join(root, f)).filter(f => TEXT.test(f.split(/[\\/]/).pop()));
  } catch { list = null; }
  if (!list || !list.length) return walk(root);
  const dist = join(root, "dist");
  return existsSync(dist) ? [...list, ...walk(dist)] : list;
}

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{20,}/g;
const SB_SECRET = /sb_secret_[A-Za-z0-9_-]{10,}/;
const ENV_SECRET = /^\s*[A-Z0-9_]*(SERVICE_ROLE|SECRET)[A-Z0-9_]*\s*[=:]\s*["']?[^\s"'#]{6,}/;

function payloadRole(b64) {
  try { return JSON.parse(Buffer.from(b64, "base64url").toString("utf8")).role; } catch { return null; }
}

const found = [];
for (const f of files()) {
  if (!existsSync(f)) continue;
  const rel = relative(root, f).split(sep).join("/");
  if (rel === "scripts/check-secrets.mjs" || rel.startsWith("tests/")) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, n) => {
    for (const m of line.matchAll(JWT)) if (payloadRole(m[1]) === "service_role") found.push(`${rel}:${n + 1}: JWT com papel service_role`);
    if (SB_SECRET.test(line)) found.push(`${rel}:${n + 1}: chave sb_secret_`);
    if (ENV_SECRET.test(line)) found.push(`${rel}:${n + 1}: variável de segredo preenchida`);
  });
}

if (found.length) {
  console.error("Segredos encontrados (" + found.length + "):");
  found.forEach(f => console.error("  - " + f));
  process.exit(1);
}
console.log("Nenhum segredo encontrado.");
