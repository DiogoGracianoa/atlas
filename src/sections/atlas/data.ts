// Acesso ao conteúdo do atlas a partir dos componentes: manifesto e áreas
// carregadas sob demanda, com cache por sessão (no núcleo, createContent).
import { useEffect, useState } from "react";
import { useServices } from "../../app/context";
import type { AreaIndex, Manifest } from "../../core/types";

export type Loadable<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: Error };

export function useManifest(): Loadable<Manifest> {
  const { content } = useServices();
  const [state, setState] = useState<Loadable<Manifest>>(() =>
    content.areas().length ? { status: "ready", data: { areas: content.areas() } } : { status: "loading" });
  useEffect(() => {
    let alive = true;
    content.loadManifest().then(
      m => { if (alive) setState({ status: "ready", data: m }); },
      (e: unknown) => { if (alive) setState({ status: "error", error: e instanceof Error ? e : new Error(String(e)) }); },
    );
    return () => { alive = false; };
  }, [content]);
  return state;
}

/** Carrega uma área disponível; guarda o total de marcos para o progresso. */
export function useArea(slug: string | undefined, enabled = true): Loadable<AreaIndex> {
  const { content, store } = useServices();
  const [state, setState] = useState<{ slug?: string; value: Loadable<AreaIndex> }>({ value: { status: "loading" } });
  useEffect(() => {
    if (!slug || !enabled) return;
    let alive = true;
    content.loadArea(slug).then(
      a => {
        if (!alive) return;
        store.setTotal(a.slug, a.allMarks.length);
        setState({ slug, value: { status: "ready", data: a } });
      },
      (e: unknown) => { if (alive) setState({ slug, value: { status: "error", error: e instanceof Error ? e : new Error(String(e)) } }); },
    );
    return () => { alive = false; };
  }, [content, store, slug, enabled]);
  return state.slug === slug ? state.value : { status: "loading" };
}
