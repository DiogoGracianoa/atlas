// Setup do projeto "ui" do Vitest: desmonta o que cada teste renderizou e
// limpa o armazenamento do jsdom.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-size");
});
