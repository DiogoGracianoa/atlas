// Caderno de erros (RN17): questões cuja última resposta foi errada, com
// anotação; sai do caderno ao acertar de novo ou ao marcar como revisada.
import { useId, useState } from "react";
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { dataBr } from "../../../core/concurso/calendario";
import { anotarErro, cadernoDeErros, marcarErroRevisado, type ItemCaderno } from "../../../core/concurso/desempenho";
import type { Questao } from "../../../core/concurso/tipos";
import { Button } from "../../../ui/primitives";
import { useTitle } from "../components/parts";
import { disciplinasPublicadas, useConcurso, useQuestoes } from "./comum";
import { LETRAS } from "./Questoes";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export function Erros() {
  const { x } = useConcurso();
  const regs = useRegistros();
  const itens = cadernoDeErros(regs, x.slug);
  const qs = useQuestoes(x, disciplinasPublicadas(x));
  useTitle(`Caderno de erros · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const porId = new Map((qs.status === "ready" ? qs.data : []).map(q => [q.id, q]));
  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Revisão direcionada</p>
        <h1 className={p.h1}>Caderno de erros</h1>
        <p className={p.lead}>Questões cuja última resposta foi errada. Anote o porquê e refaça.</p>
      </header>
      {itens.length === 0 && <p className={p.callout}><b>Nenhum erro pendente</b>Quando você errar uma questão, ela aparece aqui.</p>}
      <ul className={c.lista}>
        {/* a chave inclui a anotação: uma mudança vinda de outro aparelho recria o campo */}
        {itens.map(it => <li key={it.questao + "|" + it.anotacao}><ItemErro it={it} q={porId.get(it.questao)} /></li>)}
      </ul>
    </div>
  );
}

function ItemErro({ it, q }: { it: ItemCaderno; q: Questao | undefined }) {
  const { x, path } = useConcurso();
  const regs = useRegistros();
  const id = useId();
  const [texto, setTexto] = useState(it.anotacao);
  return (
    <div className={[c.box, c.texto].join(" ")}>
      <p className={c.note}><Link to={path("topico", it.topico)}>{x.topicos.get(it.topico)?.topico.titulo ?? it.topico}</Link> · errou em {dataBr(it.errouEm)}</p>
      {q ? (<>
        <p>{q.enunciado}</p>
        <p className={c.note}>Gabarito: {LETRAS[q.gabarito]}) {q.alternativas[q.gabarito]}</p>
      </>) : <p className={c.note}>Questão {it.questao}</p>}
      <div className={c.form}>
        <label htmlFor={id}>Anotação</label>
        <textarea id={id} className={c.textarea} value={texto} onChange={e => setTexto(e.target.value)} onBlur={() => { if (texto !== it.anotacao) anotarErro(regs, x.slug, it.questao, texto); }} />
      </div>
      <div className={p.actions}>
        <Link className={p.linkSecondary} to={path("questoes", it.topico)}>Refazer questões do tópico</Link>
        <Button onClick={() => marcarErroRevisado(regs, x.slug, it.questao)}>Marcar como revisada</Button>
      </div>
    </div>
  );
}
