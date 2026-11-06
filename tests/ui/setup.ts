// Setup do projeto "ui" do Vitest: desmonta o que cada teste renderizou e
// limpa o armazenamento do jsdom.
import { afterEach } from "vitest";
import { cleanup, configure } from "@testing-library/react";

// Com a suíte inteira em paralelo e currículos grandes (centenas de KB), 1 s
// de espera nas consultas assíncronas fica apertado; 6 s evita falso negativo.
configure({ asyncUtilTimeout: 6000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-size");
});
