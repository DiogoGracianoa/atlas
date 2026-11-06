// Tipos do domínio do Atlas: estado local (contrato K4), operações, linhas do
// Supabase (K3) e conteúdo (K1/K2). Nada aqui depende de React.

export type MarkKind = "def" | "vid" | "book" | "do";
export type Size = "s" | "m" | "l" | "xl";
export type Theme = "auto" | "light" | "dark";

/** Horário ISO 8601 em UTC ("2026-11-04T10:00:00.000Z"). */
export type IsoTime = string;

export interface MarkEntry {
  done: boolean;
  at: IsoTime;
}

export interface NoteBase {
  body: string;
  at: IsoTime;
}

export interface NoteEntry {
  body: string;
  at: IsoTime;
  /** Última versão confirmada pelo servidor; base da detecção de conflito. */
  base: NoteBase | null;
}

export interface LastAt {
  /** Chave de item "área/id". */
  route: string;
  at: IsoTime;
}

/** Estado local v3 (chave `atlas-v3`). */
export interface State {
  v: 3;
  marks: Record<string, MarkEntry>;
  notes: Record<string, NoteEntry>;
  lastAt: LastAt | null;
  resetAt: IsoTime | null;
  totals: Record<string, number>;
  size: Size;
  theme: Theme;
}

/** Subconjunto de `Storage` que o app usa (permite armazenamento em memória nos testes). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Operação já decidida (importação, sincronização ou Zerar). */
export type Op =
  | { type: "mark"; key: string; value: MarkEntry }
  | { type: "note"; key: string; value: { body: string; at: IsoTime; base?: NoteBase | null } }
  | { type: "last"; value: LastAt };

export type StoreEvent =
  | { type: "mark"; key: string; item: string; area: string; mark: MarkKind; done: boolean; at: IsoTime }
  | { type: "note"; key: string; item: string; area: string; body: string; at: IsoTime }
  | { type: "pref"; name: "size" | "theme"; value: Size | Theme }
  | { type: "last"; route: string; at: IsoTime }
  | { type: "local" }
  | { type: "batch"; ops: Op[]; silent: boolean };

/* ---------- linhas do Supabase (contrato K3) ---------- */

export type Table = "progress" | "notes" | "prefs";

export interface ProgressRow {
  area: string;
  item_id: string;
  mark: string;
  done: boolean;
  updated_at: string;
}

export interface NoteRow {
  area: string;
  item_id: string;
  body: string;
  updated_at: string;
}

export interface PrefsRow {
  last_at: string;
  updated_at: string;
}

export type QueueOp =
  | { table: "progress"; row: ProgressRow }
  | { table: "notes"; row: NoteRow }
  | { table: "prefs"; row: PrefsRow };

export type QueueItem = QueueOp & { key: string };

/* ---------- conteúdo (contratos K1 e K2) ---------- */

export interface Tradicao {
  nome: string;
  cor: string;
  corEscura: string;
}

export interface AreaMeta {
  slug: string;
  nome: string;
  resumo?: string;
  status: "disponivel" | "planejado";
  arquivo?: string;
  titulo?: string;
  subtitulo?: string;
  tituloPdf?: string;
  capa?: { rotulo: string; lead: string; passos: { t: string; d: string }[] };
  tradicoes?: Record<string, Tradicao>;
  promptBase?: string;
  /** Agrupador (K1 v2): a área não tem currículo próprio; cada subtema tem. */
  subtemas?: AreaMeta[];
}

export interface Manifest {
  areas: AreaMeta[];
}

export interface Video {
  title: string;
  source: string;
  url: string;
  focus: string;
}

export interface Book {
  title: string;
  author: string;
  url: string;
  label: string;
  level: string;
  focus: string;
}

export interface Step {
  id: string;
  title: string;
  tagline: string;
  tradition: string;
  effort?: string;
  definition: string[];
  concepts: { t: string; d: string }[];
  theses: string[];
  debate?: string[];
  videos?: Video[];
  book?: Book | null;
  bridge?: string;
  check: string[];
}

export interface Workshop {
  id: string;
  title: string;
  brief: string;
  exercise: string;
  deliverable: string;
}

export interface Module {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  level: string;
  overview: string;
  goals: string[];
  workshop: Workshop;
  steps: Step[];
}

export interface Curriculum {
  modules: Module[];
}

interface NodeBase {
  /** Módulo a que o item pertence. */
  mod: Module;
  /** Slug da área. */
  area: string;
  /** Chave canônica "área/id". */
  key: string;
}

export type StepNode = Step & NodeBase & { kind: "step" };
export type WorkshopNode = Workshop & NodeBase & { kind: "workshop" };
export type ItemNode = StepNode | WorkshopNode;

export interface MarkInfo {
  k: MarkKind;
  label: string;
}

export interface AreaStats {
  modulos: number;
  temas: number;
  livros: number;
  videos: number;
}

export interface AreaIndex {
  slug: string;
  meta: AreaMeta;
  data: Curriculum;
  nodes: ItemNode[];
  byId: Record<string, ItemNode>;
  byKey: Record<string, ItemNode>;
  marksOf: (n: ItemNode) => MarkInfo[];
  allMarks: string[];
  stats: AreaStats;
}
