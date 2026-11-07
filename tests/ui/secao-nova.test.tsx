// Cenário R06 (RN08, AC11): seção nova entra só com os próprios arquivos e
// uma entrada no registro. Shell, armazenamento e sincronização são os reais.
import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { sections } from "../../src/sections/registry";
import { secaoTeste } from "../fixtures/secao-teste";
import { renderApp } from "./harness";

const registro = [...sections, secaoTeste];

describe("seção nova (KS1)", () => {
  it("aparece no portal com o cartão próprio", async () => {
    renderApp("/", { sections: registro });
    const lista = await screen.findByRole("list", { name: "Seções" });
    const link = within(lista).getByRole("link", { name: /Seção de teste/ });
    expect(link.getAttribute("href")).toBe("/teste");
    expect(within(link).getByText("Conteúdo extra do cartão de teste")).toBeTruthy();
  });

  it("a rota da seção responde e usa o armazenamento real", async () => {
    const { user } = renderApp("/", { sections: registro });
    await user.click(await screen.findByRole("link", { name: /Seção de teste/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Seção de teste" })).toBeTruthy();
    expect(screen.getByText("Tema atual: auto")).toBeTruthy();
  });

  it("o registro padrão não muda: atlas e dossiês", () => {
    expect(sections.map(s => s.slug)).toEqual(["atlas", "dossies"]);
    expect(new Set(sections.map(s => s.slug)).size).toBe(sections.length);
  });
});
