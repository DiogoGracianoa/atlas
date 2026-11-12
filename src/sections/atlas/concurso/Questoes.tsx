// Questões de fixação (RN15, RN16, RN24): uma por vez; ao confirmar, o
// resultado, o gabarito e o comentário. Sem tópico: lista dos tópicos com
// questões publicadas.
import { useId, useState } from "react";
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { responder, taxaTopico } from "../../../core/concurso/desempenho";
import type { Questao } from "../../../core/concurso/tipos";
import { Button } from "../../../ui/primitives";
import { useTitle } from "../components/parts";
import { disciplinasPublicadas, pctTexto, useConcurso, useQuestoes } from "./comum";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export const LETRAS = ["A", "B", "C", "D", "E"];
export const origemTexto = (q: Questao) => (q.origem === "autoral" ? "autoral" : q.origem.fonte);

export function Questoes({ topico }: { topico: string | null }) {
  const { x } = useConcurso();
  const disc = topico ? x.topicos.get(topico)?.disciplina.id : undefined;
  const qs = useQuestoes(x, disc ? [disc] : disciplinasPublicadas(x));
  useTitle(`Questões · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  if (qs.status === "loading") return <p className={p.muted} role="status" style={{ padding: "24px var(--gutter)" }}>Carregando questões…</p>;
  if (qs.status === "error") return <p className={p.muted} role="alert" style={{ padding: "24px var(--gutter)" }}>Não foi possível carregar as questões. Confira a conexão.</p>;
  if (!topico) return <ListaTopicos questoes={qs.data} />;
  const lista = qs.data.filter(q => q.topico === topico);
  return <Resolver key={topico} topico={topico} lista={lista} />;
}

function ListaTopicos({ questoes }: { questoes: Questao[] }) {
  const { x, path } = useConcurso();
  const regs = useRegistros();
  const por = new Map<string, number>();
  for (const q of questoes) por.set(q.topico, (por.get(q.topico) ?? 0) + 1);
  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Questões de fixação</p>
        <h1 className={p.h1}>Questões</h1>
        <p className={p.lead}>Questões autorais, escritas para este preparatório. Não são questões oficiais da banca.</p>
      </header>
      {por.size === 0 && <p className={p.callout}><b>Ainda não há questões publicadas</b>Elas chegam junto com a teoria de cada tópico, semana a semana.</p>}
      <ul className={c.lista}>
        {[...por].map(([t, n]) => (
          <li key={t} className={c.box}>
            <Link to={path("questoes", t)}>{x.topicos.get(t)?.topico.titulo}</Link>
            <p className={c.note}>{n} questões · acertos: {pctTexto(taxaTopico(regs, x.slug, t))}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Resolver({ topico, lista }: { topico: string; lista: Questao[] }) {
  const { x, dia, path } = useConcurso();
  const regs = useRegistros();
  const [i, setI] = useState(0);
  const [marcada, setMarcada] = useState<number | null>(null);
  const [resposta, setResposta] = useState<boolean | null>(null);
  const name = useId();
  const q = lista[i];
  const titulo = x.topicos.get(topico)?.topico.titulo ?? topico;
  if (!q) {
    return (
      <div className={p.page}>
        <h1 className={p.h1}>{titulo}</h1>
        <p className={p.callout}><b>Conteúdo em preparação</b>Este tópico ainda não tem questões publicadas.</p>
      </div>
    );
  }
  const confirmar = () => { if (marcada !== null) setResposta(responder(regs, x.slug, q, marcada, dia)); };
  const proxima = () => { setI(i + 1); setMarcada(null); setResposta(null); };
  return (
    <div className={[p.page, c.texto].join(" ")}>
      <header className={p.itemHead}>
        <p className={p.kicker}><Link to={path("topico", topico)}>{titulo}</Link></p>
        <h1 className={p.h1}>Questão {i + 1} de {lista.length}</h1>
        <p className={c.note}>Origem: {origemTexto(q)}</p>
      </header>
      <p className={p.prose}>{q.enunciado}</p>
      <fieldset className={c.alternativas} disabled={resposta !== null}>
        <legend>Alternativas</legend>
        {q.alternativas.map((alt, k) => {
          const id = `${name}-${k}`;
          const r = resposta === null ? undefined : k === q.gabarito ? "certa" : k === marcada ? "errada" : undefined;
          return (
            <label key={k} htmlFor={id} className={c.alt} data-r={r}>
              <input id={id} type="radio" name={name} checked={marcada === k} onChange={() => setMarcada(k)} />
              <span>{LETRAS[k]}) {alt}</span>
            </label>
          );
        })}
      </fieldset>
      {resposta === null
        ? <Button variant="primary" disabled={marcada === null} onClick={confirmar}>Confirmar resposta</Button>
        : (
          <div className={c.resultado} role="status">
            <p className={c.big}>{resposta ? "Acertou" : "Errou"}</p>
            <p><b>Gabarito: {LETRAS[q.gabarito]}</b></p>
            <p className={p.prose}>{q.comentario}</p>
            <div className={p.actions}>
              {i + 1 < lista.length
                ? <Button variant="primary" onClick={proxima}>Próxima questão</Button>
                : <Link className={p.linkPrimary} to={path("topico", topico)}>Voltar ao tópico</Link>}
              {!resposta && <Link className={p.linkSecondary} to={path("erros")}>Ver caderno de erros</Link>}
            </div>
          </div>
        )}
    </div>
  );
}
