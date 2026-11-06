// Tokens de design: fonte única das cores dos temas claro e escuro (ADR-008).
// `theme.ts` gera as CSS custom properties a partir daqui, e
// tests/ui/tokens.test.ts confere o contraste WCAG de cada par (RN12, U01).

export interface Palette {
  /** Fundo da página (papel). */
  bg: string;
  /** Superfícies elevadas: cartões, painéis, menu. */
  surface: string;
  /** Superfície alternativa: blocos de destaque, faixas. */
  surfaceAlt: string;
  /** Texto principal. */
  text: string;
  /** Texto secundário (legendas, metadados). */
  muted: string;
  /** Divisórias decorativas (não precisam de contraste). */
  line: string;
  /** Contorno de controles (campos, botões secundários): ≥ 3:1. */
  control: string;
  /** Marca: links, botão primário, acentos. */
  brand: string;
  /** Texto sobre a cor de marca (botão primário). */
  onBrand: string;
  /** Fundo suave da marca (item ativo, seleção). */
  brandSoft: string;
  /** Anel de foco. */
  focus: string;
  success: string;
  danger: string;
  /** Cores decorativas (ilustrações, acentos): nunca usadas para texto. */
  warm: string;
  teal: string;
}

export const light: Palette = {
  bg: "#F7F4EE",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEAE1",
  text: "#1D1B18",
  muted: "#5B564E",
  line: "#E2DBCF",
  control: "#8A8174",
  brand: "#2F4A63",
  onBrand: "#FFFFFF",
  brandSoft: "#E4EAF0",
  focus: "#1F5FBF",
  success: "#2F6B4F",
  danger: "#A12A2A",
  warm: "#C2603A",
  teal: "#2A7F78",
};

export const dark: Palette = {
  bg: "#141311",
  surface: "#1C1A17",
  surfaceAlt: "#25221E",
  text: "#ECE6DC",
  muted: "#A9A196",
  line: "#2E2A25",
  control: "#7A7266",
  brand: "#9DB8D2",
  onBrand: "#141311",
  brandSoft: "#22303D",
  focus: "#7FB2FF",
  success: "#7CC4A0",
  danger: "#F08A8A",
  warm: "#F0A47A",
  teal: "#7FD0C8",
};

/** Pares que precisam de contraste de texto (4,5:1). */
export const TEXT_PAIRS: [keyof Palette, keyof Palette][] = [
  ["text", "bg"], ["text", "surface"], ["text", "surfaceAlt"], ["text", "brandSoft"],
  ["muted", "bg"], ["muted", "surface"], ["muted", "surfaceAlt"],
  ["brand", "bg"], ["brand", "surface"], ["brand", "surfaceAlt"], ["brand", "brandSoft"],
  ["onBrand", "brand"],
  ["success", "bg"], ["success", "surface"],
  ["danger", "bg"], ["danger", "surface"],
];

/** Pares de componentes de interface e foco (3:1, WCAG 1.4.11). */
export const UI_PAIRS: [keyof Palette, keyof Palette][] = [
  ["control", "bg"], ["control", "surface"],
  ["focus", "bg"], ["focus", "surface"],
];

/** Tamanhos de texto (preferência por aparelho): px do corpo. */
export const FONT_SIZES = { s: 15, m: 17, l: 19, xl: 21 } as const;
