// Runner exclusivo de testes. O produto nunca habilita Auth falso.
import { createServer } from "node:http";
import { build, preview } from "vite";

process.env.VITE_SUPABASE_URL = "http://127.0.0.1:4174";
process.env.VITE_SUPABASE_ANON_KEY = "e2e-public-key";
const user = { id: "e2e-user", email: "reader@example.test", aud: "authenticated", role: "authenticated", is_anonymous: false };
const auth = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4173");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "authorization, apikey, content-type, x-client-info, prefer");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  if (req.url === "/auth/v1/user") {
    const accepted = req.headers.authorization === "Bearer accepted-token";
    res.writeHead(accepted ? 200 : 401).end(JSON.stringify(accepted ? user : { message: "Invalid JWT" }));
    return;
  }
  if (req.url?.startsWith("/auth/v1/logout")) { res.writeHead(204).end(); return; }
  if (req.method === "POST" && req.url?.startsWith("/rest/v1/")) {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => res.end(body || "[]"));
    return;
  }
  res.end("[]");
});
await new Promise<void>(resolve => auth.listen(4174, "127.0.0.1", resolve));
await build();
const site = await preview({ preview: { port: 4173, strictPort: true, host: "localhost" } });
const close = () => { site.httpServer.close(); auth.close(); };
process.on("SIGTERM", close);
process.on("SIGINT", close);
