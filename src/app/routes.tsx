// Monta as rotas do portal a partir do registro de seções (KR1, KS1).
// O shell não importa nenhuma seção específica: só itera o que recebe.
import type { RouteObject } from "react-router";
import type { Section } from "../sections/types";
import { Layout } from "./Layout";
import { Entrar } from "./pages/Entrar";
import { Erro } from "./pages/Erro";
import { Portal } from "./pages/Portal";
import { RedirectWithToast } from "./RedirectWithToast";

export function buildRoutes(sections: Section[]): RouteObject[] {
  const sectionRoutes: RouteObject[] = sections
    .filter(s => s.status === "disponivel" && s.routes)
    .map(s => ({ path: s.slug, children: s.routes }));
  return [
    {
      path: "/",
      element: <Layout />,
      errorElement: <Erro />,
      children: [
        { index: true, element: <Portal sections={sections} /> },
        // login do autor, sem link no site (RN18)
        { path: "entrar", element: <Entrar /> },
        ...sectionRoutes,
        { path: "*", element: <RedirectWithToast to="/" message="Página não encontrada." /> },
      ],
    },
  ];
}
