// Peças reutilizadas nas páginas do atlas.
import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useAppState, useServices, useSyncState } from "../../../app/context";
import { useAccountSeen } from "../../../app/account";
import type { AreaIndex, ItemNode, MarkKind } from "../../../core/types";
import { useToast } from "../../../ui/Toast";
import { isDone, itemName, itemPath, promptFor } from "../model";
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
 * não troca o texto enquanto o campo tem foco; é aplicada ao sair dele (P08).
 */
export function Notes({ n }: { n: ItemNode }) {
  const { store } = useServices();
  useAppState();
  const sync = useSyncState();
  const seen = useAccountSeen();
  const stored = store.note(n.key);
  const [text, setText] = useState(stored);
  const [prevStored, setPrevStored] = useState(stored);
  const [focused, setFocused] = useState(false);
  const id = useId(), hid = useId();

  // Mudou no store (sincronização, importação): acompanha, a menos que o campo
  // esteja em uso. (Ajuste de estado durante a renderização, sem efeito.)
  if (stored !== prevStored) {
    setPrevStored(stored);
    if (!focused) setText(stored);
  }

  return (
    <section className={s.block} aria-labelledby={hid}>
      <h2 id={hid} className={s.blockTitle}><label htmlFor={id}>Suas anotações</label></h2>
      <textarea
        id={id}
        className={s.notes}
        value={text}
        placeholder="Resuma com suas palavras: 3 conceitos, 1 exemplo concreto, 1 dúvida e 1 discordância."
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setText(store.note(n.key)); }}
        onChange={e => { setText(e.target.value); store.setNote(n.key, e.target.value); }}
      />
      <div className={s.noteMeta}>
        <span>{seen && sync.user ? "Salva neste aparelho e sincronizada" : "Salva neste aparelho"}</span>
        <span>{text.length} caracteres</span>
      </div>
    </section>
  );
}

export function Pager({ a, n }: { a: AreaIndex; n: ItemNode }) {
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
