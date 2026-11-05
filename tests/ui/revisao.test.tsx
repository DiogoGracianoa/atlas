// Achados da revisão independente (especificacoes/portal-react/revisao.md):
// importação com plano atualizado, IDs com nome de propriedade do Object e
// cores de tradição validadas antes de ir para o CSS.
import { describe, expect, it } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { traditionCss } from "../../src/sections/atlas/model";
import type { AreaMeta } from "../../src/core/types";
import { memoryStorage, renderApp } from "./harness";

const ferramentas = () => screen.getAllByText("Seu progresso")[0]!.parentElement!;

describe("importação usa o estado do momento da confirmação", () => {
  it("uma mudança chegada com o diálogo aberto não é sobrescrita", async () => {
    const at = "2026-11-05T10:00:00.000Z";
    const estado = { v: 3, marks: {}, notes: { "politica/m1e1": { body: "local", at, base: null } }, lastAt: null, resetAt: null, totals: {}, size: "m", theme: "auto" };
    const { user, services } = renderApp("/atlas", { storage: memoryStorage({ "atlas-v3": JSON.stringify(estado) }) });
    await screen.findByRole("heading", { level: 1, name: "Mapa do Atlas" });
    const backup = { version: 3, marks: {}, notes: { "politica/m1e1": { body: "do backup", at: "2026-11-05T11:00:00.000Z" } } };
    fireEvent.change(within(ferramentas()).getByLabelText("Arquivo de backup"), { target: { files: [new File([JSON.stringify(backup)], "b.json")] } });
    const dialogo = await screen.findByRole("dialog", { name: "Importar backup" });
    // chega uma versão remota mais nova enquanto o diálogo está aberto
    act(() => {
      services.store.applyOps([{ type: "note", key: "politica/m1e1", value: { body: "remota nova", at: "2026-11-05T12:00:00.000Z" } }], { silent: true });
    });
    await user.click(within(dialogo).getByRole("button", { name: "Mesclar" }));
    expect(services.store.note("politica/m1e1")).toBe("remota nova");
  });
});

describe("IDs com nome de propriedade do Object", () => {
  it.each(["constructor", "__proto__", "toString"])("/atlas/politica/%s volta à capa", async (id) => {
    const { router } = renderApp("/atlas/politica/" + id);
    await waitFor(() => expect(router.state.location.pathname).toBe("/atlas/politica"));
    expect(await screen.findByRole("heading", { level: 1, name: "Atlas de política, economia e marxismo" })).toBeTruthy();
  });
});

describe("cores de tradição no CSS", () => {
  const meta = (tradicoes: Record<string, { nome: string; cor: string; corEscura: string }>): AreaMeta =>
    ({ slug: "politica", nome: "P", status: "disponivel", tradicoes });

  it("só aceita #RRGGBB e chaves [a-z0-9-]", () => {
    const css = traditionCss(meta({
      marx: { nome: "M", cor: "#A4213A", corEscura: "#F2869C" },
      ruim: { nome: "R", cor: "red} body{display:none} :root{x:y", corEscura: "#FFFFFF" },
      "x}y": { nome: "X", cor: "#000000", corEscura: "#FFFFFF" },
    }));
    expect(css).toContain("--trad-politica-marx: #A4213A;");
    expect(css).not.toContain("display:none");
    expect(css).not.toContain("x}y");
    expect(css).not.toContain("--trad-politica-ruim");
  });
});
