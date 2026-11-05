/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Offline (ADR-007): service worker próprio em src/sw.ts, publicado em /sw.js.
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      registerType: "autoUpdate",
      injectManifest: {
        // Conteúdo fica fora do precache: entra no cache só quando a área é aberta (KW1).
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,webmanifest}"],
        globIgnores: ["content/**"],
      },
      manifest: {
        name: "Atlas · Portal de estudos",
        short_name: "Atlas",
        description: "Trilhas de estudo autodirigido com progresso salvo e sincronizado.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#F7F4EE",
        theme_color: "#2F4A63",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    // O manifesto lista os chunks e seus imports; scripts/size-budget.mjs usa (RN13).
    manifest: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "core",
          environment: "node",
          include: ["tests/core/**/*.test.ts", "tests/scripts/**/*.test.ts", "tests/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["tests/ui/setup.ts"],
          include: ["tests/ui/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
