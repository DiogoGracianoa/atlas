// Cenários R01, R03, R04 e R08 contra o build de produção.
import { expect, test } from "@playwright/test";

const paginas: [string, string][] = [
  ["/", "Atlas"],
  ["/atlas", "Mapa do Atlas"],
  ["/atlas/politica", "Atlas de política, economia e marxismo"],
  ["/atlas/politica/m8e3", "Marx: dívida pública, impostos e capital fictício"],
];

test("rotas limpas abrem a página certa com status 200 (R01, AC05)", async ({ page }) => {
  for (const [path, titulo] of paginas) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
  }
});

test("recarregar mantém a página, sem 404 (R04, AC08)", async ({ page }) => {
  await page.goto("/atlas/politica/m1e1");
  await expect(page.getByRole("heading", { level: 1, name: "Poder, Estado e governo" })).toBeVisible();
  const res = await page.reload();
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Poder, Estado e governo" })).toBeVisible();
});

const antigos: [string, string][] = [
  ["/#/politica/m1e1", "/atlas/politica/m1e1"],
  ["/#m1e1", "/atlas/politica/m1e1"],
  ["/#inicio", "/atlas/politica"],
  ["/#/politica", "/atlas/politica"],
  ["/#/", "/atlas"],
];

for (const [antigo, novo] of antigos) {
  test(`link antigo ${antigo} vira ${novo} sem entrada extra no histórico (R03, AC07)`, async ({ browser }) => {
    const controle = await browser.newPage();
    await controle.goto(novo);
    const esperado = await controle.evaluate(() => history.length);
    await controle.close();

    const page = await browser.newPage();
    await page.goto(antigo);
    await expect(page).toHaveURL(new RegExp(novo.replace(/\//g, "\\/") + "$"));
    expect(await page.evaluate(() => history.length)).toBe(esperado);
    await page.close();
  });
}

test("trocar de item vai ao topo; voltar restaura a posição (R08)", async ({ page }) => {
  await page.goto("/atlas/politica/m1e1");
  await expect(page.getByRole("heading", { level: 1, name: "Poder, Estado e governo" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForFunction(() => window.scrollY > 1000);
  const antes = await page.evaluate(() => window.scrollY);
  // clique sem rolar até o link (o Playwright rolaria e mudaria a posição salva)
  await page.evaluate(() => (document.querySelector('a[rel="next"]') as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/\/atlas\/politica\/m1e2$/);
  await page.waitForFunction(() => window.scrollY === 0);
  await page.goBack();
  await expect(page).toHaveURL(/\/atlas\/politica\/m1e1$/);
  await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 5, antes);
});
