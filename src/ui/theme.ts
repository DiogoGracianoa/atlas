// Gera as CSS custom properties dos temas a partir de tokens.ts e aplica as
// preferências do aparelho (tema e tamanho de texto) no <html>.
import type { Size, Theme } from "../core/types";
import { dark, FONT_SIZES, light, type Palette } from "./tokens";

const kebab = (k: string) => k.replace(/[A-Z]/g, c => "-" + c.toLowerCase());
const vars = (p: Palette) => Object.entries(p).map(([k, v]) => `  --${kebab(k)}: ${v};`).join("\n");

/** CSS dos temas: claro por padrão, escuro pelo sistema (auto) ou forçado. */
export function themeCss(): string {
  return [
    `:root {\n${vars(light)}\n  color-scheme: light;\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${vars(dark)}\n  color-scheme: dark;\n  }\n}`,
    `:root[data-theme="dark"] {\n${vars(dark)}\n  color-scheme: dark;\n}`,
  ].join("\n");
}

/** Injeta o CSS dos temas uma única vez. */
export function installTheme(doc: Document = document): void {
  if (doc.getElementById("atlas-theme")) return;
  const style = doc.createElement("style");
  style.id = "atlas-theme";
  style.textContent = themeCss();
  doc.head.prepend(style);
}

/** Aplica tema e tamanho de texto (preferências por aparelho, RN12). */
export function applyPrefs(prefs: { theme: Theme; size: Size }, root: HTMLElement = document.documentElement): void {
  if (prefs.theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", prefs.theme);
  root.setAttribute("data-size", prefs.size);
  root.style.setProperty("--fs-base", FONT_SIZES[prefs.size] + "px");
}
