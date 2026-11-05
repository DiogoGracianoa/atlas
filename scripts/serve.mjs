#!/usr/bin/env node
// Servidor estático para desenvolvimento local. Node puro, sem dependências.
//   node scripts/serve.mjs [porta]   (padrão 8080)
// Serve só o que vai para o deploy: exemplos/ e arquivos ocultos ficam de fora.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json"
};
const BLOCKED = /(^|\/)(exemplos|\.[^/]+|node_modules|tests|especificacoes|supabase)(\/|$)/;

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const rel = normalize(path).replace(/^[\\/]+/, "");
    if (rel.startsWith("..") || BLOCKED.test(rel.split(sep).join("/"))) { res.writeHead(404).end("404"); return; }
    const file = join(ROOT, rel);
    if (!(await stat(file)).isFile()) throw new Error("não é arquivo");
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(await readFile(file));
  } catch (e) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404");
  }
}).listen(PORT, () => console.log("Atlas em http://localhost:" + PORT));
