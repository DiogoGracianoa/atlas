// Todo diagrama do conteúdo desenha de verdade no navegador (Mermaid real):
// pega erro de sintaxe que o validate não vê.
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Curriculum, Manifest } from "../src/core/types";

const man = JSON.parse(readFileSync("public/content/areas.json", "utf8")) as Manifest;
const folhas = man.areas.flatMap(a => (a.subtemas?.length ? a.subtemas.map(s => ({ s, pai: a.slug as string | null })) : [{ s: a, pai: null }]))
  .filter(x => x.s.status === "disponivel" && x.s.arquivo);

const casos = folhas.flatMap(({ s, pai }) => {
  const cur = JSON.parse(readFileSync("public/" + s.arquivo, "utf8")) as Curriculum;
  return cur.modules.flatMap(m => m.steps).filter(t => t.diagram)
    .map(t => ({ path: `/atlas/${pai ? pai + "/" : ""}${s.slug}/${t.id}`, caption: t.diagram!.caption }));
});

test.describe.configure({ mode: "parallel" });

for (const c of casos) {
  test(`diagrama em ${c.path}`, async ({ page }) => {
    await page.goto(c.path);
    const fig = page.getByRole("figure", { name: c.caption });
    await expect(fig.locator("svg[role=img]")).toBeVisible({ timeout: 15000 });
    await expect(fig.getByText("Não foi possível desenhar este diagrama.")).toHaveCount(0);
  });
}

test("há diagramas para testar", () => {
  expect(casos.length).toBeGreaterThan(0);
});
