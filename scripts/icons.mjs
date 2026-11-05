#!/usr/bin/env node
// Gera os ícones PNG do PWA a partir de public/icon.svg, usando o Chromium do
// Playwright (já instalado para os testes). Rodar só quando o ícone mudar:
//   node scripts/icons.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "icon.svg"), "utf8");
const out = join(root, "public", "icons");
mkdirSync(out, { recursive: true });

// "maskable": fundo cheio, desenho dentro da zona segura (80% central).
const targets = [
  { file: "icon-192.png", size: 192, pad: 0 },
  { file: "icon-512.png", size: 512, pad: 0 },
  { file: "maskable-512.png", size: 512, pad: 0.1, bg: "#2F4A63" },
  { file: "apple-touch-icon.png", size: 180, pad: 0.06, bg: "#2F4A63" },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  const inner = Math.round(t.size * (1 - 2 * t.pad));
  await page.setContent(`<html><body style="margin:0;background:${t.bg ?? "transparent"};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: join(out, t.file), omitBackground: !t.bg });
  console.log("gerado", t.file);
}
await browser.close();
