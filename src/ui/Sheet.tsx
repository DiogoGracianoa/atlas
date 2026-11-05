// Painel modal acessível: folha inferior no celular, diálogo centralizado no PC.
// Prende o foco enquanto aberto, fecha com Esc ou clique fora e devolve o foco
// a quem abriu (RN12, U03).
import { useEffect, useId, useRef, type ReactNode } from "react";
import s from "./Sheet.module.css";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Sheet({ open, title, onClose, children, side = "bottom" }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; side?: "bottom" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const a = items[0] as HTMLElement, z = items[items.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={s.layer}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={side === "left" ? s.drawer : s.panel}>
        <div className={s.head}>
          <h2 id={titleId} className={s.title}>{title}</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
