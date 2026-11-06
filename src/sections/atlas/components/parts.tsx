// Peças reutilizadas nas páginas do atlas.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useAppState, useServices, useSyncState } from "../../../app/context";
import { useAccountSeen } from "../../../app/account";
import type { AreaIndex, ItemNode, MarkKind } from "../../../core/types";
import { useToast } from "../../../ui/Toast";
import { isDone, itemName, promptFor } from "../model";
import { useAtlas } from "../AtlasLayout";
import s from "../Page.module.css";

export function useTitle(title: string) {
  useEffect(() => { document.title = title; }, [title]);
}

export function Block({ id, title, children }: { id?: string; title?: string; children: ReactNode }) {
  const hid = useId();
  return (
    <section id={id} className={s.block} aria-labelledby={title ? hid : undefined}>
      {title && <h2 id={hid} className={s.blockTitle}>{title}</h2>}
      {children}
    </section>
  );
}

const MARK_TEXT: Record<MarkKind, [string, string]> = {
  def: ["Marcar definição como lida", "Definição lida"],
  vid: ["Marcar vídeo como assistido", "Vídeo assistido"],
  book: ["Marcar livro como lido", "Livro lido"],
  do: ["Marcar oficina como concluída", "Oficina concluída"],
};

export function MarkButton({ n, mark }: { n: ItemNode; mark: MarkKind }) {
  const { store } = useServices();
  const state = useAppState();
  const toast = useToast();
  const on = isDone(state, n.key, mark);
  return (
    <button
      type="button"
      className={s.check}
      aria-pressed={on}
      onClick={() => {
        store.setMark(n.key, mark, !on);
        toast(!on ? "Marcado como concluído." : "Marcação desfeita.");
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      {MARK_TEXT[mark][on ? 1 : 0]}
    </button>
  );
}

export function ExternalLink({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a className={primary ? s.linkPrimary : s.linkSecondary} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (abre em nova aba)</span>
    </a>
  );
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const t = document.createElement("textarea");
    t.value = text; t.style.cssText = "position:fixed;top:-2000px";
    document.body.appendChild(t); t.select();
    try { return document.execCommand("copy"); } catch { return false; } finally { t.remove(); }
  }
}

export function Tutor({ a, n }: { a: AreaIndex; n: ItemNode }) {
  const toast = useToast();
  return (
    <Block title="Estude com a IA">
      <p className={s.muted}>
        Copie a atividade e cole no chat. O prompt instrui a IA a perguntar antes de responder, mostrar objeções e não inventar citações.
      </p>
      <div className={s.actions}>
        <button type="button" className={s.buttonPrimary} onClick={async () => {
          toast((await copy(promptFor(a, n))) ? "Atividade copiada. Cole no chat da IA." : "Não foi possível copiar automaticamente.");
        }}>
          Copiar atividade
        </button>
        <ExternalLink href="https://claude.ai/new">Claude</ExternalLink>
        <ExternalLink href="https://chatgpt.com/">ChatGPT</ExternalLink>
      </div>
    </Block>
  );
}

/**
 * Anotações: cada tecla grava no aparelho. Uma mudança remota (sincronização)
 * entra no campo mesmo em uso, sem tirar o foco nem mover o cursor (P08).
 */
export function Notes({ n }: { n: ItemNode }) {
  const { store } = useServices();
  useAppState();
  const sync = useSyncState();
  const seen = useAccountSeen();
  const stored = store.note(n.key);
  const [text, setText] = useState(stored);
  const [prevStored, setPrevStored] = useState(stored);
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const id = useId(), hid = useId();

  // Mudou no store (sincronização, importação): o campo acompanha mesmo em uso.
  // Cada tecla já foi salva, então o campo não guarda nada pendente; segurar a
  // versão antiga faria a próxima tecla sobrescrever a versão mesclada
  // (achado 1 da revisão). Ajuste de estado durante a renderização, sem efeito.
  if (stored !== prevStored) {
    setPrevStored(stored);
    setText(stored);
  }

  // Mantém o foco e o cursor no lugar quando o texto vem de fora.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement !== el || caret.current === null) return;
    const pos = Math.min(caret.current, el.value.length);
    el.setSelectionRange(pos, pos);
  }, [stored]);

  return (
    <section className={s.block} aria-labelledby={hid}>
      <h2 id={hid} className={s.blockTitle}><label htmlFor={id}>Suas anotações</label></h2>
      <textarea
        id={id}
        ref={ref}
        className={s.notes}
        value={text}
        placeholder="Resuma com suas palavras: 3 conceitos, 1 exemplo concreto, 1 dúvida e 1 discordância."
        onSelect={e => { caret.current = e.currentTarget.selectionStart; }}
        onChange={e => { caret.current = e.target.selectionStart; setText(e.target.value); store.setNote(n.key, e.target.value); }}
      />
      <div className={s.noteMeta}>
        <span>{seen && sync.user ? "Salva neste aparelho e sincronizada" : "Salva neste aparelho"}</span>
        <span>{text.length} caracteres</span>
      </div>
    </section>
  );
}

export function Pager({ a, n }: { a: AreaIndex; n: ItemNode }) {
  const { paths } = useAtlas();
  const itemPath = paths.itemPath;
  const i = a.nodes.findIndex(x => x.key === n.key);
  const prev = i > 0 ? a.nodes[i - 1] : null;
  const next = i < a.nodes.length - 1 ? a.nodes[i + 1] : null;
  return (
    <nav className={s.pager} aria-label="Navegação entre itens">
      {prev ? <Link to={itemPath(prev.key)} rel="prev"><small>Anterior</small>{itemName(prev)}</Link> : <span aria-disabled="true"><small>Anterior</small>Começo do roteiro</span>}
      {next ? <Link to={itemPath(next.key)} rel="next" className={s.next}><small>Próximo</small>{itemName(next)}</Link> : <span aria-disabled="true" className={s.next}><small>Próximo</small>Fim do roteiro</span>}
    </nav>
  );
}

export function BackupNote() {
  const sync = useSyncState();
  const seen = useAccountSeen();
  const where = seen && sync.user ? "ficam salvos neste aparelho e sincronizados com a sua conta" : "ficam salvos neste aparelho";
  return (
    <p className={s.backupNote}>
      O progresso e as anotações {where}. Use <b>Exportar</b> no menu para guardar uma cópia, e <b>Salvar em PDF</b> para gerar o roteiro inteiro em um arquivo de leitura.
    </p>
  );
}
