// Preparatório de concurso (RN29): moldura com abas e a página da rota
// /atlas/{grupo}/{concurso}/{página}/{id}.
import { Link, Navigate } from "react-router";
import { useServices } from "../../../app/context";
import { RedirectWithToast } from "../../../app/RedirectWithToast";
import { useAtlas } from "../AtlasLayout";
import { ConcursoProvider, diaDe, useConcursoIndex, type ConcursoCtx } from "./comum";
import { Capa } from "./Capa";
import { Trilha } from "./Trilha";
import { Topico } from "./Topico";
import { Questoes } from "./Questoes";
import { Erros } from "./Erros";
import { Revisoes } from "./Revisoes";
import { Painel } from "./Painel";
import { Simulado } from "./Simulado";
import { Discursiva } from "./Discursiva";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

const ABAS: { pagina: string | null; nome: string }[] = [
  { pagina: null, nome: "Hoje" },
  { pagina: "trilha", nome: "Trilha" },
  { pagina: "questoes", nome: "Questões" },
  { pagina: "erros", nome: "Erros" },
  { pagina: "revisoes", nome: "Revisões" },
  { pagina: "simulado", nome: "Simulado" },
  { pagina: "discursiva", nome: "Discursiva" },
  { pagina: "painel", nome: "Painel" },
];
const PAGINAS = new Set(["trilha", "topico", "questoes", "erros", "revisoes", "simulado", "discursiva", "painel"]);

export function Concurso() {
  const { concurso, paths } = useAtlas();
  const { agora } = useServices();
  const slug = concurso?.slug ?? "";
  const loaded = useConcursoIndex(slug);
  if (!concurso) return null;
  const base = paths.areaPath(slug);
  const { pagina, id } = concurso;

  if (loaded.status === "loading") return <p className={p.muted} role="status" style={{ padding: "24px var(--gutter)" }}>Carregando…</p>;
  if (loaded.status === "error") return <RedirectWithToast to={paths.areaPath(paths.parentOf(slug) ?? "")} message="Este preparatório precisa de conexão." />;
  if (pagina && !PAGINAS.has(pagina)) return <Navigate to={base} replace />;
  if (pagina === "topico" && (!id || !loaded.data.topicos.has(id))) return <RedirectWithToast to={base + "/trilha"} message="Tópico não encontrado." />;

  const now = agora();
  const ctx: ConcursoCtx = {
    x: loaded.data, base, agora: now, dia: diaDe(loaded.data, now),
    path: (pg, i) => base + (pg ? "/" + pg : "") + (i ? "/" + i : ""),
  };
  const atual = pagina === "topico" ? null : pagina;

  return (
    <ConcursoProvider value={ctx}>
      <nav className={c.tabs} aria-label="Preparatório">
        {ABAS.map(a => (
          <Link key={a.nome} to={ctx.path(a.pagina ?? undefined)} aria-current={a.pagina === atual && pagina !== "topico" ? "page" : undefined}>{a.nome}</Link>
        ))}
      </nav>
      {!pagina && <Capa />}
      {pagina === "trilha" && <Trilha />}
      {pagina === "topico" && id && <Topico id={id} />}
      {pagina === "questoes" && <Questoes topico={id} />}
      {pagina === "erros" && <Erros />}
      {pagina === "revisoes" && <Revisoes />}
      {pagina === "simulado" && <Simulado />}
      {pagina === "discursiva" && <Discursiva />}
      {pagina === "painel" && <Painel />}
    </ConcursoProvider>
  );
}
