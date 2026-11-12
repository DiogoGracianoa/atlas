// S08: os materiais não podem entrar na distribuição estática.
import { existsSync, readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { inspectPublicContent } from "../../scripts/check-private-content.mjs";

it("mantém os JSONs somente na árvore privada e fora de public", () => {
  expect(existsSync("public/content")).toBe(false);
  expect(JSON.parse(readFileSync("private/content/areas.json", "utf8")).areas[0].slug).toBe("politica");
});

function publicFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? publicFiles(join(dir, e.name)) : [join(dir, e.name)]);
}

it("não incorpora currículos no código do navegador", () => {
  const files = publicFiles("src").filter(p => /\.(tsx?|json)$/.test(p));
  for (const path of files) expect(readFileSync(path, "utf8"), path).not.toContain('"theses":');
});

it("inspeciona o artefato e recusa um trecho de estudo embutido no JavaScript público", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-private-build-"));
  mkdirSync(join(root, "private/content/politica"), { recursive: true });
  mkdirSync(join(root, "dist/assets"), { recursive: true });
  const paragraph = "Explicação confidencial de um tema de estudo que não pode ser incorporada no JavaScript distribuído publicamente.";
  writeFileSync(join(root, "private/content/politica/curriculum.json"), JSON.stringify({ modules: [{ steps: [{ definition: [paragraph] }] }] }));
  writeFileSync(join(root, "dist/assets/app.js"), "const texto=" + JSON.stringify(paragraph));
  expect(inspectPublicContent(root)).toHaveLength(1);
  writeFileSync(join(root, "dist/assets/app.js"), "console.log('shell de login')");
  expect(inspectPublicContent(root)).toEqual([]);
});

it("o título impresso das áreas usa o nome do produto, Letrume (renomeação, S07)", () => {
  type A = { tituloPdf?: string; status?: string; subtemas?: A[] };
  const areas = (JSON.parse(readFileSync("private/content/areas.json", "utf8")) as { areas: A[] }).areas;
  const folhas = areas.flatMap(a => (a.subtemas?.length ? a.subtemas : [a])).filter(a => a.tituloPdf);
  expect(folhas.length).toBeGreaterThan(0);
  for (const a of folhas) expect(a.tituloPdf).toMatch(/^Letrume · /);
});
