// Atlas de Estudos — UI e render.
// O render dos temas é o do arquivo original; o que era específico da área de
// política (tradições, cores, títulos, prompt) vem de content/areas.json.
import { createContent, areaProgress } from "./lib/content.js";
import { parseRoute, hrefFor, routeForKey, LEGACY_AREA } from "./lib/routes.js";
import { createStore } from "./lib/store.js";
import { exportBackup, planImport } from "./lib/backup.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

let storage;
try { storage = window.localStorage; storage.getItem("x"); }
catch (e) { const m = new Map(); storage = { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }

const store = createStore({ storage });
const content = createContent({
  fetchJSON: async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status + " em " + url);
    return r.json();
  }
});

let route = { view: "mapa" };
let A = null;            // área aberta (índice de content.js)
let searchAll = false;   // busca em todas as áreas
let toastT;
const toast = (msg) => {
  const el = $("toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600);
};

/* ---------- cores e tradições da área ---------- */
const SAFE = /^[a-z0-9-]+$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;
const cvar = (slug, trad) => "--c-" + slug + "-" + trad;
const styled = new Set();
function injectAreaStyle(meta) {
  if (styled.has(meta.slug) || !SAFE.test(meta.slug)) return;
  styled.add(meta.slug);
  const light = [], dark = [];
  for (const [k, t] of Object.entries(meta.tradicoes || {})) {
    if (!SAFE.test(k) || !t) continue;
    if (COLOR.test(t.cor || "")) light.push(cvar(meta.slug, k) + ":" + t.cor);
    if (COLOR.test(t.corEscura || "")) dark.push(cvar(meta.slug, k) + ":" + t.corEscura);
  }
  $("area-style").textContent +=
    ":root{" + light.join(";") + "}\n" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){" + dark.join(";") + "}}\n" +
    ":root[data-theme=\"dark\"]{" + dark.join(";") + "}\n";
}
// [rótulo, variável CSS] — tradição desconhecida cai na primeira da área.
function tradOf(a, key) {
  const trads = a.meta.tradicoes || {};
  const k = Object.prototype.hasOwnProperty.call(trads, key) ? key : Object.keys(trads)[0];
  return [trads[k] ? trads[k].nome : "", cvar(a.slug, k)];
}
const firstTradVar = (a) => tradOf(a, Object.keys(a.meta.tradicoes || {})[0]);

/* ---------- progresso ---------- */
const isDone = (n, k) => store.isDone(n.key, k);
const doneCount = (n) => A.marksOf(n).filter(mk => isDone(n, mk.k)).length;
const modMarks = (m) => {
  let t = 0, d = 0;
  m.steps.concat([m.workshop]).forEach(n => { t += A.marksOf(n).length; d += doneCount(n); });
  return [d, t];
};
const areaMarks = (a) => {
  let d = 0;
  a.allMarks.forEach(k => { const m = store.state.marks[k]; if (m && m.done) d++; });
  return [d, a.allMarks.length];
};

/* ---------- preferências ---------- */
function applyPrefs() {
  const s = store.state;
  document.documentElement.setAttribute("data-size", s.size);
  if (s.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", s.theme);
  [...$("segSize").children].forEach(b => b.classList.toggle("on", b.dataset.size === s.size));
  [...$("segTheme").children].forEach(b => b.classList.toggle("on", b.dataset.theme === s.theme));
}
$("segSize").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  store.setPref("size", b.dataset.size); applyPrefs();
});
$("segTheme").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  store.setPref("theme", b.dataset.theme); applyPrefs();
});
["btnSheet","btnSheetClose"].forEach(id => $(id).addEventListener("click", () => $("sheet").classList.toggle("open")));

/* ---------- drawer ---------- */
const openDrawer = (v) => { $("drawer").classList.toggle("open", v); $("scrim").classList.toggle("open", v); };
$("btnMenu").addEventListener("click", () => openDrawer(!$("drawer").classList.contains("open")));
$("scrim").addEventListener("click", () => openDrawer(false));

function renderAreaSelect() {
  const sel = $("areaSel");
  const opts = ['<option value="">Mapa do Atlas</option>'];
  content.areas().forEach(a => {
    const ok = content.isAvailable(a.slug);
    opts.push('<option value="' + esc(a.slug) + '"' + (ok ? "" : " disabled") + ">" + esc(a.nome) + (ok ? "" : " — em breve") + "</option>");
  });
  sel.innerHTML = opts.join("");
  sel.value = A ? A.slug : "";
}
$("areaSel").addEventListener("change", e => {
  const v = e.target.value;
  navigate(v ? { view: "area", area: v } : { view: "mapa" });
  openDrawer(false);
});

/* ---------- navegação lateral ---------- */
function haystack(n) {
  const parts = [n.title || "", n.tagline || "", (n.definition || []).join(" "),
    (n.concepts || []).map(c => c.t + " " + c.d).join(" "),
    n.book ? n.book.title + " " + n.book.author : "", (n.videos || []).map(v => v.title).join(" "),
    n.exercise || "", n.brief || ""];
  return parts.join(" ").toLowerCase();
}
const curKey = () => (route.view === "item" && A ? A.slug + "/" + route.id : null);

function navModules(a, q, nav) {
  const cur = curKey();
  const dc = (n) => a.marksOf(n).filter(mk => store.isDone(n.key, mk.k)).length;
  let shown = 0;
  a.data.modules.forEach(m => {
    const nodes = m.steps.concat([m.workshop]);
    const hits = q ? nodes.filter(n => haystack(n).includes(q)) : nodes;
    if (q && !hits.length && !m.name.toLowerCase().includes(q)) return;
    shown++;
    const list = (q && hits.length) ? hits : nodes;
    let d = 0, t = 0;
    nodes.forEach(n => { t += a.marksOf(n).length; d += dc(n); });
    const det = document.createElement("details");
    det.className = "navmod";
    det.open = !!q || list.some(n => n.key === cur);
    det.innerHTML =
      '<summary><span class="nm-n">' + m.number + '</span><span class="nm-t">' + esc(m.name) +
      '</span><span class="nm-p">' + d + "/" + t + "</span></summary>";
    const ul = document.createElement("div"); ul.className = "navlist";
    list.forEach(n => {
      const c = dc(n), tot = a.marksOf(n).length;
      const b = document.createElement("button");
      b.className = "navlink" + (n.key === cur ? " cur" : "") + (c === tot ? " full" : c ? " part" : "");
      b.innerHTML = '<span class="dot"></span><span>' + esc(n.kind === "workshop" ? "Oficina do módulo" : n.title) + "</span>";
      b.addEventListener("click", () => { navigate(routeForKey(n.key)); openDrawer(false); });
      ul.appendChild(b);
    });
    det.appendChild(ul); nav.appendChild(det);
  });
  return shown;
}

async function renderNav(filter) {
  const q = (filter || "").trim().toLowerCase();
  const nav = $("nav"); nav.innerHTML = "";
  if (searchAll && q) {
    const avail = content.areas().filter(a => content.isAvailable(a.slug));
    const loaded = await Promise.all(avail.map(a => content.loadArea(a.slug).catch(() => null)));
    if (($("search").value || "").trim().toLowerCase() !== q) return;
    nav.innerHTML = "";
    let total = 0;
    loaded.forEach((a, i) => {
      const g = document.createElement("div"); g.className = "navgroup"; g.textContent = avail[i].nome.toUpperCase();
      nav.appendChild(g);
      if (!a) { const p = document.createElement("p"); p.className = "navempty"; p.textContent = "Sem conexão para buscar nesta área."; nav.appendChild(p); return; }
      const n = navModules(a, q, nav);
      total += n;
      if (!n) { const p = document.createElement("p"); p.className = "navempty"; p.textContent = "Nada encontrado."; nav.appendChild(p); }
    });
    return;
  }
  if (!A) {
    content.areas().forEach(a => {
      const ok = content.isAvailable(a.slug);
      const b = document.createElement("button");
      b.className = "navarea"; b.disabled = !ok;
      b.innerHTML = "<span>" + esc(a.nome) + "</span>" + (ok ? "" : "<small>em breve</small>");
      if (ok) b.addEventListener("click", () => { navigate({ view: "area", area: a.slug }); openDrawer(false); });
      nav.appendChild(b);
    });
    if (q) nav.prepend(searchAllButton(filter.trim()));
    return;
  }
  navModules(A, q, nav);
  if (q) nav.appendChild(searchAllButton(filter.trim()));
}
function searchAllButton(q) {
  const b = document.createElement("button");
  b.className = "search-all";
  b.textContent = "Buscar “" + q + "” em todas as áreas";
  b.addEventListener("click", () => { searchAll = true; renderNav($("search").value); });
  return b;
}
let searchT;
$("search").addEventListener("input", e => {
  clearTimeout(searchT);
  const v = e.target.value;
  if (!v.trim()) searchAll = false;
  searchT = setTimeout(() => renderNav(v), 160);
});

/* ---------- barras de progresso ---------- */
function renderProgress() {
  let d, t;
  if (A) [d, t] = areaMarks(A);
  else {
    d = 0; t = 0;
    content.areas().filter(a => content.isAvailable(a.slug)).forEach(a => {
      const p = areaProgress(a.slug, store.state.marks, store.state.totals[a.slug]);
      if (p.total) { d += Math.min(p.done, p.total); t += p.total; }
    });
  }
  const pct = t ? Math.round(100 * d / t) : 0;
  $("dMeter").style.width = pct + "%";
  $("tlBar").style.width = pct + "%";
  $("dPct").textContent = pct + "% do percurso";
  $("dCount").textContent = d + " de " + t + " marcos";
  $("cbPct").textContent = pct + "%";
}

/* ---------- prompt para IA ---------- */
function promptFor(n) {
  const base = A.meta.promptBase;
  const rules = "\n\nRegras: (1) faça uma pergunta por vez e espere minha resposta; (2) apresente cada argumento e cada crítica em sua versão mais forte, distinguindo o que é fato, o que é interpretação e o que é juízo de valor; (3) não invente citações, páginas, números nem o conteúdo específico de um vídeo que você não acessou; (4) depois das minhas respostas, dê retorno construtivo e aponte lacunas; (5) ao final, peça uma síntese escrita minha e faça três perguntas de verificação. Comece agora com a primeira pergunta.";
  if (n.kind === "workshop") {
    return base + "MÓDULO: " + n.mod.name + "\nETAPA: oficina de síntese do módulo.\nEXERCÍCIO: " + n.exercise +
      "\n\nATIVIDADE: conduza esta oficina comigo de forma interativa, uma questão por vez, pedindo justificativas e ajudando a organizar a síntese final." + rules;
  }
  const conc = (n.concepts || []).map(c => c.t).join(", ");
  const trads = A.meta.tradicoes || {};
  return base + "MÓDULO: " + n.mod.name + "\nTEMA: " + n.title + " — " + n.tagline +
    "\nTRADIÇÃO: " + (trads[n.tradition] ? trads[n.tradition].nome : "") +
    "\nCONCEITOS QUE ESTUDEI: " + conc +
    (n.book ? "\nLIVRO: " + n.book.title + ", de " + n.book.author : "") +
    "\n\nATIVIDADE: antes de explicar qualquer coisa, pergunte o que eu já entendi do tema. Depois faça três perguntas graduais sobre os conceitos acima, apresente um caso concreto para eu analisar e só então corrija. Em seguida, apresente a objeção mais forte ao que eu disse." + rules;
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); toast("Atividade copiada. Cole no chat da IA."); }
  catch (e) {
    const t = document.createElement("textarea");
    t.value = txt; t.style.cssText = "position:fixed;top:-2000px"; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); toast("Atividade copiada. Cole no chat da IA."); }
    catch (_) { toast("Não foi possível copiar automaticamente."); }
    t.remove();
  }
}

/* ---------- blocos ---------- */
const icon = {
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M5 3.5v17l14-8.5z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 4.5h7a2 2 0 0 1 2 2V20a1.8 1.8 0 0 0-1.8-1.5H4zM20 4.5h-7a2 2 0 0 0-2 2V20a1.8 1.8 0 0 1 1.8-1.5H20z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>'
};

function stepHTML(n) {
  const trad = tradOf(A, n.tradition);
  const marks = A.marksOf(n);
  const h = [];

  h.push('<div class="kicker"><span class="tag">' + esc(trad[0]) + '</span>' +
    '<span class="tag plain">Módulo ' + n.mod.number + "</span>" +
    (n.effort ? '<span class="tag plain">' + esc(n.effort) + "</span>" : "") + "</div>");
  h.push("<h1 class=\"etapa\">" + esc(n.title) + "</h1>");
  h.push('<p class="tagline">' + esc(n.tagline) + "</p>");

  // percurso
  h.push('<div class="track"><div class="track-h">SEU PERCURSO NESTE TEMA</div>');
  marks.forEach((mk, i) => {
    const on = isDone(n, mk.k);
    const sub = mk.k === "def" ? "A explicação completa, aqui mesmo"
      : mk.k === "vid" ? ((n.videos[0] && n.videos[0].source) || "Aula em vídeo")
      : (n.book ? n.book.author : "");
    h.push('<button class="track-i' + (on ? " done" : "") + '" data-jump="' + (mk.k === "def" ? "defin" : mk.k === "vid" ? "video" : "livro") + '">' +
      '<span class="track-n">' + (on ? "✓" : (i + 1)) + "</span>" +
      '<span class="track-t"><b>' + esc(mk.label) + "</b><span>" + esc(sub) + "</span></span>" +
      '<span class="track-go">ir →</span></button>');
  });
  h.push("</div>");

  // definição
  h.push('<section class="block" id="defin"><div class="block-h"><h2>A definição</h2></div><div class="prose">');
  n.definition.forEach(p => h.push("<p>" + esc(p) + "</p>"));
  h.push("</div>");
  h.push('<div class="res-actions" style="margin-top:20px"><button class="btn check ' + (isDone(n,"def") ? "on" : "") +
    '" data-mark="def">' + icon.check + (isDone(n,"def") ? "Definição lida" : "Marcar definição como lida") + "</button></div></section>");

  // conceitos
  if (n.concepts && n.concepts.length) {
    h.push('<section class="block"><div class="block-h"><h2>Conceitos-chave</h2></div><div class="concepts">');
    n.concepts.forEach(c => h.push('<div class="concept"><b>' + esc(c.t) + "</b><span>" + esc(c.d) + "</span></div>"));
    h.push("</div></section>");
  }

  // teses
  if (n.theses && n.theses.length) {
    h.push('<section class="block"><div class="block-h"><h2>As teses centrais</h2></div><ul class="ticks">');
    n.theses.forEach(t => h.push("<li>" + esc(t) + "</li>"));
    h.push("</ul></section>");
  }

  // vídeo
  if (n.videos && n.videos.length) {
    h.push('<section class="block" id="video"><div class="block-h"><h2>Agora assista</h2></div>');
    n.videos.forEach(v => {
      h.push('<div class="resource"><div class="res-k">VÍDEO</div><h3>' + esc(v.title) + "</h3>" +
        '<p class="res-by">' + esc(v.source) + "</p>" +
        '<p class="res-focus">' + esc(v.focus) + "</p>" +
        '<div class="res-actions"><a class="btn fill" href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
        icon.play + "Abrir no YouTube</a></div></div>");
    });
    h.push('<div class="res-actions" style="margin-top:4px"><button class="btn check ' + (isDone(n,"vid") ? "on" : "") +
      '" data-mark="vid">' + icon.check + (isDone(n,"vid") ? "Vídeo assistido" : "Marcar vídeo como assistido") + "</button></div>");
    h.push("</section>");
  }

  // livro
  if (n.book) {
    const b = n.book;
    h.push('<section class="block" id="livro"><div class="block-h"><h2>Depois leia</h2></div>');
    h.push('<div class="resource' + (isDone(n,"book") ? " done" : "") + '"><div class="res-k">LIVRO · ' + esc(b.level) + "</div>" +
      "<h3>" + esc(b.title) + '</h3><p class="res-by">' + esc(b.author) + "</p>" +
      '<p class="res-focus"><b>Como ler: </b>' + esc(b.focus) + "</p>" +
      '<div class="res-actions"><a class="btn fill" href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer">' +
      icon.book + esc(b.label) + "</a>" +
      '<button class="btn check ' + (isDone(n,"book") ? "on" : "") + '" data-mark="book">' + icon.check +
      (isDone(n,"book") ? "Livro lido" : "Marcar livro como lido") + "</button></div></div></section>");
  } else if (n.bridge) {
    h.push('<section class="block" id="livro"><div class="callout"><b>Sobre o livro desta etapa</b>' + esc(n.bridge) + "</div></section>");
  }

  // debate
  if (n.debate && n.debate.length) {
    h.push('<section class="block"><div class="block-h"><h2>Críticas e debates</h2></div><ul class="ticks">');
    n.debate.forEach(d => h.push("<li>" + esc(d) + "</li>"));
    h.push("</ul></section>");
  }

  // verificação
  if (n.check && n.check.length) {
    h.push('<section class="block"><div class="block-h"><h2>Verifique se entendeu</h2></div><ol class="qs">');
    n.check.forEach(c => h.push("<li>" + esc(c) + "</li>"));
    h.push("</ol></section>");
  }

  h.push(aiHTML(n));
  h.push(notesHTML(n));
  return h.join("");
}

function workshopHTML(n) {
  const h = [];
  h.push('<div class="kicker"><span class="tag">Oficina</span><span class="tag plain">Módulo ' + n.mod.number + "</span></div>");
  h.push('<h1 class="etapa">' + esc(n.title) + "</h1>");
  h.push('<p class="tagline">' + esc(n.brief) + "</p>");
  h.push('<section class="block"><div class="block-h"><h2>O que você vai fazer</h2></div><div class="prose"><p>' +
    esc(n.exercise) + "</p></div></section>");
  h.push('<section class="block"><div class="callout"><b>Entrega</b>' + esc(n.deliverable) + "</div></section>");
  if (n.mod.goals && n.mod.goals.length) {
    h.push('<section class="block"><div class="block-h"><h2>Ao fechar este módulo você deve conseguir</h2></div><ul class="ticks">');
    n.mod.goals.forEach(g => h.push("<li>" + esc(g) + "</li>"));
    h.push("</ul></section>");
  }
  h.push(aiHTML(n));
  h.push(notesHTML(n));
  h.push('<div class="res-actions" style="margin:4px 0 0"><button class="btn check ' + (isDone(n,"do") ? "on" : "") +
    '" data-mark="do">' + icon.check + (isDone(n,"do") ? "Oficina concluída" : "Marcar oficina como concluída") + "</button></div>");
  return h.join("");
}

function aiHTML(n) {
  return '<section class="block"><div class="block-h"><h2>Estude com a IA</h2></div>' +
    '<p style="margin:0 0 14px;color:var(--muted);font-size:.95em">Copie a atividade e cole no chat. O prompt instrui a IA a perguntar antes de responder, mostrar objeções e não inventar citações.</p>' +
    '<div class="res-actions"><button class="btn fill" data-copy="1">' + icon.copy + "Copiar atividade</button>" +
    '<a class="btn" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">' + icon.link + "Claude</a>" +
    '<a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">' + icon.link + "ChatGPT</a></div></section>";
}
function notesHTML(n) {
  const v = store.note(n.key);
  return '<section class="block"><div class="block-h"><h2>Suas anotações</h2></div>' +
    '<textarea class="notes" id="notes" placeholder="Resuma com suas palavras: 3 conceitos, 1 exemplo concreto, 1 dúvida e 1 discordância."></textarea>' +
    '<div class="note-meta"><span>Salvo neste navegador</span><span id="noteN">' + v.length + " caracteres</span></div></section>";
}

/* ---------- capa da área ---------- */
function fillTemplate(s, stats) {
  return String(s || "").replace(/\{(temas|modulos|livros|videos)\}/g, (_, k) => String(stats[k]));
}
function coverHTML() {
  const meta = A.meta, capa = meta.capa || {};
  const [d, t] = areaMarks(A);
  const h = [];
  h.push('<div class="hero"><div class="hero-label">' + esc(capa.rotulo) + "</div>");
  h.push("<h1>" + esc(meta.titulo) + "</h1>");
  h.push('<p class="lead">' + esc(fillTemplate(capa.lead, A.stats)) + "</p></div>");
  if (capa.passos && capa.passos.length) {
    h.push('<ol class="route">' + capa.passos.map(p => "<li><b>" + esc(p.t) + "</b><span>" + esc(p.d) + "</span></li>").join("") + "</ol>");
  }
  h.push('<div class="stats">' +
    '<div class="stat"><b>' + (t ? Math.round(100 * d / t) : 0) + "%</b><span>do percurso concluído</span></div>" +
    '<div class="stat"><b>' + A.stats.livros + "</b><span>livros no roteiro</span></div>" +
    '<div class="stat"><b>' + A.stats.videos + "</b><span>vídeos e playlists</span></div></div>");

  A.data.modules.forEach(m => {
    const [md, mt] = modMarks(m);
    const pct = mt ? Math.round(100 * md / mt) : 0;
    const col = "var(" + tradOf(A, m.steps[0].tradition)[1] + ")";
    h.push('<details class="modcard" style="--accent:' + col + '"' + (pct > 0 && pct < 100 ? " open" : "") + ">");
    h.push('<summary><div class="mc-top"><span class="mc-n">MÓDULO ' + String(m.number).padStart(2, "0") +
      " · " + esc(m.level) + '</span><span class="mc-p">' + md + "/" + mt + "</span></div>" +
      "<h3>" + esc(m.name) + "</h3><p>" + esc(m.subtitle) + "</p>" +
      '<div class="mc-meter"><i style="width:' + pct + '%"></i></div></summary>');
    h.push('<div class="mc-body">');
    m.steps.concat([m.workshop]).forEach(n => {
      const dc = doneCount(n), tot = A.marksOf(n).length;
      h.push('<button class="mc-link' + (dc === tot ? " full" : dc ? " part" : "") + '" data-go="' + esc(n.key) + '">' +
        '<span class="dot"></span><span>' + esc(n.kind === "workshop" ? "Oficina do módulo" : n.title) + "</span></button>");
    });
    h.push("</div></details>");
  });
  h.push(backupNoteHTML());
  return h.join("");
}
function backupNoteHTML() {
  return '<p style="font-size:.88em;color:var(--muted);margin-top:26px">O progresso e as anotações ficam salvos apenas neste navegador. Use <b>Exportar</b> no menu para guardar uma cópia, e <b>Salvar em PDF</b> para gerar o roteiro inteiro em um arquivo de leitura.</p>';
}

/* ---------- mapa do Atlas ---------- */
function continueHTML() {
  const last = store.state.lastAt;
  if (!last) return "";
  const r = routeForKey(last.route);
  const meta = content.area(r.area);
  if (!meta || !content.isAvailable(r.area)) return "";
  let label;
  const loaded = content.isLoaded(r.area) && loadedAreas.get(r.area);
  const n = loaded && loaded.byId[r.id];
  if (n) label = n.kind === "workshop" ? "Oficina do módulo " + n.mod.number : n.title;
  else {
    const m = /^m(\d+)(?:e(\d+)|of)$/.exec(r.id);
    label = m ? (m[2] ? "Módulo " + m[1] + ", tema " + m[2] : "Oficina do módulo " + m[1]) : r.id;
  }
  return '<button class="continue" data-go="' + esc(last.route) + '"><span><b>Continuar de onde parei</b><span>' +
    esc(meta.nome) + " · " + esc(label) + "</span></span><i>ir →</i></button>";
}
function mapHTML() {
  const h = [];
  h.push('<div class="hero"><div class="hero-label">ATLAS DE ESTUDOS</div>');
  h.push("<h1>Mapa do Atlas</h1>");
  h.push('<p class="lead">Escolha uma área. Cada área é uma trilha própria, com a explicação de cada tema, o vídeo e o livro, e o seu progresso.</p></div>');
  h.push(continueHTML());
  h.push('<div class="areas">');
  content.areas().forEach(a => {
    const ok = content.isAvailable(a.slug);
    if (!ok) {
      h.push('<div class="areacard soon" aria-disabled="true"><span class="mc-n">EM BREVE</span><h3>' + esc(a.nome) + "</h3>" +
        (a.resumo ? "<p>" + esc(a.resumo) + "</p>" : "") + "</div>");
      return;
    }
    const p = areaProgress(a.slug, store.state.marks, store.state.totals[a.slug]);
    const right = p.total ? p.done + "/" + p.total : p.done + (p.done === 1 ? " marco concluído" : " marcos concluídos");
    h.push('<button class="areacard" data-area="' + esc(a.slug) + '"><div class="mc-top"><span class="mc-n">ÁREA</span><span class="mc-p">' + right + "</span></div>" +
      "<h3>" + esc(a.nome) + "</h3>" + (a.resumo ? "<p>" + esc(a.resumo) + "</p>" : "") +
      '<div class="mc-meter"><i style="width:' + (p.pct || 0) + '%"></i></div></button>');
  });
  h.push("</div>");
  h.push(backupNoteHTML());
  return h.join("");
}

/* ---------- render ---------- */
const loadedAreas = new Map();
const setAccent = (v) => document.documentElement.style.setProperty("--accent", v);

function render() {
  const page = $("page");
  if (route.view === "mapa" || !A) {
    page.innerHTML = mapHTML();
    setAccent("var(--brand)");
    $("cbTitle").textContent = "Atlas de Estudos";
    $("cbSub").textContent = "Mapa das áreas";
    $("dTitle").textContent = "Mapa das áreas";
    document.title = "Atlas de Estudos";
  } else if (route.view === "area") {
    page.innerHTML = coverHTML();
    setAccent("var(" + firstTradVar(A)[1] + ")");
    $("cbTitle").textContent = "Atlas de Estudos";
    $("cbSub").textContent = A.meta.subtitulo || A.meta.nome;
    $("dTitle").textContent = A.meta.nome;
    document.title = A.meta.tituloPdf || A.meta.nome;
  } else {
    const n = A.byId[route.id];
    const col = n.kind === "workshop" ? tradOf(A, n.mod.steps[0].tradition)[1] : tradOf(A, n.tradition)[1];
    setAccent("var(" + col + ")");
    page.innerHTML = (n.kind === "workshop" ? workshopHTML(n) : stepHTML(n)) + pagerHTML(n);
    $("cbTitle").textContent = n.kind === "workshop" ? "Oficina do módulo" : n.title;
    $("cbSub").textContent = "Módulo " + n.mod.number + " · " + n.mod.name;
    $("dTitle").textContent = A.meta.nome;
    document.title = (n.kind === "workshop" ? "Oficina do módulo " + n.mod.number : n.title) + " · " + (A.meta.tituloPdf || A.meta.nome);
    wire(n);
  }
  renderAreaSelect();
  renderNav($("search").value);
  renderProgress();
  const want = hrefFor(route);
  if (location.hash !== want) { ignoreHash = want; location.hash = want; }
}
function pagerHTML(n) {
  const i = A.nodes.findIndex(x => x.key === n.key);
  const prev = i > 0 ? A.nodes[i - 1] : null, next = i < A.nodes.length - 1 ? A.nodes[i + 1] : null;
  const name = (x) => x.kind === "workshop" ? "Oficina do módulo " + x.mod.number : x.title;
  return '<div class="pager ui">' +
    "<button " + (prev ? 'data-nav="' + esc(prev.key) + '"' : "disabled") + "><small>Anterior</small>" +
    (prev ? esc(name(prev)) : "Começo do roteiro") + "</button>" +
    '<button class="nx" ' + (next ? 'data-nav="' + esc(next.key) + '"' : "disabled") + "><small>Próximo</small>" +
    (next ? esc(name(next)) : "Fim do roteiro") + "</button></div>";
}
function wire(n) {
  const page = $("page");
  page.querySelectorAll("[data-mark]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.mark;
    const on = !store.isDone(n.key, k);
    store.setMark(n.key, k, on);
    const pos = window.scrollY;
    render();
    window.scrollTo(0, pos);
    toast(on ? "Marcado como concluído." : "Marcação desfeita.");
  }));
  page.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => {
    const el = $(b.dataset.jump); if (el) el.scrollIntoView({behavior:"smooth", block:"start"});
  }));
  const copyBtn = page.querySelector("[data-copy]");
  if (copyBtn) copyBtn.addEventListener("click", () => copyText(promptFor(n)));
  const ta = page.querySelector("#notes");
  if (ta) {
    ta.value = store.note(n.key);
    ta.addEventListener("input", e => {
      store.setNote(n.key, e.target.value);
      $("noteN").textContent = e.target.value.length + " caracteres";
    });
  }
  page.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => navigate(routeForKey(b.dataset.nav))));
}
$("page").addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) { navigate(routeForKey(g.dataset.go)); return; }
  const a = e.target.closest("[data-area]");
  if (a) navigate({ view: "area", area: a.dataset.area });
});

/* ---------- navegação ---------- */
let ignoreHash = null;
let navSeq = 0;
async function openArea(slug) {
  const a = await content.loadArea(slug);
  loadedAreas.set(slug, a);
  injectAreaStyle(a.meta);
  store.setTotal(slug, a.allMarks.length);
  return a;
}
// Resolve a rota contra o manifesto: área planejada ou desconhecida → mapa;
// item desconhecido → capa da área.
async function navigate(r, { scroll = true } = {}) {
  const seq = ++navSeq;
  if (r.view !== "mapa" && !content.isAvailable(r.area)) {
    if (content.area(r.area)) toast("Esta área ainda não está disponível.");
    r = { view: "mapa" };
  }
  if (r.view === "mapa") { A = null; }
  else if (!A || A.slug !== r.area) {
    if (!content.isLoaded(r.area)) $("page").innerHTML = '<p class="loading">Carregando…</p>';
    try {
      const a = await openArea(r.area);
      if (seq !== navSeq) return;
      A = a;
    } catch (e) {
      if (seq !== navSeq) return;
      A = null;
      route = { view: "mapa" };
      render();
      toast("Esta área precisa de conexão na primeira abertura.");
      return;
    }
  }
  if (r.view === "item" && !A.byId[r.id]) r = { view: "area", area: A.slug };
  if (searchAll && A) searchAll = false;
  route = r;
  if (r.view === "item") store.setLastAt(A.slug + "/" + r.id);
  render();
  if (scroll) {
    window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});
    $("page").focus({preventScroll:true});
  }
}
window.addEventListener("hashchange", () => {
  if (ignoreHash && location.hash === ignoreHash) { ignoreHash = null; return; }
  ignoreHash = null;
  const r = parseRoute(location.hash);
  if (hrefFor(r) === hrefFor(route) && (r.view === "mapa" || (A && A.slug === r.area))) return;
  navigate(r);
});

/* ---------- ações ---------- */
$("btnHome").addEventListener("click", () => { navigate({ view: "mapa" }); openDrawer(false); });
$("btnExport").addEventListener("click", () => {
  const out = exportBackup(store.state, new Date().toISOString());
  const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], {type:"application/json"}));
  const a = document.createElement("a");
  a.href = url; a.download = "atlas-estudos-progresso.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast("Backup exportado.");
});
$("btnImport").addEventListener("click", () => $("fileIn").click());
$("fileIn").addEventListener("change", async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    if (o && o.version !== 3 && content.isAvailable(LEGACY_AREA)) await openArea(LEGACY_AREA).catch(() => null);
    const isKnownItem = (key) => {
      const area = key.slice(0, key.indexOf("/"));
      const a = loadedAreas.get(area);
      return a ? !!a.byKey[key] : true;
    };
    const ops = planImport(store.state, o, { now: new Date().toISOString(), isKnownItem });
    if (!confirm("Mesclar o backup com o progresso deste navegador? Entradas mais recentes vencem e nada é apagado.")) return;
    store.applyOps(ops);
    render();
    toast(ops.length ? "Progresso importado (" + ops.length + (ops.length === 1 ? " alteração)." : " alterações).") : "Nada novo no backup.");
  } catch (err) { alert("Não foi possível ler esse arquivo. Selecione um backup exportado pelo Atlas."); }
  finally { e.target.value = ""; }
});
$("btnReset").addEventListener("click", () => {
  if (!confirm("Apagar todas as marcações e anotações de todas as áreas? Exporte um backup antes, se precisar.")) return;
  store.resetAll();
  navigate({ view: "mapa" });
  toast("Progresso zerado.");
});

/* ---------- versão para PDF ---------- */
function buildPrintable() {
  if (!A) { $("printable").innerHTML = ""; return; }
  const h = [];
  h.push("<h1>" + esc(A.meta.tituloPdf || A.meta.nome) + "</h1>");
  h.push('<p class="pmeta">Roteiro de ' + A.data.modules.length + " módulos. Para cada tema: a definição, o vídeo indicado e o livro. Gerado em " +
    new Date().toLocaleDateString("pt-BR") + ".</p>");
  A.data.modules.forEach(m => {
    h.push('<div class="pmod"><h2>Módulo ' + m.number + " · " + esc(m.name) + "</h2>");
    h.push('<p class="pmeta">' + esc(m.level) + " — " + esc(m.subtitle) + "</p>");
    h.push("<p>" + esc(m.overview) + "</p>");
    m.steps.forEach(n => {
      h.push('<div class="pstep"><h3>' + esc(n.title) + " — " + esc(n.tagline) + "</h3>");
      h.push('<p class="pmeta">' + esc(tradOf(A, n.tradition)[0]) + " · " + esc(n.effort || "") + "</p>");
      n.definition.forEach(p => h.push("<p>" + esc(p) + "</p>"));
      if (n.concepts && n.concepts.length) {
        h.push("<h4>Conceitos-chave</h4><dl>");
        n.concepts.forEach(c => h.push("<dt>" + esc(c.t) + "</dt><dd>" + esc(c.d) + "</dd>"));
        h.push("</dl>");
      }
      if (n.theses && n.theses.length) {
        h.push("<h4>Teses centrais</h4><ul>");
        n.theses.forEach(t => h.push("<li>" + esc(t) + "</li>")); h.push("</ul>");
      }
      if (n.videos && n.videos.length) {
        h.push("<h4>Assista</h4><ul>");
        n.videos.forEach(v => h.push("<li><b>" + esc(v.title) + "</b> (" + esc(v.source) + "). " + esc(v.focus) + "<br>" + esc(v.url) + "</li>"));
        h.push("</ul>");
      }
      if (n.book) {
        h.push("<h4>Leia</h4><p><b>" + esc(n.book.title) + "</b>, de " + esc(n.book.author) + " — " + esc(n.book.level) +
          ".<br>Como ler: " + esc(n.book.focus) + "</p>");
      } else if (n.bridge) { h.push("<h4>Sobre o livro</h4><p>" + esc(n.bridge) + "</p>"); }
      if (n.debate && n.debate.length) {
        h.push("<h4>Críticas e debates</h4><ul>");
        n.debate.forEach(d => h.push("<li>" + esc(d) + "</li>")); h.push("</ul>");
      }
      if (n.check && n.check.length) {
        h.push("<h4>Verifique se entendeu</h4><ol>");
        n.check.forEach(c => h.push("<li>" + esc(c) + "</li>")); h.push("</ol>");
      }
      h.push("</div>");
    });
    const w = m.workshop;
    h.push('<div class="pstep"><h3>' + esc(w.title) + "</h3><p>" + esc(w.exercise) + "</p><p><b>Entrega:</b> " + esc(w.deliverable) + "</p></div>");
    h.push("</div>");
  });
  $("printable").innerHTML = h.join("");
  $("printable").dataset.area = A.slug;
}
$("btnPrint").addEventListener("click", () => {
  if (!A) { toast("Abra uma área para salvar o roteiro em PDF."); return; }
  buildPrintable(); openDrawer(false);
  toast("Na janela de impressão, escolha “Salvar como PDF”.");
  setTimeout(() => window.print(), 450);
});
window.addEventListener("beforeprint", () => {
  if (A && $("printable").dataset.area !== A.slug) buildPrintable();
});

/* ---------- início ---------- */
async function start() {
  applyPrefs();
  try {
    await content.loadManifest();
  } catch (e) {
    $("page").innerHTML = '<p class="loading">Não foi possível carregar o Atlas. Verifique a conexão e tente de novo.</p>';
    return;
  }
  await navigate(parseRoute(location.hash), { scroll: false });
}
start();

export { store, content };
