// Roteiro completo da área para "Salvar como PDF" (RN14). Renderizado só na
// hora de imprimir, num portal fora do app; o CSS de impressão esconde o resto.
import { useEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { AreaIndex } from "../../../core/types";
import { tradition } from "../model";
import s from "./print.module.css";

export function RoteiroImpresso({ a }: { a: AreaIndex }) {
  return createPortal(
    <div className={s.printable} data-testid="roteiro-impresso">
      <h1>{a.meta.tituloPdf || a.meta.nome}</h1>
      <p className={s.meta}>
        Roteiro de {a.data.modules.length} módulos. Para cada tema: a definição, o vídeo indicado e o livro. Gerado em {new Date().toLocaleDateString("pt-BR")}.
      </p>
      {a.data.modules.map(m => (
        <section key={m.id} className={s.mod}>
          <h2>Módulo {m.number} · {m.name}</h2>
          <p className={s.meta}>{m.level} — {m.subtitle}</p>
          <p>{m.overview}</p>
          {m.steps.map(n => (
            <section key={n.id} className={s.step}>
              <h3>{n.title} — {n.tagline}</h3>
              <p className={s.meta}>{tradition(a, n.tradition).nome} · {n.effort || ""}</p>
              {n.definition.map((p, i) => <p key={i}>{p}</p>)}
              {n.concepts.length > 0 && (<><h4>Conceitos-chave</h4><dl>{n.concepts.map(c => <div key={c.t}><dt>{c.t}</dt><dd>{c.d}</dd></div>)}</dl></>)}
              {n.theses.length > 0 && (<><h4>Teses centrais</h4><ul>{n.theses.map((t, i) => <li key={i}>{t}</li>)}</ul></>)}
              {n.videos && n.videos.length > 0 && (
                <><h4>Assista</h4><ul>{n.videos.map(v => <li key={v.url}><b>{v.title}</b> ({v.source}). {v.focus}<br />{v.url}</li>)}</ul></>
              )}
              {n.book
                ? (<><h4>Leia</h4><p><b>{n.book.title}</b>, de {n.book.author} — {n.book.level}.<br />Como ler: {n.book.focus}</p></>)
                : n.bridge ? (<><h4>Sobre o livro</h4><p>{n.bridge}</p></>) : null}
              {n.debate && n.debate.length > 0 && (<><h4>Críticas e debates</h4><ul>{n.debate.map((d, i) => <li key={i}>{d}</li>)}</ul></>)}
              {n.check.length > 0 && (<><h4>Verifique se entendeu</h4><ol>{n.check.map((c, i) => <li key={i}>{c}</li>)}</ol></>)}
            </section>
          ))}
          <section className={s.step}>
            <h3>{m.workshop.title}</h3>
            <p>{m.workshop.exercise}</p>
            <p><b>Entrega:</b> {m.workshop.deliverable}</p>
          </section>
        </section>
      ))}
    </div>,
    document.body,
  );
}

/** Imprime a área: renderiza o roteiro, chama a impressão e desmonta depois. */
export function usePrint(area: AreaIndex | null) {
  const [printing, setPrinting] = useState<AreaIndex | null>(null);
  useEffect(() => {
    // Ctrl+P (ou menu do navegador) também gera o roteiro da área aberta.
    const before = () => { if (area) flushSync(() => setPrinting(area)); };
    const after = () => setPrinting(null);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, [area]);
  const print = () => {
    if (!area) return;
    flushSync(() => setPrinting(area));
    window.print();
  };
  return { printing, print };
}

