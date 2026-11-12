// Moldura comum a todas as páginas: link para pular ao conteúdo, cabeçalho
// com a marca e o espaço da página. As seções desenham a própria navegação.
import { useEffect, useRef } from "react";
import { Link, Outlet, ScrollRestoration, useLocation } from "react-router";
import { useAppState } from "./context";
import { applyPrefs } from "../ui/theme";
import { HeaderActions } from "./HeaderActions";
import s from "./Layout.module.css";

export function Layout() {
  const state = useAppState();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => { applyPrefs({ theme: state.theme, size: state.size }); }, [state.theme, state.size]);

  // Troca de página: leva o foco ao conteúdo, para leitores de tela anunciarem
  // a nova página. A rolagem fica com o ScrollRestoration: topo em navegação
  // nova, posição anterior ao voltar (R08).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    main.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <>
      <ScrollRestoration />
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <header className={s.header}>
        <Link to="/" className={s.brand} aria-label="Letrume, página inicial">
          <svg viewBox="0 0 32 32" aria-hidden="true" className={s.logo}>
            <path d="M16 4.5c2.3 2.6 3.4 4.7 3.4 6.6a3.4 3.4 0 0 1-6.8 0c0-1.9 1.1-4 3.4-6.6z" />
            <path d="M16 18v8.5M12 26.5h8" />
          </svg>
          <span>Letrume</span>
        </Link>
        <HeaderActions />
      </header>
      <main id="conteudo" ref={main} tabIndex={-1} className={s.main}>
        <Outlet />
      </main>
    </>
  );
}
