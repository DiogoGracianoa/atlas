// Contrato K-C1: conteúdo de um concurso (concurso.json + teoria + questões).
// Dado, não código: outro concurso é só outro conjunto destes arquivos (RN23).

export type Validacao = "verificado" | "pendente" | "divergente";
export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface Fonte {
  id: string;
  documento: string;
  versao: string;
  /** Data de publicação, AAAA-MM-DD. */
  data: string;
  url: string;
}

export interface RefFonte {
  ref: string;
  pagina?: number;
  item?: string;
  trecho?: string;
}

export interface DisciplinaProva {
  id: string;
  questoes: number;
  peso: number;
}

export interface CriterioDiscursiva {
  id: string;
  nome: string;
  max: number;
}

export interface Prova {
  data: string;
  fuso: string;
  turno?: string;
  fonte: RefFonte;
  objetiva: { questoes: number; alternativas: number; minimo: number; duracaoMin: number; fonte: RefFonte; disciplinas: DisciplinaProva[] };
  discursiva?: { questoes: number; pontos: number; linhas: number; minimoPct: number; criterios: CriterioDiscursiva[]; fonte: RefFonte };
}

export interface Topico {
  id: string;
  titulo: string;
  subtopicos: string[];
  opcional?: boolean;
  /** Obrigatória em tópico não opcional (RN01). */
  fonte?: RefFonte;
  validacao?: Validacao;
  /** Teoria e questões prontas (RN25, RN28). */
  publicado?: boolean;
  /** Observação de validação (ex.: divergência de nome de lei). */
  nota?: string;
}

export interface Modulo {
  id: string;
  nome: string;
  topicos: Topico[];
}

export interface Disciplina {
  id: string;
  nome: string;
  sigla: string;
  modulos: Modulo[];
}

export interface Semana {
  n: number;
  inicio: string;
  fim: string;
  titulo: string;
  topicos: string[];
  /** Tópicos de semanas anteriores revisitados nesta semana. */
  revisar?: string[];
  /** Orientação por disciplina (id → texto), sugestão pedagógica. */
  notas?: Record<string, string>;
  meta: string;
}

export interface Concurso {
  concurso: { nome: string; orgao: string; edital: string; banca: string; cargo: { codigo: string; nome: string } };
  fontes: Fonte[];
  prova: Prova;
  disciplinas: Disciplina[];
  trilha: { inicio: string; fim: string; horasSemana: number; semanas: Semana[] };
  /** Rotina sugerida: disciplinas (ids) ou atividades por dia. */
  rotina: Record<DiaSemana, { foco: string[]; horas: number }>;
  revisao: { dias: number[] };
  /** Atividades da rotina que não são disciplinas (rótulos). */
  atividades: Record<string, string>;
}

export interface Teoria {
  objetivos: string[];
  explicacao: string[];
  exemplos: { enunciado: string; resolucao: string }[];
  conceitos: { t: string; d: string }[];
  dominio: string[];
  /** Fontes consultadas (obrigatórias para fatos do município, pelo guia de conteúdo). */
  fontes?: { titulo: string; url: string }[];
}

export interface Questao {
  id: string;
  topico: string;
  enunciado: string;
  alternativas: string[];
  /** Índice da alternativa correta (0–3). */
  gabarito: number;
  comentario: string;
  origem: "autoral" | { fonte: string; url: string };
}

export interface CasoDiscursiva {
  id: string;
  topicos: string[];
  caso: string;
  pede: string;
  espelho: string[];
}
