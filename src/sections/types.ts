// Contrato KS1: uma seção do portal. O shell só conhece seções por aqui.
import type { ComponentType } from "react";
import type { RouteObject } from "react-router";

export type SectionStatus = "disponivel" | "planejado";

export interface Section {
  /** Prefixo da rota e identificador: [a-z0-9-]+, único. */
  slug: string;
  nome: string;
  /** Uma frase para o cartão do portal. */
  resumo: string;
  status: SectionStatus;
  /** Rotas relativas ao prefixo `/{slug}`; obrigatórias se disponível. */
  routes?: RouteObject[];
  /** Conteúdo extra do cartão no portal (por exemplo, progresso). */
  Card?: ComponentType;
}
