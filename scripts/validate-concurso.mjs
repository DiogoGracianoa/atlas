// Validação do tipo "concurso" (contrato K-C1), chamada por validate.mjs.
// Cada problema sai como "<slug>/<onde>: <campo ou regra>".
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const VALIDACAO = ["verificado", "pendente", "divergente"];
const DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9-]+$/;

const present = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
const isDate = (s) => typeof s === "string" && ISO.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
const nextDay = (s) => new Date(Date.parse(s + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
const nonEmptyStrings = (a) => Array.isArray(a) && a.length > 0 && a.every(x => typeof x === "string" && x.trim());

/**
 * @param {object} area entrada do manifesto (tipo "concurso")
 * @param {{ readJSON(rel: string, where: string): any, exists(rel: string): boolean, err(where: string, msg: string): void, checkUrls(v: any, where: string): void }} io
 */
export function validateConcurso(area, io) {
  const slug = area.slug;
  const e = (where, msg) => io.err(slug + "/" + where, msg);
  for (const f of ["arquivo", "titulo", "tituloPdf", "tradicoes"]) if (!present(area[f])) io.err(slug, "campo obrigatório no manifesto: " + f);
  if (!present(area.arquivo)) return;
  const c = io.readJSON(area.arquivo, slug);
  if (!c) return;
  const base = dirname(area.arquivo).split("\\").join("/");
  const trad = area.tradicoes || {};

  // Fontes e referências (RN01, RN04).
  const fontes = new Map();
  for (const [i, f] of (Array.isArray(c.fontes) ? c.fontes : []).entries()) {
    const w = "fonte " + (f && f.id ? f.id : i + 1);
    for (const k of ["id", "documento", "versao", "url"]) if (!present(f && f[k])) e(w, k);
    if (!isDate(f && f.data)) e(w, "data");
    if (f && f.id) fontes.set(f.id, f);
  }
  if (!fontes.size) e("fontes", "lista vazia");
  const checkRef = (ref, where, { pagina = false } = {}) => {
    if (!ref || typeof ref !== "object") { e(where, "fonte"); return; }
    if (!fontes.has(ref.ref)) e(where, "fonte.ref desconhecida: " + ref.ref);
    if (pagina && !(Number.isInteger(ref.pagina) && ref.pagina > 0)) e(where, "fonte.pagina");
    if (!pagina && !present(ref.pagina) && !present(ref.item)) e(where, "fonte.pagina ou fonte.item");
  };

  if (!c.concurso || !present(c.concurso.nome) || !c.concurso.cargo) e("concurso", "nome e cargo");

  // Prova.
  const p = c.prova || {};
  if (!isDate(p.data)) e("prova", "data");
  if (!present(p.fuso)) e("prova", "fuso");
  if (p.fonte) checkRef(p.fonte, "prova"); else e("prova", "fonte");
  const ob = p.objetiva || {};
  if (ob.fonte) checkRef(ob.fonte, "prova.objetiva"); else e("prova.objetiva", "fonte");
  const discIds = new Set((c.disciplinas || []).map(d => d && d.id));
  const somaQ = (ob.disciplinas || []).reduce((a, d) => a + (Number(d && d.questoes) || 0), 0);
  if (somaQ !== ob.questoes) e("prova.objetiva", `soma das disciplinas (${somaQ}) diferente do total (${ob.questoes})`);
  for (const d of ob.disciplinas || []) {
    if (!discIds.has(d.id)) e("prova.objetiva", "disciplina desconhecida: " + d.id);
    if (!(d.peso > 0)) e("prova.objetiva", "peso de " + d.id);
  }
  if (!(ob.alternativas >= 2)) e("prova.objetiva", "alternativas");
  if (!(ob.duracaoMin > 0)) e("prova.objetiva", "duracaoMin");
  if (!(ob.minimo >= 0)) e("prova.objetiva", "minimo");
  if (p.discursiva) {
    const di = p.discursiva;
    if (di.fonte) checkRef(di.fonte, "prova.discursiva"); else e("prova.discursiva", "fonte");
    const soma = (di.criterios || []).reduce((a, k) => a + (Number(k && k.max) || 0), 0);
    if (Math.abs(soma - di.pontos) > 1e-9) e("prova.discursiva", `critérios somam ${soma}, pontos por questão ${di.pontos}`);
  }

  // Disciplinas, módulos e tópicos.
  const topicos = new Map();
  const ids = new Set();
  const useId = (id, where) => {
    if (!ID.test(id || "")) { e(where, "id inválido"); return; }
    if (ids.has(id)) e(where, "id repetido");
    ids.add(id);
  };
  if (!Array.isArray(c.disciplinas) || !c.disciplinas.length) e("disciplinas", "lista vazia");
  for (const d of c.disciplinas || []) {
    useId(d.id, "disciplina " + d.id);
    if (!present(d.nome) || !present(d.sigla)) e("disciplina " + d.id, "nome e sigla");
    if (!Object.prototype.hasOwnProperty.call(trad, d.id)) io.err(slug, "disciplina sem entrada em tradicoes: " + d.id);
    for (const m of d.modulos || []) {
      useId(m.id, "módulo " + m.id);
      if (!present(m.nome)) e(m.id, "nome");
      if (!Array.isArray(m.topicos) || !m.topicos.length) e(m.id, "módulo sem tópicos");
      for (const t of m.topicos || []) {
        useId(t.id, t.id);
        if (!present(t.titulo)) e(t.id, "titulo");
        if (!Array.isArray(t.subtopicos)) e(t.id, "subtopicos");
        if (!t.opcional) {
          if (t.fonte) checkRef(t.fonte, t.id, { pagina: true }); else e(t.id, "fonte");
          if (!VALIDACAO.includes(t.validacao)) e(t.id, "validacao");
        }
        topicos.set(t.id, { ...t, disciplina: d.id });
      }
    }
  }

  // Trilha (RN06): semanas contíguas, todas as disciplinas em cada semana,
  // cada tópico obrigatório em exatamente uma semana.
  const tr = c.trilha || {};
  const semanas = Array.isArray(tr.semanas) ? tr.semanas : [];
  if (!isDate(tr.inicio) || !isDate(tr.fim)) e("trilha", "inicio e fim");
  if (!(tr.horasSemana > 0)) e("trilha", "horasSemana");
  if (!semanas.length) e("trilha", "sem semanas");
  const onde = new Map();
  semanas.forEach((s, i) => {
    const w = "semana " + (s && s.n ? s.n : i + 1);
    if (s.n !== i + 1) e(w, "numeração fora de ordem");
    if (!isDate(s.inicio) || !isDate(s.fim) || s.fim < s.inicio) { e(w, "datas"); return; }
    if (i === 0 && s.inicio !== tr.inicio) e(w, "não começa no início da trilha");
    if (i > 0 && semanas[i - 1].fim && s.inicio !== nextDay(semanas[i - 1].fim)) e(w, `não começa no dia seguinte ao fim da semana ${i}`);
    if (i === semanas.length - 1 && s.fim !== tr.fim) e(w, "não termina no fim da trilha");
    if (!present(s.titulo)) e(w, "titulo");
    if (!present(s.meta)) e(w, "meta");
    const discs = new Set();
    for (const id of s.topicos || []) {
      const t = topicos.get(id);
      if (!t) { e(w, "tópico desconhecido: " + id); continue; }
      if (onde.has(id)) e(id, "tópico em mais de uma semana");
      onde.set(id, s.n);
      if (!t.opcional) discs.add(t.disciplina);
    }
    // Semana de revisão: tópicos já vistos, revisitados (não mudam de semana).
    for (const id of s.revisar || []) {
      const t = topicos.get(id);
      if (!t) { e(w, "tópico desconhecido em revisar: " + id); continue; }
      discs.add(t.disciplina);
    }
    for (const d of c.disciplinas || []) if (!discs.has(d.id)) e(w, "sem tópico de " + (d.sigla || d.id));
  });
  for (const t of topicos.values()) if (!t.opcional && !onde.has(t.id)) e(t.id, "tópico obrigatório fora da trilha");

  // Rotina e revisão.
  const r = c.rotina || {};
  const atividades = c.atividades || {};
  for (const dia of DIAS) {
    const x = r[dia];
    if (!x || !Array.isArray(x.foco) || !(x.horas >= 0)) { e("rotina", dia); continue; }
    for (const f of x.foco) if (!discIds.has(f) && !present(atividades[f])) e("rotina", `${dia}: foco desconhecido: ${f}`);
  }
  if (!Array.isArray(c.revisao && c.revisao.dias) || !c.revisao.dias.every(n => Number.isInteger(n) && n > 0)) e("revisao", "dias");
  io.checkUrls(c.fontes, slug + "/fontes");

  // Teoria e questões por disciplina (RN25, RN28).
  const contagem = new Map();
  const qids = new Set();
  for (const d of c.disciplinas || []) {
    const pubs = [...topicos.values()].filter(t => t.disciplina === d.id && t.publicado);
    const relT = `${base}/teoria/${d.id}.json`;
    const teoria = io.exists(relT) ? io.readJSON(relT, slug) : null;
    for (const t of pubs) {
      const x = teoria && teoria[t.id];
      if (!x) { e(t.id, "teoria ausente"); continue; }
      for (const k of ["objetivos", "explicacao", "dominio"]) if (!nonEmptyStrings(x[k])) e(t.id, "teoria." + k);
      if (!Array.isArray(x.exemplos) || !x.exemplos.length || !x.exemplos.every(ex => present(ex.enunciado) && present(ex.resolucao))) e(t.id, "teoria.exemplos");
      if (!Array.isArray(x.conceitos) || !x.conceitos.length || !x.conceitos.every(k => present(k.t) && present(k.d))) e(t.id, "teoria.conceitos");
      if (x.fontes !== undefined && !(Array.isArray(x.fontes) && x.fontes.every(f => f && present(f.titulo) && typeof f.url === "string" && f.url.startsWith("https://")))) e(t.id, "teoria.fontes");
    }
    if (teoria) io.checkUrls(teoria, slug + "/teoria/" + d.id);
    const relQ = `${base}/questoes/${d.id}.json`;
    const qs = io.exists(relQ) ? io.readJSON(relQ, slug) : [];
    if (qs && !Array.isArray(qs)) { e("questoes/" + d.id, "não é uma lista"); continue; }
    for (const q of qs || []) {
      const w = q && q.id ? q.id : "questão sem id";
      if (!ID.test(q.id || "")) e(w, "id inválido");
      else if (qids.has(q.id)) e(w, "id repetido");
      qids.add(q.id);
      const t = topicos.get(q.topico);
      if (!t) e(w, "tópico desconhecido: " + q.topico);
      else if (t.disciplina !== d.id) e(w, "tópico de outra disciplina: " + q.topico);
      if (!present(q.enunciado)) e(w, "enunciado");
      if (!nonEmptyStrings(q.alternativas) || q.alternativas.length !== 4) e(w, "alternativas (exige 4)");
      if (!(Number.isInteger(q.gabarito) && q.gabarito >= 0 && q.gabarito < 4)) e(w, "gabarito");
      if (!present(q.comentario)) e(w, "comentario");
      const o = q.origem;
      if (!(o === "autoral" || (o && typeof o === "object" && present(o.fonte) && typeof o.url === "string" && o.url.startsWith("https://")))) e(w, "origem");
      if (t) contagem.set(q.topico, (contagem.get(q.topico) || 0) + 1);
    }
  }
  for (const t of topicos.values()) {
    if (!t.publicado) continue;
    const n = contagem.get(t.id) || 0;
    if (n < 8 || n > 10) e(t.id, `${n} questões (publicado exige 8 a 10)`);
  }

  const relD = `${base}/discursiva.json`;
  if (io.exists(relD)) {
    const casos = io.readJSON(relD, slug);
    for (const k of Array.isArray(casos) ? casos : []) {
      const w = k && k.id ? k.id : "caso sem id";
      for (const f of ["id", "caso", "pede"]) if (!present(k[f])) e(w, f);
      if (!nonEmptyStrings(k.espelho)) e(w, "espelho");
      for (const id of k.topicos || []) if (!topicos.has(id)) e(w, "tópico desconhecido: " + id);
    }
  }
}

export const existsUnder = (root) => (rel) => existsSync(join(root, "private", rel));
