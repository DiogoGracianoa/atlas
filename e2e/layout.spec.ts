// Cenários U04 e U02 com renderização real (RN12, AC16): sem rolagem lateral
// a 320 px no tamanho GG, campos com 16 px ou mais e axe-core com contraste
// real nos temas claro e escuro.
import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");

const paginas = ["/", "/atlas", "/atlas/politica", "/atlas/politica/m8e3", "/atlas/politica/m8of", "/entrar"];

async function prefs(page: Page, theme: "light" | "dark", size: "m" | "xl") {
  await page.addInitScript(([t, s]) => {
    localStorage.setItem("atlas-v3", JSON.stringify({ v: 3, marks: {}, notes: {}, lastAt: null, resetAt: null, totals: {}, size: s, theme: t }));
  }, [theme, size]);
}

async function abrir(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe("320 px, texto GG (U04)", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of paginas) {
    test(`${path}: sem rolagem lateral e campos ≥ 16 px`, async ({ page }) => {
      await prefs(page, "light", "xl");
      await abrir(page, path);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw, `largura do conteúdo em ${path}`).toBeLessThanOrEqual(cw);
      const pequenos = await page.evaluate(() =>
        [...document.querySelectorAll("input, textarea, select")]
          .filter(el => (el as HTMLElement).offsetParent !== null)
          .map(el => parseFloat(getComputedStyle(el).fontSize))
          .filter(px => px < 16));
      expect(pequenos).toEqual([]);
    });
  }

  test("menu em gaveta abre, cabe na tela e fecha com Esc", async ({ page }) => {
    await prefs(page, "light", "xl");
    await abrir(page, "/atlas/politica/m1e1");
    await page.getByRole("button", { name: "Política, economia e marxismo" }).click();
    const gaveta = page.getByRole("dialog", { name: "Política, economia e marxismo" });
    await expect(gaveta).toBeVisible();
    const box = await gaveta.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(320);
    await page.keyboard.press("Escape");
    await expect(gaveta).toBeHidden();
    await expect(page.getByRole("button", { name: "Política, economia e marxismo" })).toBeFocused();
  });
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`axe com contraste real, tema ${theme === "light" ? "claro" : "escuro"} (U02)`, () => {
    for (const path of paginas) {
      test(path, async ({ page }) => {
        await prefs(page, theme, "m");
        await abrir(page, path);
        await page.addScriptTag({ path: AXE });
        const violations = await page.evaluate(async () => {
          // @ts-expect-error axe é injetado na página
          const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
          return (r.violations as { id: string; impact: string; nodes: { target: string[] }[] }[])
            .filter(v => v.impact === "serious" || v.impact === "critical")
            .map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`);
        });
        expect(violations).toEqual([]);
      });
    }
  });
}
