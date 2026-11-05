// Raiz do app: serviços, avisos e roteador. `router` pode ser injetado (testes).
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider, type createMemoryRouter } from "react-router";
import type { Section } from "../sections/types";
import { ToastProvider } from "../ui/Toast";
import { ServicesProvider } from "./context";
import { buildRoutes } from "./routes";
import type { Services } from "./services";

type AppRouter = ReturnType<typeof createBrowserRouter> | ReturnType<typeof createMemoryRouter>;

export function App({ services, sections, router }: { services: Services; sections: Section[]; router?: AppRouter }) {
  const r = useMemo(() => router ?? createBrowserRouter(buildRoutes(sections)), [router, sections]);
  return (
    <ServicesProvider services={services}>
      <ToastProvider>
        <RouterProvider router={r} />
      </ToastProvider>
    </ServicesProvider>
  );
}
