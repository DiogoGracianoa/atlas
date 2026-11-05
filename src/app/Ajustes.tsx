// Ajustes de leitura (RN12): tamanho do texto e tema, guardados por aparelho
// (nunca sincronizados).
import { useState } from "react";
import type { Size, Theme } from "../core/types";
import { IconButton, Segmented } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";
import { useAppState, useServices } from "./context";

const SIZES: { value: Size; label: string; title: string }[] = [
  { value: "s", label: "P", title: "Texto pequeno" },
  { value: "m", label: "M", title: "Texto médio" },
  { value: "l", label: "G", title: "Texto grande" },
  { value: "xl", label: "GG", title: "Texto muito grande" },
];
const THEMES: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

export function Ajustes() {
  const { store } = useServices();
  const state = useAppState();
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton label="Ajustes de leitura" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
      </IconButton>
      <Sheet open={open} title="Ajustes de leitura" onClose={() => setOpen(false)}>
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 600 }} id="aj-tamanho">Tamanho do texto</span>
          <Segmented label="Tamanho do texto" value={state.size} options={SIZES} onChange={v => store.setPref("size", v)} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Tema</span>
          <Segmented label="Tema" value={state.theme} options={THEMES} onChange={v => store.setPref("theme", v)} />
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: ".88rem" }}>Os ajustes valem só para este aparelho.</p>
      </Sheet>
    </>
  );
}
