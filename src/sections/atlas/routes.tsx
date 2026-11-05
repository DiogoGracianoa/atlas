// Rotas do atlas (KR1), relativas a /atlas.
import type { RouteObject } from "react-router";
import { AtlasLayout } from "./AtlasLayout";
import { Mapa } from "./pages/Mapa";
import { Capa } from "./pages/Capa";
import { Item } from "./pages/Item";

export const atlasRoutes: RouteObject[] = [
  {
    element: <AtlasLayout />,
    children: [
      { index: true, element: <Mapa /> },
      { path: ":area", element: <Capa /> },
      { path: ":area/:id", element: <Item /> },
    ],
  },
];
