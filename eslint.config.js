import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import globals from "globals";

export default tseslint.config(
  {
    // Artefatos gerados e material bruto ficam fora do lint.
    ignores: ["dist", "playwright-report", "test-results", "exemplos"],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y-x": jsxA11y },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
  },
  {
    // Nos testes, `!` depois de uma asserção que já garante o valor é aceitável.
    files: ["tests/**/*.{ts,tsx}", "e2e/**/*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  {
    files: ["src/core/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{js,ts}", "e2e/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
);
