// Registros do estudante (contrato K-R1, ADR-0015): estados e eventos do
// preparatório, numa chave local própria. Única porta de escrita: grava no
// localStorage antes de avisar (como o store). Cada registro guarda o horário
// da edição; a mescla com o servidor fica com o mais recente.
import { validAt } from "./merge";
import type { IsoTime, StorageLike } from "./types";

export const REGISTROS_KEY = "atlas-registros-v1";
const TIPO = /^[a-z][a-z-]{1,31}$/;
const AREA = /^[a-z0-9-]{1,64}$/;
export const CORPO_MAX = 16384;

export type Corpo = Record<string, unknown>;

export interface Registro {
  tipo: string;
  id: string;
  area: string;
  corpo: Corpo;
  at: IsoTime;
}

export type RegistroEvent =
  | { type: "registro"; reg: Registro }
  | { type: "batch"; regs: Registro[]; silent: boolean };

export interface Registros {
  /** Muda a cada alteração (para a interface assinar). */
  readonly versao: number;
  on(fn: (e: RegistroEvent) => void): () => void;
  get(tipo: string, id: string): Registro | null;
  lista(tipo: string, area?: string): Registro[];
  todos(): Registro[];
  put(tipo: string, id: string, area: string, corpo: Corpo): Registro;
  /** Evento novo, com id único. */
  evento(tipo: string, area: string, corpo: Corpo): Registro;
  /** Aplica versões vindas de fora (sincronização, backup), se mais recentes. */
  applyOps(regs: Registro[], opts?: { silent?: boolean }): Registro[];
  /** "Zerar tudo": troca cada registro por uma marca de exclusão e envia. */
  resetAll(): void;
  /** Horário do último "Zerar tudo" visto pelos registros. */
  readonly resetAt: IsoTime | null;
  setResetAt(at: IsoTime): void;
}

const chave = (tipo: string, id: string) => tipo + ":" + id;
/** Registro excluído (por "Zerar tudo"): fica guardado para sincronizar, mas não aparece. */
export const apagado = (r: Registro | null | undefined) => !!r && r.corpo.apagado === true;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export function registroValido(r: unknown): r is Registro {
  if (!isObj(r)) return false;
  return typeof r.tipo === "string" && TIPO.test(r.tipo)
    && typeof r.id === "string" && r.id.length >= 1 && r.id.length <= 200
    && typeof r.area === "string" && AREA.test(r.area)
    && isObj(r.corpo) && JSON.stringify(r.corpo).length <= CORPO_MAX
    && validAt(r.at);
}

const defaultUuid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export function createRegistros({ storage, now = () => new Date().toISOString(), uuid = defaultUuid }: {
  storage: StorageLike; now?: () => IsoTime; uuid?: () => string;
}): Registros {
  const itens = new Map<string, Registro>();
  let resetAt: IsoTime | null = null;
  try {
    const p: unknown = JSON.parse(storage.getItem(REGISTROS_KEY) || "null");
    if (isObj(p)) {
      if (isObj(p.itens)) for (const r of Object.values(p.itens)) if (registroValido(r)) itens.set(chave(r.tipo, r.id), { ...r });
      if (validAt(p.resetAt)) resetAt = p.resetAt;
    }
  } catch { /* começa vazio */ }

  let versao = 0;
  const subs = new Set<(e: RegistroEvent) => void>();
  const save = () => { try { storage.setItem(REGISTROS_KEY, JSON.stringify({ v: 1, resetAt, itens: Object.fromEntries(itens) })); } catch { /* segue em memória */ } };
  const emit = (e: RegistroEvent) => { versao++; subs.forEach(fn => { try { fn(e); } catch (err) { console.error(err); } }); };

  function put(tipo: string, id: string, area: string, corpo: Corpo): Registro {
    const reg: Registro = { tipo, id, area, corpo, at: now() };
    if (!registroValido(reg)) throw new Error("Registro inválido: " + tipo + ":" + id);
    itens.set(chave(tipo, id), reg);
    save();
    emit({ type: "registro", reg });
    return reg;
  }

  return {
    get versao() { return versao; },
    get resetAt() { return resetAt; },
    on: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    get: (tipo, id) => { const r = itens.get(chave(tipo, id)); return r && !apagado(r) ? r : null; },
    lista: (tipo, area) => [...itens.values()].filter(r => r.tipo === tipo && !apagado(r) && (area === undefined || r.area === area)),
    todos: () => [...itens.values()],
    put,
    evento: (tipo, area, corpo) => put(tipo, uuid(), area, corpo),
    applyOps(regs, { silent = false } = {}) {
      const aplicados: Registro[] = [];
      for (const r of regs) {
        if (!registroValido(r)) continue;
        const k = chave(r.tipo, r.id);
        const cur = itens.get(k);
        if (cur && cur.at >= r.at) continue;
        itens.set(k, { ...r });
        aplicados.push(r);
      }
      if (aplicados.length) { save(); emit({ type: "batch", regs: aplicados, silent }); }
      return aplicados;
    },
    setResetAt(at) { resetAt = at; save(); },
    resetAll() {
      const at = now();
      resetAt = at;
      const tomb = [...itens.values()].filter(r => !apagado(r)).map(r => ({ ...r, corpo: { apagado: true }, at }));
      for (const r of tomb) itens.set(chave(r.tipo, r.id), r);
      save();
      if (tomb.length) emit({ type: "batch", regs: tomb, silent: false });
    },
  };
}
