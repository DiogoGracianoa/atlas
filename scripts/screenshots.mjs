#!/usr/bin/env node
// Gera as capturas de tela da documentação (docs/img/) a partir do build de
// produção servido por `vite preview`. Rodar depois de `npm run build`:
//   node scripts/screenshots.mjs
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs", "img");
mkdirSync(out, { recursive: true });
const PORT = 4174;
const base = `http://localhost:${PORT}`;

// O Vite é iniciado direto pelo node (sem shell), para o kill no fim encerrar o
// processo de verdade também no Windows.
const server = spawn(process.execPath, [join(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--port", String(PORT), "--strictPort"], { cwd: root });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("vite preview não subiu")), 90000);
  server.stdout.on("data", d => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
});

const at = "2026-11-05T10:00:00.000Z";
const marks = {};
for (const id of ["m1e1", "m1e2", "m1e3", "m2e1", "m8e1"]) for (const k of ["def", "vid"]) marks[`politica/${id}:${k}`] = { done: true, at };
marks["politica/m8e3:def"] = { done: true, at };
const estado = (theme) => JSON.stringify({ v: 3, marks, notes: {}, lastAt: { route: "politica/m8e3", at }, resetAt: null, totals: { politica: 108 }, size: "m", theme });

const shots = [
  { file: "portal.png", path: "/", theme: "light", viewport: { width: 1280, height: 760 } },
  { file: "tema-claro.png", path: "/atlas/politica/m8e3", theme: "light", viewport: { width: 1280, height: 860 } },
  { file: "capa-escuro.png", path: "/atlas/politica", theme: "dark", viewport: { width: 1280, height: 860 } },
  { file: "celular-escuro.png", path: "/atlas/politica/m1e1", theme: "dark", viewport: { width: 390, height: 844 }, mobile: true },
];

const browser = await chromium.launch();
try {
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: 2, isMobile: !!s.mobile, colorScheme: s.theme });
    await ctx.addInitScript((v) => localStorage.setItem("atlas-v3", v), estado(s.theme));
    const page = await ctx.newPage();
    await page.goto(base + s.path);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(() => globalThis.document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, s.file) });
    console.log("gerada", s.file);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
