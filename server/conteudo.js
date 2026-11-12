/* global Response, process, fetch, URL */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
const noStore = {
    "Cache-Control": "private, no-store",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
};
const error = (status, message, extra = {}) => Response.json({ error: message }, { status, headers: { ...noStore, ...extra } });
/** C01: a autorização remota vem antes de qualquer leitura de material. */
export async function serveContent(request, { config = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
    ? { url: process.env.VITE_SUPABASE_URL, anonKey: process.env.VITE_SUPABASE_ANON_KEY } : null, authFetch = fetch, root = process.cwd(), } = {}) {
    if (request.method !== "GET")
        return error(405, "Método não permitido.", { Allow: "GET" });
    const match = /^Bearer ([^\s,]+)$/i.exec(request.headers.get("authorization") ?? "");
    if (!match)
        return error(401, "Entre para acessar o conteúdo.");
    if (!config?.url || !config.anonKey)
        return error(503, "Conteúdo indisponível agora.");
    if (match[1] === config.anonKey)
        return error(401, "Entre para acessar o conteúdo.");
    try {
        const client = createClient(config.url, config.anonKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            global: { fetch: authFetch },
        });
        const { data, error: authError } = await client.auth.getUser(match[1]);
        if (authError)
            return error(authError.status && authError.status < 500 ? 401 : 503, "Não foi possível autorizar o acesso.");
        if (!data.user?.id || data.user.is_anonymous || data.user.aud !== "authenticated")
            return error(401, "Entre para acessar o conteúdo.");
    }
    catch {
        return error(503, "Conteúdo indisponível agora.");
    }
    const params = new URL(request.url).searchParams.getAll("arquivo");
    const file = params[0] ?? "";
    // Concurso (K-C1): além do concurso.json, a pasta do concurso tem
    // discursiva.json, teoria/<disciplina>.json e questoes/<disciplina>.json.
    const concursoFile = /^content\/([a-z0-9-]+)\/(discursiva\.json|(?:teoria|questoes)\/[a-z0-9-]+\.json)$/.exec(file);
    if (params.length !== 1 || !(/^content\/(areas\.json|[a-z0-9-]+\/(curriculum|concurso)\.json)$/.test(file) || concursoFile))
        return error(404, "Arquivo não encontrado.");
    try {
        const manifest = await readFile(join(root, "private", "content", "areas.json"), "utf8");
        const areas = JSON.parse(manifest).areas;
        const leaves = areas.flatMap(a => [a, ...(a.subtemas ?? [])]);
        const allowed = new Set(["content/areas.json", ...leaves.map(a => a.arquivo).filter(Boolean)]);
        const concursos = new Set(leaves.filter(a => a.tipo === "concurso" && a.arquivo === `content/${a.slug}/concurso.json`).map(a => a.slug));
        if (!allowed.has(file) && !(concursoFile && concursos.has(concursoFile[1])))
            return error(404, "Arquivo não encontrado.");
        const body = file === "content/areas.json" ? manifest : await readFile(join(root, "private", file), "utf8");
        return new Response(body, { headers: { ...noStore, "Content-Type": "application/json; charset=utf-8" } });
    }
    catch {
        return error(500, "Não foi possível carregar o conteúdo.");
    }
}
