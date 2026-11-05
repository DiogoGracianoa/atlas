// Sincronização entre aparelhos contra o backend falso.
// Cenários S02, S06, S09–S13, L03 e critérios AC05, AC06, AC07, AC09, AC10,
// AC19, AC20, AC21, AC22, AC24, AC27, AC28.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createBackend, createClock, createDevice, flushMicrotasks } from "./fake-backend.mjs";
import { planImport } from "../../assets/lib/backup.js";

async function boot(...devices) {
  for (const d of devices) { await d.sync.init(); await d.sync.whenIdle(); }
}
const doneKeys = (store) => Object.entries(store.state.marks).filter(([, v]) => v.done).map(([k]) => k).sort();

test("AC05: livro marcado no celular aparece no PC ao abrir", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  await boot(cel);
  cel.store.setMark("politica/m1e1", "book", true);
  await cel.sync.whenIdle();
  assert.equal(be.tables.progress.length, 1);
  assert.equal(cel.sync.state.status, "sincronizado");
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  assert.equal(pc.store.isDone("politica/m1e1", "book"), true);
});

test("AC09: primeiro login com dados locais mescla em vez de descartar", async () => {
  const be = createBackend(), clock = createClock();
  const outro = createDevice(be, { name: "outro", clock });
  await boot(outro);
  ["m2e1", "m2e2", "m2e3"].forEach(id => outro.store.setMark("politica/" + id, "vid", true));
  await outro.sync.whenIdle();
  const novo = createDevice(be, { name: "novo", clock, loggedIn: false });
  ["m1e1", "m1e2", "m1e3", "m1e4", "m1e5"].forEach(id => novo.store.setMark("politica/" + id, "def", true));
  await boot(novo);
  assert.equal(be.tables.progress.length, 3, "deslogado não envia nada");
  assert.equal(novo.sync.state.status, "nao-sincronizado");
  assert.deepEqual(await novo.sync.verifyCode("eu@exemplo.com", "123456"), { ok: true });
  await novo.sync.whenIdle();
  assert.equal(doneKeys(novo.store).length, 8);
  assert.equal(be.tables.progress.length, 8);
});

test("L03: anotação sobe uma vez, 800 ms depois da última tecla", async () => {
  const be = createBackend(), clock = createClock();
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  be.calls.length = 0;
  for (const txt of ["a", "ab", "abc"]) { pc.store.setNote("politica/m1e1", txt); await clock.advance(300); }
  assert.equal(be.calls.filter(c => c.includes("upsert:notes")).length, 0);
  await clock.advance(800);
  await pc.sync.whenIdle();
  assert.deepEqual(be.calls.filter(c => c.includes("upsert:notes")), ["pc:upsert:notes:1"]);
  assert.equal(be.tables.notes[0].body, "abc");
  assert.deepEqual(pc.store.state.notes["politica/m1e1"].base, { body: "abc", at: pc.store.state.notes["politica/m1e1"].at });
});

test("marcação sobe na hora, sem esperar debounce", async () => {
  const be = createBackend(), clock = createClock();
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  pc.store.setMark("politica/m1e1", "def", true);
  await flushMicrotasks();
  assert.equal(be.tables.progress.length, 1);
});

test("AC06 + AC20: anotação no PC e vídeo no celular na mesma sessão; nada se perde", async () => {
  const be = createBackend(), clock = createClock();
  const pc = createDevice(be, { name: "pc", clock });
  const cel = createDevice(be, { name: "cel", clock });
  await boot(pc, cel);
  pc.store.setNote("politica/m1e2", "anotação do PC");
  cel.store.setMark("politica/m1e4", "vid", true);
  await clock.advance(1000);
  await pc.sync.whenIdle(); await cel.sync.whenIdle();
  await clock.advance(16000);
  await pc.becomeVisible();
  await cel.becomeVisible();
  for (const d of [pc, cel]) {
    assert.equal(d.store.note("politica/m1e2"), "anotação do PC", d.name);
    assert.equal(d.store.isDone("politica/m1e4", "vid"), true, d.name);
  }
});

test("AC07: offline aceita marcações, guarda na fila e sobe ao voltar a rede", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  await boot(cel);
  cel.goOffline();
  assert.equal(cel.sync.state.status, "offline");
  ["m1e1", "m1e2", "m1e3"].forEach(id => cel.store.setMark("politica/" + id, "def", true));
  await cel.sync.whenIdle();
  assert.equal(be.tables.progress.length, 0);
  assert.equal(cel.sync.pending(), 3);
  assert.ok(cel.storage.getItem("atlas-v3-queue").includes("politica/m1e3"), "fila persistida");
  await cel.goOnline();
  assert.equal(be.tables.progress.length, 3);
  assert.equal(cel.sync.pending(), 0);
  assert.equal(cel.sync.state.status, "sincronizado");
});

test("AC07: fila guardada sobe na próxima carga do app", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  await boot(cel);
  cel.goOffline();
  cel.store.setMark("politica/m1e1", "def", true);
  await cel.sync.whenIdle();
  const reaberto = createDevice(be, { name: "cel2", clock, storage: cel.storage });
  await boot(reaberto);
  assert.equal(be.tables.progress.length, 1);
  assert.equal(reaberto.sync.pending(), 0);
});

test("AC19: escrita offline antiga não apaga a mais nova de outro aparelho", async () => {
  const be = createBackend(), clockA = createClock("2026-11-04T10:00:00.000Z"), clockB = createClock("2026-11-04T10:05:00.000Z");
  const a = createDevice(be, { name: "a", clock: clockA });
  const b = createDevice(be, { name: "b", clock: clockB });
  await boot(a, b);
  a.goOffline();
  a.store.setMark("politica/m1e1", "def", false);   // 10:00
  b.store.setMark("politica/m1e1", "def", true);    // 10:05
  await b.sync.whenIdle();
  clockA.set("2026-11-04T10:10:00.000Z");
  await a.goOnline();
  assert.equal(be.tables.progress[0].done, true);
  assert.equal(a.store.isDone("politica/m1e1", "def"), true, "A adota a versão mais nova");
});

test("AC10: anotação editada depois em outro aparelho vence nos dois", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  const pc = createDevice(be, { name: "pc", clock });
  await boot(cel, pc);
  cel.store.setNote("politica/m1e1", "versão 10:00");
  await clock.advance(1000); await cel.sync.whenIdle();
  await clock.advance(16000); await pc.becomeVisible();
  pc.store.setNote("politica/m1e1", "versão 10:05");
  await clock.advance(1000); await pc.sync.whenIdle();
  await clock.advance(16000); await cel.becomeVisible();
  assert.equal(cel.store.note("politica/m1e1"), "versão 10:05");
  assert.equal(pc.store.note("politica/m1e1"), "versão 10:05");
});

test("AC27: mesma anotação editada offline nos dois aparelhos preserva as duas versões", async () => {
  const be = createBackend(), clockA = createClock("2026-11-04T10:00:00.000Z"), clockB = createClock("2026-11-04T10:05:00.000Z");
  const cel = createDevice(be, { name: "cel", clock: clockA });
  const pc = createDevice(be, { name: "pc", clock: clockB });
  await boot(cel, pc);
  cel.goOffline(); pc.goOffline();
  cel.store.setNote("politica/m1e1", "A");  // 10:00
  pc.store.setNote("politica/m1e1", "B");   // 10:05
  await clockA.advance(1000); await clockB.advance(1000);
  await cel.goOnline();
  assert.equal(be.tables.notes[0].body, "A");
  await pc.goOnline();
  const esperado = "B\n\n— versão de outro aparelho (10:00) —\nA";
  assert.equal(pc.store.note("politica/m1e1"), esperado);
  assert.equal(be.tables.notes[0].body, esperado);
  await clockA.advance(16000);
  await cel.becomeVisible();
  assert.equal(cel.store.note("politica/m1e1"), esperado);
});

test("S09: voltar ao app busca no máximo uma vez a cada 15 s", async () => {
  const be = createBackend(), clock = createClock();
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  be.calls.length = 0;
  await clock.advance(16000);
  await pc.becomeVisible();
  await pc.becomeVisible();
  assert.equal(be.calls.filter(c => c === "pc:select:progress").length, 1);
  await clock.advance(16000);
  await pc.becomeVisible();
  assert.equal(be.calls.filter(c => c === "pc:select:progress").length, 2);
});

test("AC21: Zerar no celular zera o PC", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  const pc = createDevice(be, { name: "pc", clock });
  await boot(cel, pc);
  for (let i = 1; i <= 10; i++) cel.store.setMark("politica/m1e" + i, "def", true);
  cel.store.setNote("politica/m1e1", "um"); cel.store.setNote("politica/m1e2", "dois");
  await clock.advance(1000); await cel.sync.whenIdle();
  await clock.advance(16000); await pc.becomeVisible();
  assert.equal(doneKeys(pc.store).length, 10);
  await clock.advance(1000);
  cel.store.resetAll();
  await cel.sync.whenIdle();
  await clock.advance(16000); await pc.becomeVisible();
  assert.equal(doneKeys(pc.store).length, 0);
  assert.equal(pc.store.note("politica/m1e1"), "");
  assert.equal(pc.store.note("politica/m1e2"), "");
});

test("Zerar num aparelho que nunca buscou o servidor também zera o que só existe lá", async () => {
  const be = createBackend(), clock = createClock();
  const outro = createDevice(be, { name: "outro", clock });
  await boot(outro);
  outro.store.setMark("politica/m1e1", "def", true);
  await outro.sync.whenIdle();
  await clock.advance(1000);
  const novo = createDevice(be, { name: "novo", clock });
  novo.dev.online = false;
  await boot(novo);
  novo.store.resetAll();
  await novo.goOnline();
  assert.equal(be.tables.progress[0].done, false);
  assert.equal(novo.store.isDone("politica/m1e1", "def"), false);
});

test("AC22: importação vai para a fila e sobe", async () => {
  const be = createBackend(), clock = createClock();
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  const ops = planImport(pc.store.state, { done: { "m1e2:def": true }, notes: { m1e2: "importada" } }, { now: clock.nowIso() });
  pc.store.applyOps(ops);
  await pc.sync.whenIdle();
  assert.equal(be.tables.progress.length, 1);
  assert.equal(be.tables.notes[0].body, "importada");
});

test("AC24: última posição lida vai para o outro aparelho", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  await boot(cel);
  cel.store.setLastAt("politica/m2e3");
  await clock.advance(1000); await cel.sync.whenIdle();
  assert.equal(be.tables.prefs[0].last_at, "politica/m2e3");
  assert.equal(be.tables.prefs[0].size, undefined, "tamanho e tema não sobem");
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  assert.equal(pc.store.state.lastAt.route, "politica/m2e3");
});

test("AC28: depois de sair, marcações continuam e não sobem; ao entrar de novo, sobem", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  await boot(cel);
  await cel.sync.signOut();
  cel.store.setMark("politica/m1e1", "def", true);
  await cel.sync.whenIdle();
  assert.equal(be.tables.progress.length, 0);
  assert.equal(cel.store.isDone("politica/m1e1", "def"), true);
  await cel.sync.verifyCode("eu@exemplo.com", "123456");
  await cel.sync.whenIdle();
  assert.equal(be.tables.progress.length, 1);
});

test("erro 4xx descarta a operação; 5xx mantém e tenta de novo depois", async () => {
  const be = createBackend(), clock = createClock();
  const pc = createDevice(be, { name: "pc", clock });
  await boot(pc);
  be.failNextWith({ data: null, error: { message: "bad" }, status: 400 });
  pc.store.setMark("politica/m1e1", "def", true);
  await pc.sync.whenIdle();
  assert.equal(pc.sync.pending(), 0);
  assert.equal(be.tables.progress.length, 0);

  be.failNextWith({ data: null, error: { message: "indisponível" }, status: 503 });
  pc.store.setMark("politica/m1e2", "def", true);
  await pc.sync.whenIdle();
  assert.equal(pc.sync.pending(), 1);
  assert.equal(pc.sync.state.status, "offline");
  await clock.advance(31000);
  await pc.sync.whenIdle();
  assert.equal(pc.sync.pending(), 0);
  assert.ok(be.tables.progress.some(r => r.item_id === "politica/m1e2" && r.done), "5xx: operação mantida e enviada depois");
  assert.equal(pc.sync.state.status, "sincronizado");
});

test("dados recebidos do servidor não voltam para a fila", async () => {
  const be = createBackend(), clock = createClock();
  const cel = createDevice(be, { name: "cel", clock });
  await boot(cel);
  cel.store.setMark("politica/m1e1", "def", true);
  await cel.sync.whenIdle();
  const pc = createDevice(be, { name: "pc", clock });
  be.calls.length = 0;
  await boot(pc);
  assert.equal(be.calls.filter(c => c.startsWith("pc:upsert")).length, 0);
  assert.equal(pc.sync.pending(), 0);
});
