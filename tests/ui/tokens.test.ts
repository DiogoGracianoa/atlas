// Cenário U01 (RN12, AC16): contraste WCAG AA dos tokens e das cores de
// tradição do manifesto, nos temas claro e escuro.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrast } from "../../src/ui/color";
import { dark, light, TEXT_PAIRS, UI_PAIRS, type Palette } from "../../src/ui/tokens";
import { themeCss } from "../../src/ui/theme";
import type { Manifest } from "../../src/core/types";

const themes: [string, Palette][] = [["claro", light], ["escuro", dark]];

describe("tokens de cor", () => {
  for (const [nome, p] of themes) {
    it.each(TEXT_PAIRS)(`${nome}: texto %s sobre %s ≥ 4,5`, (fg, bg) => {
      expect(contrast(p[fg], p[bg])).toBeGreaterThanOrEqual(4.5);
    });
    it.each(UI_PAIRS)(`${nome}: componente %s sobre %s ≥ 3`, (fg, bg) => {
      expect(contrast(p[fg], p[bg])).toBeGreaterThanOrEqual(3);
    });
  }

  it("cores de tradição do manifesto passam AA para texto nos dois temas", () => {
    const man = JSON.parse(readFileSync(join(process.cwd(), "public", "content", "areas.json"), "utf8")) as Manifest;
    const falhas: string[] = [];
    for (const area of man.areas) {
      for (const [k, t] of Object.entries(area.tradicoes ?? {})) {
        for (const bg of [light.bg, light.surface]) if (contrast(t.cor, bg) < 4.5) falhas.push(`${area.slug}/${k} cor sobre ${bg}`);
        for (const bg of [dark.bg, dark.surface]) if (contrast(t.corEscura, bg) < 4.5) falhas.push(`${area.slug}/${k} corEscura sobre ${bg}`);
      }
    }
    expect(falhas).toEqual([]);
  });

  it("o CSS gerado define as variáveis nos três modos (claro, escuro automático e escuro forçado)", () => {
    const css = themeCss();
    expect(css).toContain(`--bg: ${light.bg}`);
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(':root:not([data-theme="light"])');
    expect(css).toContain(':root[data-theme="dark"]');
    expect(css.split(`--bg: ${dark.bg}`).length - 1).toBe(2);
  });
});
