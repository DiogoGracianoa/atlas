// Diagrama de um tema (Mermaid). O Mermaid é grande, então é carregado só
// quando um tema com diagrama abre, num chunk à parte, fora do precache: na
// primeira vez precisa de rede, e depois fica no cache (KW1, extensão de
// 2026-11-06). As cores vêm do tema atual e da trilha do tema (--accent).
import { useEffect, useId, useRef, useState } from "react";
import s from "./Diagrama.module.css";

type Estado = "carregando" | "ok" | "offline" | "erro";

const css = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

/** Re-renderiza quando o sistema troca entre claro e escuro (tema "auto"). */
function useSystemDark(): boolean {
  const query = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const [dark, setDark] = useState(() => !!query?.matches);
  useEffect(() => {
    if (!query) return;
    const on = () => setDark(query.matches);
    query.addEventListener?.("change", on);
    return () => query.removeEventListener?.("change", on);
  }, [query]);
  return dark;
}

/** `theme`: preferência atual (auto, light, dark); só serve para redesenhar ao trocar. */
export function Diagrama({ code, caption, theme = "auto" }: { code: string; caption: string; theme?: string }) {
  const systemDark = useSystemDark();
  const box = useRef<HTMLDivElement>(null);
  const fig = useRef<HTMLElement>(null);
  const rawId = useId();
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    let vivo = true;
    const id = "d" + rawId.replace(/[^a-zA-Z0-9]/g, "");
    (async () => {
      let mermaid;
      try {
        mermaid = (await import("mermaid")).default;
      } catch {
        if (vivo) setEstado("offline");
        return;
      }
      const el = fig.current ?? document.documentElement;
      const accent = css(el, "--accent") || css(el, "--brand");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: css(el, "--font-ui") || "system-ui",
        themeVariables: {
          background: css(el, "--surface"),
          primaryColor: css(el, "--surface-alt"),
          primaryTextColor: css(el, "--text"),
          primaryBorderColor: accent,
          lineColor: css(el, "--muted"),
          secondaryColor: css(el, "--brand-soft"),
          tertiaryColor: css(el, "--surface"),
          noteBkgColor: css(el, "--brand-soft"),
          noteTextColor: css(el, "--text"),
          actorBorder: accent,
          signalColor: css(el, "--text"),
          quadrant1Fill: css(el, "--surface-alt"),
        },
      });
      try {
        const { svg } = await mermaid.render(id, code);
        if (!vivo || !box.current) return;
        // O SVG vem do Mermaid em modo "strict" (sanitizado pelo DOMPurify) e o
        // código é conteúdo próprio, validado pelo scripts/validate.mjs.
        box.current.innerHTML = svg;
        const el2 = box.current.querySelector("svg");
        el2?.setAttribute("role", "img");
        el2?.setAttribute("aria-label", caption);
        setEstado("ok");
      } catch {
        document.getElementById("d" + id)?.remove();
        if (vivo) setEstado("erro");
      }
    })();
    return () => { vivo = false; };
  }, [code, caption, rawId, theme, systemDark]);

  return (
    <figure ref={fig} className={s.figure} aria-label={caption}>
      <div ref={box} className={s.box} data-estado={estado} />
      {estado === "carregando" && <p className={s.status} role="status">Desenhando o diagrama…</p>}
      {(estado === "offline" || estado === "erro") && (
        <div className={s.fallback}>
          <p className={s.status}>
            {estado === "offline" ? "O diagrama precisa de conexão na primeira vez." : "Não foi possível desenhar este diagrama."}
          </p>
          <details>
            <summary>Ver o texto do diagrama</summary>
            <pre>{code}</pre>
          </details>
        </div>
      )}
      <figcaption className={s.caption}>{caption}</figcaption>
    </figure>
  );
}
