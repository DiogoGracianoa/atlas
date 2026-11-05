// Cenários P06–P10: tema, tutor, anotações, anterior/próximo e oficina.
import { describe, expect, it } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import { axeViolations, renderApp } from "../harness";

describe("tema (P06)", () => {
  it("mostra todas as seções do JSON e alterna as marcações, que persistem", async () => {
    const { user, services, storage } = renderApp("/atlas/politica/m8e3");
    await screen.findByRole("heading", { level: 1, name: /Marx: dívida pública/ });
    for (const t of ["A definição", "Conceitos-chave", "As teses centrais", "Agora assista", "Depois leia", "Críticas e debates", "Verifique se entendeu", "Estude com a IA"]) {
      expect(screen.getByRole("heading", { level: 2, name: t })).toBeTruthy();
    }
    expect(screen.getByText("Capital fictício")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Encontrar edição/ }).getAttribute("href")).toMatch(/^https:\/\/books\.google\.com\//);

    const def = screen.getByRole("button", { name: "Marcar definição como lida" });
    await user.click(def);
    expect(screen.getByRole("button", { name: "Definição lida" }).getAttribute("aria-pressed")).toBe("true");
    expect(services.store.isDone("politica/m8e3", "def")).toBe(true);
    expect(JSON.parse(storage.getItem("atlas-v3")!).marks["politica/m8e3:def"].done).toBe(true);
    expect(await screen.findByText("Marcado como concluído.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Definição lida" }));
    expect(services.store.isDone("politica/m8e3", "def")).toBe(false);
  });

  it("tema sem livro mostra a ponte", async () => {
    renderApp("/atlas/politica/m5e3");
    await screen.findByRole("heading", { level: 1, name: "Orçamento, tributos e dívida pública" });
    expect(screen.getByText("Sobre o livro desta etapa")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Marcar livro/ })).toBeNull();
  });

  it("guarda a posição para o atalho de continuar", async () => {
    const { services } = renderApp("/atlas/politica/m2e1");
    await screen.findByRole("heading", { level: 1 });
    expect(services.store.state.lastAt?.route).toBe("politica/m2e1");
  });

  it("sem violações sérias de acessibilidade", async () => {
    renderApp("/atlas/politica/m8e3");
    await screen.findByRole("heading", { level: 1, name: /Marx: dívida pública/ });
    expect(await axeViolations()).toEqual([]);
  });
});

describe("tutor por IA (P07)", () => {
  it("copia o prompt da área + tema e oferece Claude e ChatGPT", async () => {
    // o user-event instala uma área de transferência falsa em navigator.clipboard
    const { user } = renderApp("/atlas/politica/m8e3");
    await screen.findByRole("heading", { level: 1, name: /Marx: dívida pública/ });
    await user.click(screen.getByRole("button", { name: "Copiar atividade" }));
    const texto = await navigator.clipboard.readText();
    expect(texto.startsWith("Você é meu tutor socrático")).toBe(true);
    expect(texto).toContain("TEMA: Marx: dívida pública, impostos e capital fictício — ");
    expect(texto).toContain("TRADIÇÃO: Marxismo");
    expect(texto).toContain("LIVRO: Para entender O capital: Livros II e III, de David Harvey");
    expect(await screen.findByText("Atividade copiada. Cole no chat da IA.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Claude/ }).getAttribute("href")).toBe("https://claude.ai/new");
    expect(screen.getByRole("link", { name: /ChatGPT/ }).getAttribute("href")).toBe("https://chatgpt.com/");
  });
});

describe("anotações (P08)", () => {
  it("cada tecla grava; atualização remota entra no campo em uso sem tirar o foco", async () => {
    const { user, services } = renderApp("/atlas/politica/m1e1");
    const campo = await screen.findByRole("textbox", { name: "Suas anotações" }) as HTMLTextAreaElement;
    await user.click(campo);
    await user.type(campo, "abc");
    expect(services.store.note("politica/m1e1")).toBe("abc");
    expect(screen.getByText("3 caracteres")).toBeTruthy();

    // Cada tecla já está salva: o campo não guarda nada pendente, então a
    // versão mesclada (aqui, a remota) pode entrar sem perder texto.
    act(() => {
      services.store.applyOps([{ type: "note", key: "politica/m1e1", value: { body: "remoto", at: "2030-01-01T00:00:00.000Z" } }], { silent: true });
    });
    expect(document.activeElement).toBe(campo);
    expect(campo.value).toBe("remoto");
  });

  it("continuar digitando depois de uma atualização remota não apaga a versão remota (achado da revisão)", async () => {
    const { user, services } = renderApp("/atlas/politica/m1e1");
    const campo = await screen.findByRole("textbox", { name: "Suas anotações" }) as HTMLTextAreaElement;
    await user.click(campo);
    await user.type(campo, "local");
    act(() => {
      services.store.applyOps([{ type: "note", key: "politica/m1e1", value: { body: "local\n\n— versão de outro aparelho —\nremoto", at: "2030-01-01T00:00:00.000Z" } }], { silent: true });
    });
    await user.type(campo, "!");
    expect(services.store.note("politica/m1e1")).toContain("remoto");
    expect(services.store.note("politica/m1e1").endsWith("!")).toBe(true);
  });

  it("sem foco, a atualização remota aparece na hora", async () => {
    const { services } = renderApp("/atlas/politica/m1e1");
    const campo = await screen.findByRole("textbox", { name: "Suas anotações" }) as HTMLTextAreaElement;
    act(() => {
      services.store.applyOps([{ type: "note", key: "politica/m1e1", value: { body: "de outro aparelho", at: "2030-01-01T00:00:00.000Z" } }], { silent: true });
    });
    expect(campo.value).toBe("de outro aparelho");
  });
});

describe("anterior e próximo (P09)", () => {
  it("atravessa módulos na ordem do currículo", async () => {
    const { user, router } = renderApp("/atlas/politica/m1of");
    await screen.findByRole("heading", { level: 1, name: "Oficina do módulo 1" });
    const pager = screen.getByRole("navigation", { name: "Navegação entre itens" });
    expect(pager.textContent).toContain("Ideologia");
    await user.click(screen.getByRole("link", { name: /Próximo/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/politica/m2e1"));
  });

  it("primeiro item não tem anterior", async () => {
    renderApp("/atlas/politica/m1e1");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Começo do roteiro")).toBeTruthy();
  });
});

describe("oficina (P10)", () => {
  it("proposta, exercício, entrega, metas e marcação feito", async () => {
    const { user, services } = renderApp("/atlas/politica/m8of");
    expect(await screen.findByRole("heading", { level: 1, name: "Oficina do módulo 8" })).toBeTruthy();
    expect(screen.getByText(/Ler o ajuste fiscal em curso/)).toBeTruthy();
    expect(screen.getByText("Entrega")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Ao fechar este módulo você deve conseguir" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Marcar oficina como concluída" }));
    expect(services.store.isDone("politica/m8of", "do")).toBe(true);
  });
});
