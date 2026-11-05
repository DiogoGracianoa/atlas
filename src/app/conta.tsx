// Interface de conta e sincronização (RN11, RN18): indicador, painel, login
// por link e código e saída. Visitantes (aparelho sem "já entrou") não veem
// nada disso; o autor entra por /entrar.
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { AuthError, SyncStatus } from "../core/sync";
import { Button } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";
import { useToast } from "../ui/Toast";
import { markAccountSeen, useAccountSeen } from "./account";
import { useServices, useSyncState } from "./context";
import s from "./conta.module.css";

export const STATUS_TEXT: Record<SyncStatus, string> = {
  "nao-sincronizado": "Não sincronizado",
  sincronizando: "Sincronizando…",
  sincronizado: "Sincronizado",
  offline: "Offline",
};

export const AUTH_ERR: Record<AuthError, string> = {
  email: "Digite um e-mail válido.",
  remoto: "Não foi possível enviar agora. Confira o e-mail e tente de novo.",
  codigo: "O código tem 6 dígitos.",
  invalido: "Código inválido ou expirado. Peça um novo.",
  indisponivel: "A sincronização está indisponível agora. Tente de novo com conexão.",
};

/** Marca o aparelho como "já entrou" quando aparece uma sessão e avisa quem entrou. */
export function useAccountTracker() {
  const sync = useSyncState();
  const { storage } = useServices();
  const toast = useToast();
  const last = useRef<string | null>(null);
  const uid = sync.user?.id ?? null;
  const email = sync.user?.email ?? "";
  useEffect(() => {
    if (uid && uid !== last.current) {
      markAccountSeen(storage);
      toast("Conectado como " + email + ".");
    }
    last.current = uid;
  }, [uid, email, storage, toast]);
}

/** Formulário de login em dois passos: e-mail → código (ou link no e-mail). */
export function LoginForm({ onDone }: { onDone?: () => void }) {
  const { sync } = useServices();
  const state = useSyncState();
  const toast = useToast();
  const [step, setStep] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const emailId = useId(), codeId = useId();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (step === "codigo") codeRef.current?.focus(); }, [step]);

  const linkMsg = state.linkError === "expirado" ? "O link expirou ou já foi usado. Peça um novo ou use o código."
    : state.linkError === "falhou" ? "Não foi possível entrar pelo link. Peça um novo ou use o código." : "";

  async function pedir(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const r = await sync.requestCode(email);
    setBusy(false);
    if (r.ok) {
      setEmail(email.trim().toLowerCase()); setStep("codigo"); setMsg("");
      if (!e) toast("Enviamos um novo link e código.");
    } else setMsg(AUTH_ERR[r.error]);
  }

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await sync.verifyCode(email, code);
    setBusy(false);
    if (r.ok) { setMsg(""); onDone?.(); }
    else setMsg(AUTH_ERR[r.error]);
  }

  if (step === "codigo") {
    return (
      <form className={s.form} onSubmit={entrar}>
        <p>Enviamos um link e um código para <b>{email}</b>. Abra o link neste aparelho ou digite o código:</p>
        <label htmlFor={codeId} className={s.label}>Código de 6 dígitos</label>
        <input id={codeId} ref={codeRef} className={s.code} inputMode="numeric" autoComplete="one-time-code" maxLength={12}
          placeholder="000000" value={code} onChange={e => setCode(e.target.value)} />
        <div className={s.row}>
          <Button type="submit" variant="primary" disabled={busy}>Entrar</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void pedir()}>Reenviar</Button>
          <Button variant="ghost" onClick={() => { setStep("email"); setMsg(""); setCode(""); }}>Trocar e-mail</Button>
        </div>
        <p className={s.msg} role="alert">{msg || linkMsg}</p>
      </form>
    );
  }
  return (
    <form className={s.form} onSubmit={pedir}>
      <p>Entre com seu e-mail. Enviamos um link e um código de 6 dígitos. Sem login, o progresso fica só neste aparelho.</p>
      <label htmlFor={emailId} className={s.label}>E-mail</label>
      <input id={emailId} className={s.field} type="email" autoComplete="email" inputMode="email"
        placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      <div className={s.row}>
        <Button type="submit" variant="primary" disabled={busy}>Enviar link e código</Button>
      </div>
      <p className={s.msg} role="alert">{msg || linkMsg}</p>
    </form>
  );
}

function AccountBody({ onClose }: { onClose: () => void }) {
  const { sync } = useServices();
  const state = useSyncState();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (state.user) {
    return (
      <div className={s.form}>
        <p>Conectado como <b>{state.user.email}</b>. {STATUS_TEXT[state.status]}.</p>
        <div className={s.row}>
          <Button disabled={busy} onClick={async () => {
            setBusy(true);
            await sync.signOut();
            setBusy(false);
            onClose();
            toast("Você saiu. O progresso continua neste aparelho.");
          }}>Sair deste aparelho</Button>
        </div>
        <p className={s.note}>Ao sair, suas marcações e anotações continuam neste aparelho.</p>
      </div>
    );
  }
  if (!state.available) {
    return (
      <p>
        {state.reason === "sem-config"
          ? "A sincronização ainda não foi configurada neste site. O progresso fica salvo neste aparelho."
          : "Não foi possível carregar a sincronização agora. O progresso continua salvo neste aparelho e sobe quando ela voltar."}
      </p>
    );
  }
  return <LoginForm onDone={onClose} />;
}

/** Indicador no cabeçalho: só aparece em aparelho onde alguém já entrou (RN18). */
export function SyncIndicator() {
  const seen = useAccountSeen();
  const state = useSyncState();
  const [open, setOpen] = useState(false);
  if (!seen) return null;
  const text = STATUS_TEXT[state.status];
  return (
    <>
      <button type="button" className={s.indicator} data-status={state.status} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <i aria-hidden="true" />
        <span className={s.indicatorText}>{text}</span>
        <span className="visually-hidden">: abrir conta e sincronização</span>
      </button>
      <Sheet open={open} title={state.user ? "Sincronização" : "Sincronizar entre aparelhos"} onClose={() => setOpen(false)}>
        <AccountBody onClose={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
