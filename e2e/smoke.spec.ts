// Fumaça da E1: o build de produção servido por `vite preview` abre no navegador.
import { expect, test } from "@playwright/test";

test("o build abre na raiz", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Atlas" })).toBeVisible();
});

test("o conteúdo é servido em /content", async ({ request }) => {
  const res = await request.get("/content/areas.json");
  expect(res.status()).toBe(200);
  const man = (await res.json()) as { areas: { slug: string }[] };
  expect(man.areas.some((a) => a.slug === "politica")).toBe(true);
});
