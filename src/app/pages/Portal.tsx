// Página inicial do portal (RN07): apresenta o projeto e lista as seções do
// registro. Seção disponível tem link; planejada aparece como "em breve".
import { useId } from "react";
import type { Section } from "../../sections/types";
import { Card, cardTitleClass, Tag } from "../../ui/primitives";
import { Arte } from "../../ui/Arte";
import s from "./Portal.module.css";

function SectionCard({ section }: { section: Section }) {
  const id = useId();
  const available = section.status === "disponivel";
  const Extra = section.Card;
  const cores = available ? ["var(--brand)", "var(--warm)", "var(--teal)"] : ["var(--control)", "var(--line)"];
  const body = (
    <>
      <Arte seed={section.slug} colors={cores} height={110} className={s.cardArt} />
      <h2 id={id} className={cardTitleClass}>{section.nome}</h2>
      <p className={s.resumo}>{section.resumo}</p>
      {available ? (Extra ? <Extra /> : null) : <Tag>Em breve</Tag>}
    </>
  );
  return (
    <li>
      {available
        ? <Card to={"/" + section.slug} labelledBy={id}>{body}</Card>
        : <Card muted labelledBy={id}>{body}</Card>}
    </li>
  );
}

export function Portal({ sections }: { sections: Section[] }) {
  return (
    <div className={s.page}>
      <section className={s.hero} aria-labelledby="portal-titulo">
        <p className={s.kicker}>Portal de estudos</p>
        <h1 id="portal-titulo" className={s.title}>Letrume</h1>
        <p className={s.lead}>
          Trilhas para estudar por conta própria, com explicação, vídeo e livro em cada tema,
          progresso salvo no aparelho e funcionamento offline.
        </p>
      </section>
      <ul className={s.grid} aria-label="Seções">
        {/* só o que existe: seções planejadas não aparecem (extensão de 2026-11-06) */}
        {sections.filter(sec => sec.status === "disponivel").map(sec => <SectionCard key={sec.slug} section={sec} />)}
      </ul>
    </div>
  );
}
