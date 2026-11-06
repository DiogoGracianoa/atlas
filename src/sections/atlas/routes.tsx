// Rotas do atlas (KR1 v1.2), relativas a /atlas. A moldura resolve o que cada
// segmento significa pelo manifesto (área simples, agrupador, subtema, item)
// e a página escolhe a vista.
import type { RouteObject } from "react-router";
import { AtlasLayout, useAtlas } from "./AtlasLayout";
import { Mapa } from "./pages/Mapa";
import { Grupo } from "./pages/Grupo";
import { Capa } from "./pages/Capa";
import { Item } from "./pages/Item";

function Vista() {
  const { view } = useAtlas();
  if (view === "grupo") return <Grupo />;
  if (view === "capa") return <Capa />;
  if (view === "item") return <Item />;
  return <Mapa />;
}

export const atlasRoutes: RouteObject[] = [
  {
    element: <AtlasLayout />,
    children: [
      { index: true, element: <Vista /> },
      { path: ":area", element: <Vista /> },
      { path: ":area/:b", element: <Vista /> },
      { path: ":area/:b/:c", element: <Vista /> },
    ],
  },
];
