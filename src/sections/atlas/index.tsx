// Seção "Atlas de estudos" (KS1): rotas /atlas/* e cartão com progresso.
import type { Section } from "../types";
import { AtlasCard } from "./AtlasCard";
import { atlasRoutes } from "./routes";

export const atlas: Section = {
  slug: "atlas",
  nome: "Atlas de estudos",
  resumo: "Trilhas por área: definição, aula em vídeo e livro em cada tema, com oficinas para aplicar.",
  status: "disponivel",
  routes: atlasRoutes,
  Card: AtlasCard,
};
