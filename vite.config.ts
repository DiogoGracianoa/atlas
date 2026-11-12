/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { privateContent } from "./server/vite.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const config = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
    ? { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY } : null;
  return {
  server: { fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/private/**"] } },
  plugins: [
    privateContent(config),
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
        // Diagramas (Mermaid, ~1 MB) também: baixados no primeiro tema com diagrama.
        globIgnores: ["content/**", "assets/diagramas/**"],
      },
      manifest: {
        id: "/",
        name: "Letrume",
        short_name: "Letrume",
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
    rollupOptions: {
      output: {
        // Chunks só de dependências que não são do núcleo do app (Mermaid e o
        // que ele puxa: d3, dagre, katex…) vão para assets/diagramas/, fora do
        // precache do service worker.
        chunkFileNames: (chunk) => {
          const ids = chunk.moduleIds ?? [];
          const nucleo = /node_modules[\\/](react|react-dom|react-router|scheduler|@supabase|workbox-)/;
          const soDeps = ids.length > 0 && ids.every(id => id.includes("node_modules") && !nucleo.test(id));
          return soDeps ? "assets/diagramas/[name]-[hash].js" : "assets/[name]-[hash].js";
        },
      },
    },
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
          // UI monta o app real com currículos grandes; sob carga paralela 5 s é pouco.
          testTimeout: 15000,
          include: ["tests/ui/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
};
});
