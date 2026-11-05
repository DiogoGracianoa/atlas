// Avisos curtos num `role="status"` (lidos por leitores de tela sem roubar o foco).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import s from "./Toast.module.css";

type ToastFn = (message: string) => void;
const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children, duration = 3200 }: { children: ReactNode; duration?: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const [seq, setSeq] = useState(0);
  const last = useRef<{ text: string; at: number } | null>(null);

  const toast = useCallback<ToastFn>((text) => {
    const now = Date.now();
    // O mesmo aviso disparado duas vezes seguidas (StrictMode, redirecionamentos) aparece uma vez.
    if (last.current && last.current.text === text && now - last.current.at < 1000) return;
    last.current = { text, at: now };
    setMessage(text);
    setSeq(n => n + 1);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), duration);
    return () => clearTimeout(t);
  }, [message, seq, duration]);

  const value = useMemo(() => toast, [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className={s.region}>
        {message && <div key={seq} className={s.toast}>{message}</div>}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
