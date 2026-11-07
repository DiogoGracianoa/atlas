// Utilitários dos testes de scripts (portados de tests/app/helpers.mjs).
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { curriculum, manifest, REPO } from "../core/helpers";

export { curriculum, manifest, REPO, step } from "../core/helpers";

// Escreve um Atlas em diretório temporário. `files` permite sobrescrever ou
// omitir arquivos (valor null = não escrever).
export function writeAtlas({ man = manifest() as unknown, cur = curriculum() as unknown, files = {} as Record<string, string | null> } = {}): string {
  const root = mkdtempSync(join(tmpdir(), "atlas-"));
  const all = {
    "content/areas.json": JSON.stringify(man, null, 2),
    "content/teste/curriculum.json": JSON.stringify(cur),
    ...files
  };
  for (const [rel, body] of Object.entries(all)) {
    if (body === null) continue;
    // Conteúdo fica em private/; o resto, na raiz.
    const p = join(root, rel.startsWith("content/") ? join("private", rel) : rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  return root;
}

export function runValidate(root: string): { code: number | null; out: string } {
  const r = spawnSync(process.execPath, [join(REPO, "scripts", "validate.mjs"), "--root", root], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
