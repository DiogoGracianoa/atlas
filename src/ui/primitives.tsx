// Primitivos do design system: botões, cartão, etiqueta, progresso e
// controle segmentado. Todos com foco visível (global.css) e nome acessível.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import s from "./ui.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({ variant = "secondary", block, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return <button type="button" className={cx(s.button, s[variant], block && s.block, className)} {...rest} />;
}

export function ButtonLink({ to, variant = "secondary", children }: { to: string; variant?: Variant; children: ReactNode }) {
  return <Link to={to} className={cx(s.button, s[variant])}>{children}</Link>;
}

/** Botão só com ícone: `label` é obrigatório (nome acessível). */
export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx(s.iconButton, className)} {...rest}>
      {children}
    </button>
  );
}

export function Card({ to, muted, children, className, labelledBy }: { to?: string; muted?: boolean; children: ReactNode; className?: string; labelledBy?: string }) {
  const cls = cx(s.card, muted && s.cardMuted, className);
  if (to) return <Link to={to} className={cls} aria-labelledby={labelledBy}>{children}</Link>;
  return <article className={cls} aria-labelledby={labelledBy}>{children}</article>;
}
export const cardTitleClass = s.cardTitle;

export function Tag({ children, color, dot }: { children: ReactNode; color?: string; dot?: boolean }) {
  return (
    <span className={s.tag} style={color ? { color } : undefined}>
      {dot && <span className={s.tagDot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((100 * Math.min(value, max)) / max) : 0;
  return (
    <div className={s.progress}>
      <div className={s.progressTrack} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)} aria-valuetext={`${pct}%`}>
        <div className={s.progressBar} style={{ width: pct + "%" }} />
      </div>
      <span className={s.progressLabel}>{label}: {pct}%</span>
    </div>
  );
}

/** Grupo de botões alternáveis (um ativo por vez). */
export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string; title?: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className={s.segmented}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} title={o.title} aria-label={o.title} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
