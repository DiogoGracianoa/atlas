import { test, expect } from "./fixtures";

test.describe("visitante", () => {
  test.use({ authenticated: false });
  for (const path of ["/", "/atlas", "/atlas/politica/m1e1", "/#/politica/m1e1"]) {
    test(`${path} exige login sem baixar material`, async ({ page }) => {
      const files: string[] = [];
      page.on("request", req => { if (req.url().includes("/api/conteudo")) files.push(req.url()); });
      await page.goto(path);
      await expect(page).toHaveURL(/\/entrar$/);
      await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Ajustes de leitura" })).toHaveCount(0);
      expect(files).toEqual([]);
    });
  }
});

test("downloads diretos recusam anonimato e token falso; Auth válido recebe material", async ({ request }) => {
  const endpoint = "/api/conteudo?arquivo=content%2Fpolitica%2Fcurriculum.json";
  expect((await request.get(endpoint)).status()).toBe(401);
  expect((await request.get(endpoint, { headers: { Authorization: "Bearer forged-token" } })).status()).toBe(401);
  const response = await request.get(endpoint, { headers: { Authorization: "Bearer accepted-token" } });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect((await response.json()).modules[0].steps[0].title).toBe("Poder, Estado e governo");
  for (const path of ["/content/areas.json", "/content/politica/curriculum.json", "/private/content/areas.json"]) expect((await request.get(path)).status()).toBe(404);
});

test("sair bloqueia navegação e mantém progresso", async ({ page }) => {
  await page.goto("/atlas/politica/m1e1");
  await page.getByRole("button", { name: "Marcar definição como lida" }).click();
  await page.getByRole("button", { name: /abrir conta e sincronização/ }).click();
  await page.getByRole("button", { name: "Sair deste aparelho" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("atlas-v3") ?? "{}").marks["politica/m1e1:def"].done)).toBe(true);
  await page.goto("/atlas/politica/m1e1");
  await expect(page).toHaveURL(/\/entrar$/);
});
