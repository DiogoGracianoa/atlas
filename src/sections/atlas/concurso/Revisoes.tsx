// Revisões espaçadas (RN18): pendentes (até hoje), próximas e feitas.
import { useId } from "react";
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { dataBr } from "../../../core/concurso/calendario";
import { marcarRevisao, revisoes, type Revisao } from "../../../core/concurso/desempenho";
import { Button } from "../../../ui/primitives";
import { useTitle } from "../components/parts";
import { Sugestao, useConcurso } from "./comum";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export function Revisoes() {
  const { x, dia } = useConcurso();
  const regs = useRegistros();
  useTitle(`Revisões · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const todas = revisoes(x.data, regs, x.slug);
  const pend = todas.filter(r => !r.feita && r.dia <= dia);
  const prox = todas.filter(r => !r.feita && r.dia > dia);
  const feitas = todas.filter(r => r.feita);
  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Revisão espaçada</p>
        <h1 className={p.h1}>Revisões</h1>
        <p className={p.lead}>Depois da leitura de um tópico: revisões {x.data.revisao.dias.map(n => `${n} dia${n > 1 ? "s" : ""}`).join(", ")} depois, até {dataBr(x.data.trilha.fim)}. <Sugestao /></p>
      </header>
      <Grupo titulo="Pendentes" itens={pend} vazio="Nenhuma revisão pendente." acao={r => marcarRevisao(regs, x.slug, r.topico, r.n, dia)} />
      <Grupo titulo="Próximas" itens={prox.slice(0, 30)} vazio="Nenhuma revisão agendada." />
      <p className={c.note}>{feitas.length === 1 ? "1 revisão feita." : `${feitas.length} revisões feitas.`}</p>
    </div>
  );
}

function Grupo({ titulo, itens, vazio, acao }: { titulo: string; itens: Revisao[]; vazio: string; acao?: (r: Revisao) => void }) {
  const { x, path } = useConcurso();
  const hid = useId();
  return (
    <section aria-labelledby={hid} className={p.block}>
      <h2 id={hid} className={p.blockTitle}>{titulo}</h2>
      {!itens.length && <p className={p.muted}>{vazio}</p>}
      <ul className={c.lista}>
        {itens.map(r => {
          const nome = x.topicos.get(r.topico)?.topico.titulo ?? r.topico;
          return (
            <li key={r.topico + r.n} className={c.box}>
              <p><Link to={path("topico", r.topico)}>{nome}</Link> <span className={c.estado}>revisão de {r.n} dia{r.n > 1 ? "s" : ""}</span></p>
              <p className={c.note}><span>{dataBr(r.dia)}</span></p>
              {acao && <Button onClick={() => acao(r)} aria-label={`Marcar revisão de ${nome} de ${dataBr(r.dia)} como feita`}>Marcar como feita</Button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
