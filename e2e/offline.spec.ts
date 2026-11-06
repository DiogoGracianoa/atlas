// Cenários O01–O03 (RN06, RN10, AC09; KW1): funcionamento offline com o
// service worker do build de produção.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

async function swAtivo(page: Page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // Recarrega para a página passar a ser controlada pelo service worker e as
  // buscas de conteúdo entrarem no cache.
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test("depois da primeira visita, abre e marca um tema offline (O01)", async ({ page, context }) => {
  await page.goto("/atlas/politica");
  await swAtivo(page);
  await expect(page.getByRole("heading", { level: 1, name: "Atlas de política, economia e marxismo" })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/atlas/politica/m3e1");
  await expect(page.getByRole("heading", { level: 1, name: "Mercadoria, valor e força de trabalho" })).toBeVisible();
  await page.getByRole("button", { name: "Marcar definição como lida" }).click();
  await expect(page.getByRole("button", { name: "Definição lida" })).toBeVisible();
  const done = await page.evaluate(() => JSON.parse(localStorage.getItem("atlas-v3") ?? "{}").marks["politica/m3e1:def"].done);
  expect(done).toBe(true);
  await context.setOffline(false);
});

test("área nunca aberta, offline: aviso de conexão e menu navegável (O02)", async ({ page, context }) => {
  // Manifesto com uma segunda área disponível, que nunca será aberta online.
  const man = JSON.parse(readFileSync("public/content/areas.json", "utf8")) as { areas: Record<string, unknown>[] };
  const politica = man.areas.find(a => a.slug === "politica")!;
  man.areas.push({ ...politica, slug: "teste", nome: "Área de teste", arquivo: "content/teste/curriculum.json" });
  await context.route("**/content/areas.json", route => route.fulfill({ json: man }));

  await page.goto("/atlas");
  await swAtivo(page);
  await expect(page.getByRole("heading", { level: 1, name: "Mapa do Atlas" })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/atlas/teste");
  await expect(page.getByText("Esta área precisa de conexão na primeira abertura.")).toBeVisible();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.getByRole("link", { name: /Política, economia e marxismo/ }).first()).toBeVisible();
  await context.setOffline(false);
});

test("o cache do service worker antigo (atlas-v1) é apagado (O03)", async ({ page }) => {
  // A instalação baixa todo o precache antes de ativar; sob carga (suíte em
  // paralelo) isso passa dos 30 s padrão.
  test.setTimeout(90_000);
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    const c = await caches.open("atlas-v1");
    await c.put("/velho", new Response("site antigo"));
  });
  expect(await page.evaluate(() => caches.has("atlas-v1"))).toBe(true);
  await page.reload();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(async () => !(await caches.has("atlas-v1")));
});
