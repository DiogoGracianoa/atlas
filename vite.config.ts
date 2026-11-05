/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
          include: ["tests/core/**/*.test.ts", "tests/*.test.ts"],
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
