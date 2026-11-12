// Tópico do programa: fonte e validação (RN01), estado, leitura e confiança
// separados (RN12, RN13), semana com histórico (RN10), desempenho (RN16),
// teoria (RN28) e questões (RN25).
import { useId } from "react";
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { dataBr } from "../../../core/concurso/calendario";
import { taxaTopico } from "../../../core/concurso/desempenho";
import {
  CONFIANCAS, definirConfianca, definirEstado, ESTADOS, estadoTopico, historicoTopico, marcarLeitura, replanejar,
  ROTULO_CONFIANCA, ROTULO_ESTADO, semanaEfetiva, type Confianca, type EstadoTopico,
} from "../../../core/concurso/estudo";
import { Block, useTitle } from "../components/parts";
import { corDisciplina, pctTexto, SessaoForm, Selo, textoFonte, useConcurso, useTeoria } from "./comum";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export function Topico({ id }: { id: string }) {
  const { x, dia, path } = useConcurso();
  const regs = useRegistros();
  const node = x.topicos.get(id);
  useTitle(`${node?.topico.titulo ?? id} · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const teoria = useTeoria(x, id);
  const ids = { estado: useId(), conf: useId(), sem: useId() };
  if (!node) return null;
  const { topico: t, disciplina: d, modulo: m } = node;
  const sit = estadoTopico(regs, x.slug, id);
  const semana = semanaEfetiva(regs, x.data, x.slug, id);
  const hist = historicoTopico(regs, x.data, x.slug, id);
  const taxa = taxaTopico(regs, x.slug, id);

  return (
    <article className={[p.page, c.texto].join(" ")} style={{ ["--accent" as string]: corDisciplina(x.slug, d.id) }}>
      <header className={p.itemHead}>
        <p className={p.kicker}>{d.nome} · {m.nome}</p>
        <h1 className={p.h1}>{t.titulo}</h1>
        {t.opcional
          ? <p className={c.note}>Fora do programa do edital vigente; não conta no progresso. <Selo v={undefined} /></p>
          : <p className={c.note}><span>{d.nome} · {textoFonte(x, t.fonte, { comData: true })}</span> <Selo v={t.validacao} /></p>}
        {t.nota && <p className={c.note}>{t.nota}</p>}
        {t.fonte?.trecho && <p className={c.note}>Trecho do edital: “{t.fonte.trecho}”</p>}
      </header>

      {t.subtopicos.length > 0 && (
        <Block title="Subtópicos">
          <ul className={p.ticks}>{t.subtopicos.map(s => <li key={s}>{s}</li>)}</ul>
        </Block>
      )}

      <Block title="Meu estudo">
        <div className={c.controls}>
          <div className={c.form}>
            <label htmlFor={ids.estado}>Estado</label>
            <select id={ids.estado} className={c.select} value={sit.estado} onChange={e => definirEstado(regs, x.slug, id, e.target.value as EstadoTopico)}>
              {ESTADOS.map(e => <option key={e} value={e}>{ROTULO_ESTADO[e]}</option>)}
            </select>
          </div>
          <div className={c.form}>
            <label htmlFor={ids.conf}>Confiança</label>
            <select id={ids.conf} className={c.select} value={sit.confianca ?? ""} onChange={e => definirConfianca(regs, x.slug, id, (e.target.value || null) as Confianca | null)}>
              <option value="">Não informada</option>
              {CONFIANCAS.map(k => <option key={k} value={k}>{ROTULO_CONFIANCA[k]}</option>)}
            </select>
          </div>
        </div>
        <div className={p.actions}>
          <button type="button" className={p.check} aria-pressed={!!sit.leitura} onClick={() => marcarLeitura(regs, x.slug, id, sit.leitura ? null : dia)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            Leitura concluída
          </button>
          {sit.leitura && <span className={c.note}>em {dataBr(sit.leitura)}; revisões sugeridas a partir dela.</span>}
        </div>
        <p className={c.note}>Ler não é dominar: o estado e a confiança só mudam quando você os escolhe.</p>
        <p>Taxa de acertos: <b>{pctTexto(taxa)}</b></p>
        {semana !== null && (
          <div className={c.form}>
            <label htmlFor={ids.sem}>Semana</label>
            <select id={ids.sem} className={c.select} value={semana} onChange={e => replanejar(regs, x.data, x.slug, id, Number(e.target.value), dia)}>
              {x.data.trilha.semanas.map(s => <option key={s.n} value={s.n}>Semana {s.n} ({dataBr(s.inicio)} a {dataBr(s.fim)})</option>)}
            </select>
            {hist.mudancas.length > 0 && (
              <p className={c.note}>
                {[`Planejado: semana ${hist.planejada}`, ...hist.mudancas.map(mu => `replanejado em ${dataBr(mu.em)} para a semana ${mu.para}`)].join(" · ")}
              </p>
            )}
          </div>
        )}
        <SessaoForm regs={regs} disciplina={d.id} topicos={[id]} />
      </Block>

      {!t.publicado && (
        <Block title="Conteúdo">
          <p className={p.callout}><b>Conteúdo em preparação</b>A teoria e as questões deste tópico ainda não foram publicadas.</p>
        </Block>
      )}
      {t.publicado && teoria.status === "loading" && <p className={p.muted} role="status">Carregando teoria…</p>}
      {t.publicado && teoria.status === "error" && <p className={p.muted} role="alert">Não foi possível carregar a teoria. Confira a conexão.</p>}
      {t.publicado && teoria.status === "ready" && teoria.data && (<>
        <Block title="Objetivos"><ul className={p.ticks}>{teoria.data.objetivos.map(o => <li key={o}>{o}</li>)}</ul></Block>
        <Block title="Explicação"><div className={p.prose}>{teoria.data.explicacao.map(par => <p key={par}>{par}</p>)}</div></Block>
        <Block title="Exemplos comentados">
          {teoria.data.exemplos.map(ex => (
            <div key={ex.enunciado} className={p.resource}><p><b>{ex.enunciado}</b></p><p>{ex.resolucao}</p></div>
          ))}
        </Block>
        <Block title="Conceitos principais">
          <dl className={p.concepts}>{teoria.data.conceitos.map(k => <div key={k.t}><dt>{k.t}</dt><dd>{k.d}</dd></div>)}</dl>
        </Block>
        <Block title="Critério de domínio"><ul className={p.ticks}>{teoria.data.dominio.map(o => <li key={o}>{o}</li>)}</ul></Block>
        {teoria.data.fontes && teoria.data.fontes.length > 0 && (
          <Block title="Fontes consultadas">
            <ul className={p.ticks}>{teoria.data.fontes.map(f => <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a></li>)}</ul>
          </Block>
        )}
        <div className={p.actions}><Link className={p.linkPrimary} to={path("questoes", id)}>Resolver questões</Link></div>
      </>)}
    </article>
  );
}
