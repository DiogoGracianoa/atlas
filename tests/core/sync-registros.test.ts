// Preparatório, cenários S21–S23 e S26: registros sincronizados entre aparelhos.
import { expect, it } from "vitest";
import { createBackend, createClock, createDevice } from "./fake-backend";
import { definirEstado, estadoTopico, registrarSessao, sessoes } from "../../src/core/concurso/estudo";
import type { Sync } from "../../src/core/sync";

const A = "contagem-2027";
async function boot(...devices: { sync: Sync }[]) {
  for (const d of devices) { await d.sync.init(); await d.sync.whenIdle(); }
}

it("S22: tentativa registrada no aparelho A aparece no B", async () => {
  const be = createBackend(), clock = createClock();
  const a = createDevice(be, { name: "a", clock });
  await boot(a);
  a.registros.evento("tentativa", A, { questao: "lp-crase-q1", topico: "lp-crase", marcada: 1, acerto: false, em: "2026-12-03" });
  await a.sync.whenIdle();
  expect(be.tables.registros).toHaveLength(1);
  expect(a.sync.pending()).toBe(0);
  const b = createDevice(be, { name: "b", clock });
  await boot(b);
  expect(b.registros.lista("tentativa", A)).toHaveLength(1);
  expect(b.registros.lista("tentativa", A)[0]?.corpo.questao).toBe("lp-crase-q1");
});

it("S21: sessão registrada offline sobe ao reconectar", async () => {
  const be = createBackend(), clock = createClock();
  const a = createDevice(be, { name: "a", clock });
  await boot(a);
  a.goOffline();
  registrarSessao(a.registros, A, { disciplina: "lp", topicos: [], data: "2026-11-23", minutos: 60 });
  expect(a.sync.pending()).toBe(1);
  expect(be.tables.registros).toHaveLength(0);
  await a.goOnline();
  expect(be.tables.registros).toHaveLength(1);
});

it("S23: estado do tópico editado nos dois aparelhos fica com o mais recente; eventos nunca conflitam", async () => {
  const be = createBackend(), clock = createClock();
  const a = createDevice(be, { name: "a", clock }), b = createDevice(be, { name: "b", clock });
  await boot(a, b);
  a.goOffline(); b.goOffline();
  definirEstado(a.registros, A, "lp-crase", "em-andamento");
  registrarSessao(a.registros, A, { disciplina: "lp", topicos: ["lp-crase"], data: "2026-12-14", minutos: 30 });
  clock.set("2026-11-04T11:00:00.000Z");
  definirEstado(b.registros, A, "lp-crase", "concluido");
  registrarSessao(b.registros, A, { disciplina: "lp", topicos: ["lp-crase"], data: "2026-12-14", minutos: 40 });
  await a.goOnline(); await b.goOnline();
  await a.sync.pull({ force: true }); await a.sync.whenIdle();
  for (const d of [a, b]) {
    expect(estadoTopico(d.registros, A, "lp-crase").estado, d.name).toBe("concluido");
    expect(sessoes(d.registros, A).map(s => s.minutos).sort(), d.name).toEqual([30, 40]);
  }
});

it("S26: registro recusado pelo servidor (4xx) é descartado sem travar os outros", async () => {
  const be = createBackend(), clock = createClock();
  const a = createDevice(be, { name: "a", clock });
  await boot(a);
  a.goOffline();
  registrarSessao(a.registros, A, { disciplina: "lp", topicos: [], data: "2026-11-23", minutos: 60 });
  be.failNextWith({ data: null, error: { message: "new row violates check constraint" }, status: 400 });
  await a.goOnline();
  expect(a.sync.pending()).toBe(0);
  expect(be.tables.registros).toHaveLength(0);
  registrarSessao(a.registros, A, { disciplina: "lp", topicos: [], data: "2026-11-24", minutos: 30 });
  await a.sync.whenIdle();
  expect(be.tables.registros).toHaveLength(1);
});

it("S48: zerar tudo no aparelho A apaga os registros também no B", async () => {
  const be = createBackend(), clock = createClock();
  const a = createDevice(be, { name: "a", clock }), b = createDevice(be, { name: "b", clock });
  await boot(a, b);
  registrarSessao(a.registros, A, { disciplina: "lp", topicos: [], data: "2026-11-23", minutos: 60 });
  await a.sync.whenIdle();
  await b.sync.pull({ force: true }); await b.sync.whenIdle();
  expect(sessoes(b.registros, A)).toHaveLength(1);
  clock.set("2026-11-05T10:00:00.000Z");
  a.registros.resetAll();
  await a.sync.whenIdle();
  await b.sync.pull({ force: true }); await b.sync.whenIdle();
  expect(sessoes(b.registros, A)).toEqual([]);
  expect(sessoes(a.registros, A)).toEqual([]);
});

it("técnico: banco sem a migration 0002 não derruba marcações e não descarta registros", async () => {
  const be = createBackend({ semRegistros: true }), clock = createClock();
  const a = createDevice(be, { name: "a", clock });
  await boot(a);
  a.store.setMark("politica/m1e1", "def", true);
  registrarSessao(a.registros, A, { disciplina: "lp", topicos: [], data: "2026-11-23", minutos: 60 });
  await a.sync.whenIdle();
  expect(be.tables.progress).toHaveLength(1);
  expect(a.sync.pending()).toBe(1); // a sessão espera a tabela existir
  const b = createDevice(be, { name: "b", clock });
  await boot(b);
  expect(b.store.isDone("politica/m1e1", "def")).toBe(true);
  expect(b.sync.state.status).toBe("sincronizado");
});
