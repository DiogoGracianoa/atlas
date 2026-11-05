// Registro de seções do portal (contrato KS1, ADR-003).
// Seção nova = pasta própria em src/sections/{slug}/ + uma entrada aqui (RN08).
import { atlas } from "./atlas";
import type { Section } from "./types";

export const dossies: Section = {
  slug: "dossies",
  nome: "Dossiês",
  resumo: "Perfis aprofundados de temas, pessoas e tecnologias, com fontes e contexto.",
  status: "planejado",
};

export const sections: Section[] = [atlas, dossies];
