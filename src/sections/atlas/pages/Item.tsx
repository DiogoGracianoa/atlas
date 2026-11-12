// Página de um item (tema ou oficina). Item desconhecido volta à capa (KR1).
import { useEffect } from "react";
import { Navigate } from "react-router";
import { useServices } from "../../../app/context";
import type { StepNode, WorkshopNode, AreaIndex } from "../../../core/types";
import { Tag } from "../../../ui/primitives";
import { useAtlas } from "../AtlasLayout";
import { Block, ExternalLink, MarkButton, Notes, Pager, Tutor, useTitle } from "../components/parts";
import { Diagrama } from "../components/Diagrama";
import { isDone, itemName, itemTradition } from "../model";
import { useAppState } from "../../../app/context";
import s from "../Page.module.css";

function Percurso({ a, n }: { a: AreaIndex; n: StepNode }) {
  const state = useAppState();
  const marks = a.marksOf(n);
  return (
    <nav className={s.track} aria-label="Seu percurso neste tema">
      <p className={s.trackTitle} aria-hidden="true">Seu percurso neste tema</p>
      <ol>
        {marks.map((mk, i) => {
          const on = isDone(state, n.key, mk.k);
          const sub = mk.k === "def" ? "A explicação completa, aqui mesmo"
            : mk.k === "vid" ? (n.videos?.[0]?.source || "Aula em vídeo")
            : (n.book?.author ?? "");
          const target = mk.k === "def" ? "definicao" : mk.k === "vid" ? "video" : "livro";
          return (
            <li key={mk.k}>
              <a href={"#" + target} data-done={on || undefined}
                onClick={e => { e.preventDefault(); document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                <span className={s.trackNum} aria-hidden="true">{on ? "✓" : i + 1}</span>
                <span className={s.trackText}><b>{mk.label}</b><span>{sub}</span></span>
                {on && <span className="visually-hidden">(feito)</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Tema({ a, n }: { a: AreaIndex; n: StepNode }) {
  const trad = itemTradition(a, n);
  const state = useAppState();
  return (
    <>
      <header className={s.itemHead}>
        <div className={s.kickerRow}>
          <Tag dot color={trad.color}>{trad.nome}</Tag>
          <Tag>Módulo {n.mod.number}</Tag>
          {n.effort && <Tag>{n.effort}</Tag>}
        </div>
        <h1 className={s.h1}>{n.title}</h1>
        <p className={s.lead}>{n.tagline}</p>
      </header>

      <Percurso a={a} n={n} />

      <Block id="definicao" title="A definição">
        <div className={s.prose}>{n.definition.map((p, i) => <p key={i}>{p}</p>)}</div>
        {n.diagram && <Diagrama code={n.diagram.code} caption={n.diagram.caption} theme={state.theme} />}
        <div className={s.actions}><MarkButton n={n} mark="def" /></div>
      </Block>

      {n.concepts.length > 0 && (
        <Block title="Conceitos-chave">
          <dl className={s.concepts}>
            {n.concepts.map(c => <div key={c.t}><dt>{c.t}</dt><dd>{c.d}</dd></div>)}
          </dl>
        </Block>
      )}

      {n.theses.length > 0 && (
        <Block title="As teses centrais">
          <ul className={s.ticks}>{n.theses.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Block>
      )}

      {n.videos && n.videos.length > 0 && (
        <Block id="video" title="Agora assista">
          {n.videos.map(v => (
            <article key={v.url} className={s.resource}>
              <p className={s.resKind}>Vídeo</p>
              <h3>{v.title}</h3>
              <p className={s.resBy}>{v.source}</p>
              <p>{v.focus}</p>
              <div className={s.actions}><ExternalLink primary href={v.url}>Abrir no YouTube</ExternalLink></div>
            </article>
          ))}
          <div className={s.actions}><MarkButton n={n} mark="vid" /></div>
        </Block>
      )}

      {n.book ? (
        <Block id="livro" title="Depois leia">
          <article className={s.resource}>
            <p className={s.resKind}>Livro · {n.book.level}</p>
            <h3>{n.book.title}</h3>
            <p className={s.resBy}>{n.book.author}</p>
            <p><b>Como ler: </b>{n.book.focus}</p>
            <div className={s.actions}>
              <ExternalLink primary href={n.book.url}>{n.book.label}</ExternalLink>
              <MarkButton n={n} mark="book" />
            </div>
          </article>
        </Block>
      ) : n.bridge ? (
        <Block id="livro">
          <aside className={s.callout}><b>Sobre o livro desta etapa</b>{n.bridge}</aside>
        </Block>
      ) : null}

      {n.debate && n.debate.length > 0 && (
        <Block title="Críticas e debates">
          <ul className={s.ticks}>{n.debate.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </Block>
      )}

      {n.check.length > 0 && (
        <Block title="Verifique se entendeu">
          <ol className={s.questions}>{n.check.map((c, i) => <li key={i}>{c}</li>)}</ol>
        </Block>
      )}

      <Tutor a={a} n={n} />
      <Notes key={n.key} n={n} />
    </>
  );
}

function Oficina({ a, n }: { a: AreaIndex; n: WorkshopNode }) {
  return (
    <>
      <header className={s.itemHead}>
        <div className={s.kickerRow}><Tag>Oficina</Tag><Tag>Módulo {n.mod.number}</Tag></div>
        <h1 className={s.h1}>{n.title}</h1>
        <p className={s.lead}>{n.brief}</p>
      </header>
      <Block title="O que você vai fazer"><div className={s.prose}><p>{n.exercise}</p></div></Block>
      <Block><aside className={s.callout}><b>Entrega</b>{n.deliverable}</aside></Block>
      {n.mod.goals.length > 0 && (
        <Block title="Ao fechar este módulo você deve conseguir">
          <ul className={s.ticks}>{n.mod.goals.map((g, i) => <li key={i}>{g}</li>)}</ul>
        </Block>
      )}
      <Tutor a={a} n={n} />
      <Notes key={n.key} n={n} />
      <div className={s.actions}><MarkButton n={n} mark="do" /></div>
    </>
  );
}

export function Item() {
  const { area: a, itemId: id, paths } = useAtlas();
  const { store } = useServices();
  const n = a && id ? a.byId[id] : undefined;
  useTitle(n && a ? `${itemName(n)} · ${a.meta.tituloPdf || a.meta.nome}` : "Letrume");
  useEffect(() => { if (n) store.setLastAt(n.key); }, [n, store]);
  if (!a) return null;
  if (!n) return <Navigate to={paths.areaPath(a.slug)} replace />;
  const trad = itemTradition(a, n);
  return (
    <article className={s.page} style={{ ["--accent" as string]: trad.color }}>
      {n.kind === "workshop" ? <Oficina a={a} n={n} /> : <Tema a={a} n={n} />}
      <Pager a={a} n={n} />
    </article>
  );
}
