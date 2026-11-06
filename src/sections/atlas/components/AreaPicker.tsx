// Seletor de área do menu: botão + lista (padrão "listbox" do WAI-ARIA),
// com grupos (agrupador e subtemas) e teclado completo:
// ↑/↓, Home/End, Enter/Espaço escolhe, Esc fecha e devolve o foco.
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { AreaMeta, Manifest } from "../../../core/types";
import { leafColors } from "../model";
import s from "./AreaPicker.module.css";

interface Opcao {
  value: string;
  label: string;
  disabled: boolean;
  indent: boolean;
  color: string;
}

const isGroup = (a: AreaMeta) => !!a.subtemas?.length;
const aberta = (a: AreaMeta) => a.status === "disponivel" && !!a.arquivo && !isGroup(a);

// Só o que existe: áreas e subtemas planejados não aparecem.
function opcoes(manifest: Manifest): Opcao[] {
  const out: Opcao[] = [{ value: "", label: "Mapa do Atlas", disabled: false, indent: false, color: "var(--brand)" }];
  for (const a of manifest.areas) {
    if (isGroup(a)) {
      const subs = (a.subtemas ?? []).filter(aberta);
      if (!subs.length) continue;
      out.push({ value: a.slug, label: a.nome, disabled: false, indent: false, color: "var(--warm)" });
      for (const sub of subs) out.push({ value: sub.slug, label: sub.nome, disabled: false, indent: true, color: leafColors(sub)[0] ?? "var(--brand)" });
    } else if (aberta(a)) {
      out.push({ value: a.slug, label: a.nome, disabled: false, indent: false, color: leafColors(a)[0] ?? "var(--brand)" });
    }
  }
  return out;
}

export function AreaPicker({ manifest, value, onChange }: { manifest: Manifest; value: string; onChange: (v: string) => void }) {
  const lista = useMemo(() => opcoes(manifest), [manifest]);
  const [aberto, setAberto] = useState(false);
  const atual: Opcao = lista.find(o => o.value === value) ?? lista[0] ?? { value: "", label: "Mapa do Atlas", disabled: false, indent: false, color: "var(--brand)" };
  const [ativo, setAtivo] = useState(0);
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLUListElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();

  const abrir = () => {
    setAtivo(Math.max(0, lista.findIndex(o => o.value === value)));
    setAberto(true);
  };
  const fechar = (foco = true) => { setAberto(false); if (foco) botao.current?.focus(); };
  const escolher = (o: Opcao) => { if (o.disabled) return; fechar(); if (o.value !== value) onChange(o.value); };

  useEffect(() => { if (aberto) caixa.current?.focus(); }, [aberto]);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);
  useEffect(() => {
    if (aberto) caixa.current?.querySelector(`[data-i="${ativo}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [aberto, ativo]);

  const mover = (de: number, passo: number) => {
    let i = de;
    for (let n = 0; n < lista.length; n++) {
      i = (i + passo + lista.length) % lista.length;
      const o = lista[i];
      if (o && !o.disabled) return i;
    }
    return de;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAtivo(i => mover(i, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo(i => mover(i, -1)); }
    else if (e.key === "Home") { e.preventDefault(); setAtivo(mover(lista.length - 1, 1)); }
    else if (e.key === "End") { e.preventDefault(); setAtivo(mover(0, -1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const o = lista[ativo]; if (o) escolher(o); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); }
    else if (e.key === "Tab") fechar(false);
  };

  return (
    <div className={s.picker} ref={raiz}>
      <span id={id + "l"} className="visually-hidden">Área</span>
      <button
        ref={botao}
        type="button"
        className={s.trigger}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-labelledby={`${id}l ${id}v`}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); abrir(); } }}
      >
        <span className={s.swatch} style={{ background: atual.color }} aria-hidden="true" />
        <span className={s.triggerText}>
          <small aria-hidden="true">Área</small>
          <span id={id + "v"}>{atual.label}</span>
        </span>
        <svg className={s.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
      </button>
      {aberto && (
        <ul
          ref={caixa}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={id + "l"}
          aria-activedescendant={`${id}o${ativo}`}
          className={s.list}
          onKeyDown={onKey}
        >
          {lista.map((o, i) => (
            // Teclado fica no listbox (padrão aria-activedescendant); o clique é atalho de mouse.
            // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events
            <li
              key={o.value || "mapa"}
              id={`${id}o${i}`}
              data-i={i}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              className={[s.option, o.indent && s.indent, i === ativo && s.active].filter(Boolean).join(" ")}
              onMouseEnter={() => { if (!o.disabled) setAtivo(i); }}
              onClick={() => escolher(o)}
            >
              <span className={s.swatch} style={{ background: o.color }} aria-hidden="true" />
              <span className={s.label}>{o.label}</span>
              {o.value === value && !o.disabled && (
                <svg className={s.check} viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
