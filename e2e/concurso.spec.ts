// Preparatório de concurso no build de produção (S49): do mapa ao tópico,
// com o programa real de Contagem 2027 servido pela função autenticada.
import { expect, test } from "./fixtures";

test("mapa → Concursos → Contagem 2027 → trilha → tópico → painel", async ({ page }) => {
  await page.goto("/atlas");
  await page.getByRole("list", { name: "Áreas" }).getByRole("link", { name: /Concursos/ }).click();
  await expect(page).toHaveURL(/\/atlas\/concursos$/);
  await page.getByRole("list", { name: "Subtemas" }).getByRole("link", { name: /Contagem\/MG 2027/ }).click();
  await expect(page).toHaveURL(/\/atlas\/concursos\/contagem-2027$/);
  await expect(page.getByRole("heading", { level: 1, name: "Preparatório Contagem/MG 2027" })).toBeVisible();
  await expect(page.getByText(/data prevista no edital \(item 9\.2\.1\), sujeita a retificação/)).toBeVisible();
  await expect(page.getByText("45 questões objetivas")).toBeVisible();
  await expect(page.getByText("1 tópico pendente de conferência com o edital")).toBeVisible();

  await page.getByRole("navigation", { name: "Preparatório" }).getByRole("link", { name: "Trilha" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "10 semanas" })).toBeVisible();
  await page.getByRole("link", { name: "Endereçamento IP, máscaras e sub-redes" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Endereçamento IP, máscaras e sub-redes" })).toBeVisible();
  await expect(page.getByText(/Anexo IV – Conteúdos Programáticos, Retificação nº 02, de 09\/11\/2026 · p\. 5/)).toBeVisible();
  // publicado na leva 2: teoria e questões
  await expect(page.getByRole("heading", { name: "Explicação" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Resolver questões" })).toBeVisible();

  await page.getByRole("button", { name: "Leitura concluída" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Leitura concluída" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("navigation", { name: "Preparatório" }).getByRole("link", { name: "Painel" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Meu desempenho" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Taxa de acertos" }).getByText("Sem dados").first()).toBeVisible();
});

test("rota de concurso desconhecida volta ao agrupador; página desconhecida volta à capa", async ({ page }) => {
  await page.goto("/atlas/concursos/nao-existe");
  await expect(page).toHaveURL(/\/atlas\/concursos$/);
  await page.goto("/atlas/concursos/contagem-2027/xyz");
  await expect(page).toHaveURL(/\/atlas\/concursos\/contagem-2027$/);
});
