// Diagramas nos temas: renderização sob demanda (Mermaid falso no jsdom) e
// alternativa quando o módulo não carrega (offline na primeira vez).
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const renderMock = vi.fn(async (_id: string, code: string) => ({ svg: `<svg data-teste="ok"><text>${code.length}</text></svg>` }));
let falhar = false;
vi.mock("mermaid", () => ({
  get default() {
    if (falhar) throw new Error("Failed to fetch dynamically imported module");
    return { initialize: vi.fn(), render: renderMock };
  },
}));

import { Diagrama } from "../../src/sections/atlas/components/Diagrama";

afterEach(() => { falhar = false; renderMock.mockClear(); });

describe("Diagrama", () => {
  it("renderiza o SVG com legenda e nome acessível", async () => {
    render(<Diagrama code={"flowchart LR\n  A --> B"} caption="Fluxo de A para B." />);
    const fig = screen.getByRole("figure", { name: "Fluxo de A para B." });
    await vi.waitFor(() => expect(fig.querySelector('svg[data-teste="ok"]')).toBeTruthy());
    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  it("sem o módulo (offline na primeira vez), mostra aviso e o texto do diagrama", async () => {
    falhar = true;
    render(<Diagrama code={"flowchart LR\n  A --> B"} caption="Fluxo de A para B." />);
    expect(await screen.findByText("O diagrama precisa de conexão na primeira vez.")).toBeTruthy();
    expect(screen.getByText(/A --> B/)).toBeTruthy();
  });
});
