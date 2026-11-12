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
  credenciais: "E-mail ou senha incorretos.",
  senha: "Não foi possível salvar a senha. Confira os requisitos e tente novamente.",
  reauth: "Para alterar a senha, saia e entre novamente, inclusive pelo código de e-mail.",
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
  const [step, setStep] = useState<"senha" | "email" | "codigo">("senha");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const emailId = useId(), codeId = useId();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (step === "codigo") codeRef.current?.focus(); }, [step]);

  const linkMsg = state.linkError === "expirado" ? "O link expirou ou já foi usado. Peça um novo ou use o código."
    : state.linkError === "falhou" ? "Não foi possível entrar pelo link. Peça um novo ou use o código." : "";

  async function entrarSenha(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await sync.signInPassword(email, password);
    setBusy(false);
    if (r.ok) { setPassword(""); setMsg(""); onDone?.(); }
    else setMsg(AUTH_ERR[r.error]);
  }

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
  if (step === "senha") return (
    <form className={s.form} onSubmit={entrarSenha}>
      <p>Entre com seu e-mail e senha para acessar o Letrume.</p>
      <label htmlFor={emailId} className={s.label}>E-mail</label>
      <input id={emailId} className={s.field} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor={codeId} className={s.label}>Senha</label>
      <input id={codeId} className={s.field} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      <div className={s.row}><Button type="submit" variant="primary" disabled={busy}>Entrar</Button></div>
      <div><Button variant="ghost" disabled={busy} onClick={() => { setPassword(""); setMsg(""); setStep("email"); }}>Entrar sem senha por código</Button></div>
      <p className={s.msg} role="alert">{msg || linkMsg}</p>
    </form>
  );
  return (
    <form className={s.form} onSubmit={pedir}>
      <p>Entre com seu e-mail para acessar o Letrume. Enviamos um link e um código de 6 dígitos.</p>
      <label htmlFor={emailId} className={s.label}>E-mail</label>
      <input id={emailId} className={s.field} type="email" autoComplete="email" inputMode="email"
        placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      <div className={s.row}>
        <Button type="submit" variant="primary" disabled={busy}>Enviar link e código</Button>
      </div>
      <Button variant="ghost" onClick={() => { setStep("senha"); setMsg(""); }}>Voltar para senha</Button>
      <p className={s.msg} role="alert">{msg || linkMsg}</p>
    </form>
  );
}

function AccountBody({ onClose, onPasswordSaved }: { onClose: () => void; onPasswordSaved: () => void }) {
  const { sync } = useServices();
  const state = useSyncState();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const passwordId = useId(), confirmationId = useId();
  async function salvarSenha(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmation) { setMessage("As senhas não coincidem."); return; }
    setBusy(true);
    const result = await sync.updatePassword(password);
    setBusy(false);
    if (result.ok) { setPassword(""); setConfirmation(""); onPasswordSaved(); }
    else setMessage(AUTH_ERR[result.error]);
  }
  if (state.user) {
    return (
      <div className={s.form}>
        <p>Conectado como <b>{state.user.email}</b>. {STATUS_TEXT[state.status]}.</p>
        <Button disabled={busy} onClick={() => { setEditing(!editing); setPassword(""); setConfirmation(""); setMessage(""); }}>Definir ou alterar senha</Button>
        {editing && <form className={s.form} onSubmit={salvarSenha}>
          <label className={s.label} htmlFor={passwordId}>Nova senha</label>
          <input className={s.field} id={passwordId} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
          <label className={s.label} htmlFor={confirmationId}>Confirmar nova senha</label>
          <input className={s.field} id={confirmationId} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} />
          <Button type="submit" variant="primary" disabled={busy}>Salvar senha</Button>
          <p role="status">{message}</p>
        </form>}
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
  const [passwordSaved, setPasswordSaved] = useState(false);
  const close = () => { setOpen(false); setPasswordSaved(false); };
  if (!seen) return null;
  const text = STATUS_TEXT[state.status];
  return (
    <>
      <button type="button" className={s.indicator} data-status={state.status} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <i aria-hidden="true" />
        <span className={s.indicatorText}>{text}</span>
        <span className="visually-hidden">: abrir conta e sincronização</span>
      </button>
      <Sheet open={open} title={passwordSaved ? "Senha alterada com sucesso" : state.user ? "Sincronização" : "Sincronizar entre aparelhos"} onClose={close}>
        {passwordSaved ? <div className={s.success} role="status">
          <svg data-testid="senha-check" className={s.successCheck} viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" /><path d="m14 24 7 7 13-14" /></svg>
          <Button variant="primary" onClick={close}>Fechar</Button>
        </div> : <AccountBody onClose={close} onPasswordSaved={() => setPasswordSaved(true)} />}
      </Sheet>
    </>
  );
}
