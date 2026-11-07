import type { IncomingMessage, ServerResponse } from "node:http";
import { serveContent } from "./conteudo.ts";

/** Adaptação usada pelo Vite dev/preview; a autorização é sempre do handler. */
export function contentMiddleware(config: { url: string; anonKey: string } | null) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (/^\/(content|private)(\/|$)/.test(url.pathname)) {
      res.writeHead(404, { "Cache-Control": "private, no-store" }).end();
      return;
    }
    if (url.pathname !== "/api/conteudo") { next(); return; }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    const request = new Request(url, { method: req.method, headers });
    void serveContent(request, { config }).then(async response => {
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    }).catch(() => { res.writeHead(503, { "Cache-Control": "private, no-store" }).end(); });
  };
}
