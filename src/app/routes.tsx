// Monta as rotas do portal a partir do registro de seções (KR1, KS1).
// O shell não importa nenhuma seção específica: só itera o que recebe.
import type { RouteObject } from "react-router";
import type { Section } from "../sections/types";
import { Layout } from "./Layout";
import { Entrar } from "./pages/Entrar";
import { Erro } from "./pages/Erro";
import { Portal } from "./pages/Portal";
import { RedirectWithToast } from "./RedirectWithToast";
import { RequireAuth } from "./RequireAuth";

export function buildRoutes(sections: Section[]): RouteObject[] {
  const sectionRoutes: RouteObject[] = sections
    .filter(s => s.status === "disponivel" && s.routes)
    .map(s => ({ path: s.slug, children: s.routes }));
  return [
    { path: "/entrar", element: <Entrar />, errorElement: <Erro /> },
    {
      element: <RequireAuth />,
      errorElement: <Erro />,
      children: [
        {
          path: "/", element: <Layout />, children: [
            { index: true, element: <Portal sections={sections} /> },
            ...sectionRoutes,
            { path: "*", element: <RedirectWithToast to="/" message="Página não encontrada." /> },
          ],
        },
      ],
    },
  ];
}
