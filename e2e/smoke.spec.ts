// Fumaça da E1: o build de produção servido por `vite preview` abre no navegador.
import { expect, test } from "./fixtures";

test("o build abre na raiz", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Atlas" })).toBeVisible();
});

test("o conteúdo estático foi retirado da distribuição pública", async ({ request }) => {
  const res = await request.get("/content/areas.json");
  expect(res.status()).toBe(404);
});
