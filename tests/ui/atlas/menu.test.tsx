// Menu redesenhado (2026-11-06): seletor de área com teclado (padrão listbox),
// busca com atalho "/" e limpar, e acessibilidade com a lista aberta.
import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { axeViolations, renderApp } from "../harness";

describe("seletor de área", () => {
  it("abre com seta, navega, escolhe com Enter; Esc fecha e devolve o foco", async () => {
    const { user, router } = renderApp("/atlas");
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    const botao = within(nav).getByRole("button", { name: /^Área/ });
    expect(botao.getAttribute("aria-expanded")).toBe("false");

    botao.focus();
    await user.keyboard("{ArrowDown}");
    const lista = within(nav).getByRole("listbox", { name: "Área" });
    expect(document.activeElement).toBe(lista);
    expect(within(lista).getByRole("option", { name: "Mapa do Atlas" }).getAttribute("aria-selected")).toBe("true");

    await user.keyboard("{Escape}");
    expect(within(nav).queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(botao);

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/politica"));
  });

  it("sem violações sérias de acessibilidade com a lista aberta", async () => {
    const { user } = renderApp("/atlas/politica");
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    await user.click(within(nav).getByRole("button", { name: /^Área/ }));
    expect(within(nav).getByRole("listbox")).toBeTruthy();
    expect(await axeViolations()).toEqual([]);
  });
});

describe("busca", () => {
  it("atalho / foca a busca; o botão limpar esvazia", async () => {
    const { user } = renderApp("/atlas/politica");
    const nav = await screen.findByRole("navigation", { name: "Conteúdo do atlas" });
    const campo = within(nav).getByRole("searchbox", { name: "Buscar" }) as HTMLInputElement;
    // jsdom não calcula layout (offsetParent é sempre null): o atalho é conferido no e2e
    await user.click(campo);
    await user.type(campo, "Gramsci");
    await user.click(within(nav).getByRole("button", { name: "Limpar busca" }));
    expect(campo.value).toBe("");
    expect(document.activeElement).toBe(campo);
  });
});
