// Cenários U02 e U03: componentes base acessíveis e operáveis pelo teclado.
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Button, Card, IconButton, Progress, Segmented, Tag } from "../../src/ui/primitives";
import { Sheet } from "../../src/ui/Sheet";
import { axeViolations } from "./harness";

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir ajustes</Button>
      <Sheet open={open} title="Ajustes" onClose={() => setOpen(false)}>
        <Button>Primeira ação</Button>
        <Button>Segunda ação</Button>
      </Sheet>
    </>
  );
}

describe("kit de interface", () => {
  it("Sheet: abre com foco dentro, prende o Tab, fecha com Esc e devolve o foco", async () => {
    const user = userEvent.setup();
    render(<SheetDemo />);
    const abrir = screen.getByRole("button", { name: "Abrir ajustes" });
    await user.click(abrir);
    const dialog = screen.getByRole("dialog", { name: "Ajustes" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fechar" }));
    await user.tab(); await user.tab();
    expect(document.activeElement?.textContent).toBe("Segunda ação");
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fechar" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(abrir);
  });

  it("Sheet: é renderizado no <body>, fora de ancestrais que criam contexto (cabeçalho com backdrop-filter)", async () => {
    const user = userEvent.setup();
    render(<header><SheetDemo /></header>);
    await user.click(screen.getByRole("button", { name: "Abrir ajustes" }));
    const dialog = screen.getByRole("dialog", { name: "Ajustes" });
    expect(dialog.closest("header")).toBeNull();
  });

  it("Segmented: um botão pressionado por vez", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [v, setV] = useState<"a" | "b">("a");
      return <Segmented label="Tema" value={v} onChange={setV} options={[{ value: "a", label: "Claro" }, { value: "b", label: "Escuro" }]} />;
    }
    render(<Demo />);
    const grupo = screen.getByRole("group", { name: "Tema" });
    expect(grupo).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Escuro" }));
    expect(screen.getByRole("button", { name: "Escuro" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Claro" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("componentes base sem violações sérias de acessibilidade", async () => {
    render(
      <MemoryRouter>
        <Button variant="primary">Salvar</Button>
        <IconButton label="Abrir menu"><svg viewBox="0 0 24 24" aria-hidden="true" /></IconButton>
        <Card to="/x" labelledBy="t"><h2 id="t">Cartão</h2></Card>
        <Tag dot color="#A4213A">Marxismo</Tag>
        <Progress value={3} max={10} label="Progresso" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("progressbar", { name: "Progresso" }).getAttribute("aria-valuetext")).toBe("30%");
    expect(await axeViolations()).toEqual([]);
  });
});
