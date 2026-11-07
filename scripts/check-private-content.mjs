import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function files(dir) {
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]) : [];
}

/** Verifica a saída pública efetiva, inclusive JSON, JavaScript e sourcemaps. */
export function inspectPublicContent(root = process.cwd()) {
  const dist = join(root, "dist");
  if (!existsSync(dist)) return ["Build ausente: execute npm run build."];
  const privateFiles = files(join(root, "private/content")).filter(f => f.endsWith(".json"));
  const needles = privateFiles.flatMap(file => {
    const raw = readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    return [raw.trim(), JSON.stringify(data), ...(data.modules ?? []).flatMap(m => (m.steps ?? []).flatMap(s => (s.definition ?? []).filter(p => p.length > 60)))];
  });
  const problems = [];
  for (const file of files(dist)) {
    const path = relative(dist, file).replaceAll("\\", "/");
    if (/^(content|private)\//.test(path)) { problems.push(path + ": material na saída estática"); continue; }
    if (!/\.(js|mjs|map|json|html|txt)$/.test(file)) continue;
    const body = readFileSync(file, "utf8");
    if (needles.some(text => body.includes(text) || body.includes(JSON.stringify(text).slice(1, -1)))) problems.push(path + ": texto de estudo incorporado");
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = inspectPublicContent();
  if (problems.length) { console.error(problems.join("\n")); process.exitCode = 1; }
  else console.log("Materiais ausentes da distribuição pública.");
}
