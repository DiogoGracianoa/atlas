// S10/S11: materiais exigem rede; a PWA guarda somente o shell técnico.
import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

async function swAtivo(page: Page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test("offline não expõe nem o material já aberto", async ({ page, context }) => {
  await page.goto("/atlas/politica/m1e1");
  await swAtivo(page);
  await expect(page.getByRole("heading", { name: "Poder, Estado e governo" })).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByRole("alert")).toContainText("conexão para acessar");
  await expect(page.getByRole("heading", { name: "Poder, Estado e governo" })).toHaveCount(0);
  await page.goto("/atlas/politica/m3e1");
  await expect(page.getByRole("alert")).toContainText("conexão para acessar");
  await context.setOffline(false);
  await expect(page.getByRole("heading", { name: "Mercadoria, valor e força de trabalho" })).toBeVisible();
});

test("API e materiais não entram nos caches da PWA", async ({ page }) => {
  await page.goto("/atlas/politica/m1e1");
  await swAtivo(page);
  await expect(page.getByRole("heading", { name: "Poder, Estado e governo" })).toBeVisible();
  const material = await page.evaluate(async () => {
    const requests = (await Promise.all((await caches.keys()).map(async key => (await caches.open(key)).keys()))).flat();
    return requests.map(r => r.url).filter(url => /\/(api|content|private)\//.test(new URL(url).pathname));
  });
  expect(material).toEqual([]);
});

test("ativar a nova versão apaga os caches públicos antigos", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()));
    for (const key of ["atlas-v1", "atlas-conteudo"]) {
      const cache = await caches.open(key);
      await cache.put("/content/politica/curriculum.json", new Response("material antigo"));
    }
  });
  expect(await page.evaluate(() => caches.has("atlas-conteudo"))).toBe(true);
  await page.reload();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(async () => !(await caches.has("atlas-v1")) && !(await caches.has("atlas-conteudo")));
});