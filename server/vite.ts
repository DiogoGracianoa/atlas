import type { Plugin } from "vite";
import { contentMiddleware } from "./http.ts";

export function privateContent(config: { url: string; anonKey: string } | null): Plugin {
  return {
    name: "atlas-private-content",
    configureServer(server) { server.middlewares.use(contentMiddleware(config)); },
    configurePreviewServer(server) { server.middlewares.use(contentMiddleware(config)); },
  };
}
