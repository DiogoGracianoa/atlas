// Preparatório de concurso: telas (cenários S02–S08, S16, S18–S20, S30–S32,
// S35–S45) com o concurso de teste e relógio controlado.
import { describe, expect, it } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import { manifest } from "../../core/helpers";
import { concurso, manifestoConcursos, questoes, teoria } from "../../core/concurso-fixture";
import type { Concurso } from "../../../src/core/concurso/tipos";
import { axeViolations, memoryStorage, renderApp } from "../harness";

const BASE = "/atlas/concursos/teste-2027";

function servir(c: Concurso = concurso(), extra: Record<string, unknown> = {}) {
  const man = manifest();
  (man.areas as unknown[]).push(manifestoConcursos());
  const files: Record<string, unknown> = {
    "content/areas.json": man,
    "content/teste/curriculum.json": { modules: [] },
    "content/teste-2027/concurso.json": c,
    "content/teste-2027/teoria/lp.json": teoria(),
    "content/teste-2027/questoes/lp.json": questoes(),
    ...extra,
  };
  return async (url: string) => {
    if (!(url in files)) throw new Error("404 " + url);
    return JSON.parse(JSON.stringify(files[url]));
  };
}

const abrir = (path: string, agora: string, opts: { c?: Concurso; storage?: ReturnType<typeof memoryStorage> } = {}) =>
  renderApp(path, { fetchJSON: servir(opts.c), agora: () => agora, storage: opts.storage });

describe("chegada ao concurso (S35, RN29)", () => {
  it("o agrupador Concursos lista o concurso, que abre na capa", async () => {
    abrir("/atlas/concursos", "2026-11-11T12:00:00.000Z");
    const lista = await screen.findByRole("list", { name: "Subtemas" });
    const link = within(lista).getByRole("link", { name: /Concurso de teste/ });
    expect(link.getAttribute("href")).toBe(BASE);
  });

  it("capa: título, contagem regressiva com rótulo e início da trilha (S14, S16)", async () => {
    abrir(BASE, "2026-11-11T12:00:00.000Z");
    expect(await screen.findByRole("heading", { level: 1, name: "Preparatório de teste" })).toBeTruthy();
    expect(screen.getByText("Faltam 74 dias")).toBeTruthy();
    expect(screen.getByText(/data prevista no edital \(item 9\.2\.1\), sujeita a retificação/)).toBeTruthy();
    expect(screen.getByText("Começa em 5 dias")).toBeTruthy();
  });

  it("hoje, quarta 18/11/2026: Conhecimentos Específicos com Endereçamento IP (S11 na tela)", async () => {
    abrir(BASE, "2026-11-18T15:00:00.000Z");
    const hoje = await screen.findByRole("region", { name: "Hoje" });
    expect(within(hoje).getByText(/Semana 1/)).toBeTruthy();
    expect(within(hoje).getByRole("link", { name: "Endereçamento IP" }).getAttribute("href")).toBe(BASE + "/topico/ce-ip");
  });
});

describe("edital e fontes (RN01–RN05)", () => {
  it("S03: tópico pendente impede declarar o programa conferido", async () => {
    abrir(BASE, "2026-11-11T12:00:00.000Z");
    expect(await screen.findByText("1 tópico pendente de conferência com o edital")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Lei 105/2011" }).getAttribute("href")).toBe(BASE + "/topico/ce-pccs");
    expect(screen.queryByText(/Programa conferido/)).toBeNull();
  });

  it("S04: com todos verificados, o programa aparece como conferido", async () => {
    const c = concurso();
    c.disciplinas[1]!.modulos[0]!.topicos[1]!.validacao = "verificado";
    abrir(BASE, "2026-11-11T12:00:00.000Z", { c });
    expect(await screen.findByText("Programa conferido com Anexo IV – Conteúdos, Retificação nº 02")).toBeTruthy();
  });

  it("S06: composição da prova com fonte e sem local de prova", async () => {
    abrir(BASE, "2026-11-11T12:00:00.000Z");
    const prova = await screen.findByRole("region", { name: "A prova" });
    expect(within(prova).getByText("6 questões objetivas")).toBeTruthy();
    expect(within(prova).getByText(/Língua Portuguesa: 2 questões, peso 2/)).toBeTruthy();
    expect(within(prova).getByText(/Conhecimentos Específicos: 4 questões, peso 3/)).toBeTruthy();
    expect(within(prova).getByText(/Fonte: Anexo III – Quadro de Provas, Retificação nº 01, p\. 2/)).toBeTruthy();
    expect(within(prova).queryByText(/local/i)).toBeNull();
  });

  it("S02: tópico mostra disciplina, documento, versão, data, página e selo", async () => {
    abrir(BASE + "/topico/ce-ip", "2026-11-18T15:00:00.000Z");
    expect(await screen.findByRole("heading", { level: 1, name: "Endereçamento IP" })).toBeTruthy();
    expect(screen.getByText("Conhecimentos Específicos · Anexo IV – Conteúdos, Retificação nº 02, de 09/11/2026 · p. 5")).toBeTruthy();
    expect(screen.getByText("Verificado")).toBeTruthy();
  });

  it("S07: metas da trilha são rotuladas como sugestão pedagógica", async () => {
    abrir(BASE + "/trilha", "2026-11-18T15:00:00.000Z");
    const s1 = await screen.findByRole("region", { name: /Semana 1/ });
    expect(within(s1).getByText("16/11/2026 a 22/11/2026")).toBeTruthy();
    expect(within(s1).getByText("60 questões")).toBeTruthy();
    expect(within(s1).getAllByText("Sugestão pedagógica").length).toBeGreaterThan(0);
    expect(s1.getAttribute("aria-current")).toBe("true");
  });
});

describe("estudo do tópico (RN10–RN13)", () => {
  it("S18, S19: leitura não muda estado; reagendar registra histórico", async () => {
    const view = abrir(BASE + "/topico/ce-ip", "2026-11-18T15:00:00.000Z");
    await screen.findByRole("heading", { level: 1, name: "Endereçamento IP" });
    await view.user.selectOptions(screen.getByLabelText("Confiança"), "baixa");
    await view.user.click(screen.getByRole("button", { name: "Leitura concluída" }));
    expect(screen.getByRole("button", { name: "Leitura concluída" }).getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("nao-iniciado");
    expect((screen.getByLabelText("Confiança") as HTMLSelectElement).value).toBe("baixa");
    await view.user.selectOptions(screen.getByLabelText("Semana"), "2");
    expect(screen.getByText("Planejado: semana 1 · replanejado em 18/11/2026 para a semana 2")).toBeTruthy();
  });

  it("S20: sessão registrada aparece no tempo da semana", async () => {
    const storage = memoryStorage();
    const view = abrir(BASE + "/topico/ce-ip", "2026-11-18T15:00:00.000Z", { storage });
    await screen.findByRole("heading", { level: 1, name: "Endereçamento IP" });
    const minutos = screen.getByLabelText("Minutos estudados");
    await view.user.clear(minutos);
    await view.user.type(minutos, "90");
    await view.user.click(screen.getByRole("button", { name: "Registrar sessão" }));
    expect(await screen.findByText("Sessão de 1 h 30 registrada.")).toBeTruthy();
    view.unmount();
    abrir(BASE + "/trilha", "2026-11-18T15:00:00.000Z", { storage });
    const s1 = await screen.findByRole("region", { name: /Semana 1/ });
    expect(within(s1).getByText("1 h 30 de 10 h")).toBeTruthy();
  });
});

describe("teoria e questões (RN15, RN24, RN25, RN28)", () => {
  it("S39: tópico publicado mostra objetivos, explicação, exemplo, conceitos e critério de domínio", async () => {
    abrir(BASE + "/topico/lp-crase", "2026-11-18T15:00:00.000Z");
    for (const t of ["Objetivos", "Explicação", "Exemplos comentados", "Conceitos principais", "Critério de domínio"]) {
      expect(await screen.findByRole("heading", { name: t })).toBeTruthy();
    }
    expect(screen.getByText("Crase é a fusão da preposição a com o artigo a.")).toBeTruthy();
  });

  it("S38: tópico sem conteúdo publicado não oferece questões", async () => {
    abrir(BASE + "/topico/lp-regencia", "2026-11-18T15:00:00.000Z");
    expect(await screen.findByText("Conteúdo em preparação")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Resolver questões/ })).toBeNull();
  });

  it("S36, S37: responder mostra origem, resultado, gabarito e comentário; erro vai ao caderno", async () => {
    const storage = memoryStorage();
    const view = abrir(BASE + "/questoes/lp-crase", "2026-11-18T15:00:00.000Z", { storage });
    expect(await screen.findByText("Questão 1 de 8")).toBeTruthy();
    expect(screen.getByText("Origem: autoral")).toBeTruthy();
    expect(screen.queryByText(/IBGP/)).toBeNull();
    const confirmar = screen.getByRole("button", { name: "Confirmar resposta" });
    expect(confirmar.hasAttribute("disabled")).toBe(true);
    await view.user.click(screen.getByLabelText("B) B"));
    await view.user.click(confirmar);
    expect(screen.getByText("Errou")).toBeTruthy();
    expect(screen.getByText("Gabarito: C")).toBeTruthy();
    expect(screen.getByText("Porque C.")).toBeTruthy();
    view.unmount();
    abrir(BASE + "/erros", "2026-11-18T15:00:00.000Z", { storage });
    expect(await screen.findByText("Questão 1 de lp-crase?")).toBeTruthy();
  });
});

describe("revisões, painel, simulado e discursiva", () => {
  it("S32: leitura em 18/11 gera revisão pendente em 20/11", async () => {
    const storage = memoryStorage();
    const view = abrir(BASE + "/topico/lp-crase", "2026-11-18T15:00:00.000Z", { storage });
    await view.user.click(await screen.findByRole("button", { name: "Leitura concluída" }));
    view.unmount();
    const v2 = abrir(BASE + "/revisoes", "2026-11-20T15:00:00.000Z", { storage });
    const pend = await screen.findByRole("region", { name: "Pendentes" });
    expect(within(pend).getByText("19/11/2026")).toBeTruthy();
    await v2.user.click(within(pend).getByRole("button", { name: /Marcar revisão de Crase/ }));
    await waitFor(() => expect(within(pend).queryByText("19/11/2026")).toBeNull());
  });

  it("S45: painel sem tentativas mostra 'Sem dados', nunca 0%", async () => {
    abrir(BASE + "/painel", "2026-11-18T15:00:00.000Z");
    const taxa = await screen.findByRole("region", { name: "Taxa de acertos" });
    expect(within(taxa).getAllByText("Sem dados").length).toBeGreaterThan(0);
    expect(within(taxa).queryByText("0%")).toBeNull();
  });

  it("S42: sem questões suficientes, o simulado é parcial e sem a referência de aprovação", async () => {
    const view = abrir(BASE + "/simulado", "2026-11-18T15:00:00.000Z");
    expect(await screen.findByText("Simulado parcial: CE 0 de 4")).toBeTruthy();
    await view.user.click(screen.getByRole("button", { name: "Iniciar simulado" }));
    expect(await screen.findByText(/Questão 1 de 2/)).toBeTruthy();
    expect(screen.getByRole("timer")).toBeTruthy();
    await view.user.click(screen.getByRole("button", { name: "Encerrar e corrigir" }));
    expect(await screen.findByText("Nota parcial: 0 de 4 pontos")).toBeTruthy();
    expect(screen.queryByText(/mínimo/)).toBeNull();
  });

  it("S44: discursiva soma os critérios até 15 e rotula como autoavaliação", async () => {
    const view = abrir(BASE + "/discursiva", "2026-11-18T15:00:00.000Z");
    await screen.findByRole("heading", { level: 1, name: /Discursiva/ });
    const cp = screen.getByLabelText(/Conteúdo \(até 6\)/);
    await view.user.clear(cp);
    await view.user.type(cp, "5");
    const pr = screen.getByLabelText(/Pertinência \(até 3\)/);
    await view.user.clear(pr);
    await view.user.type(pr, "2.5");
    expect(screen.getByText("Total: 7,5 de 15 (autoavaliação)")).toBeTruthy();
    await view.user.clear(cp);
    await view.user.type(cp, "9");
    expect(screen.getByText("Conteúdo vai até 6.")).toBeTruthy();
  });

  it("não tem violações de acessibilidade sérias na capa e no tópico", async () => {
    const v = abrir(BASE, "2026-11-18T15:00:00.000Z");
    await screen.findByRole("heading", { level: 1, name: "Preparatório de teste" });
    expect(await axeViolations()).toEqual([]);
    v.unmount();
    abrir(BASE + "/topico/lp-crase", "2026-11-18T15:00:00.000Z");
    await screen.findByRole("heading", { level: 1, name: "Crase" });
    await act(async () => {});
    expect(await axeViolations()).toEqual([]);
  });
});

describe("simulado completo e reuso", () => {
  function comCE() {
    const c = concurso();
    c.disciplinas[1]!.modulos[0]!.topicos[0]!.publicado = true;
    const teoriaCe = { "ce-ip": { objetivos: ["o"], explicacao: ["e"], exemplos: [{ enunciado: "x", resolucao: "y" }], conceitos: [{ t: "t", d: "d" }], dominio: ["d"] } };
    return { c, extra: { "content/teste-2027/teoria/ce.json": teoriaCe, "content/teste-2027/questoes/ce.json": questoes("ce-ip", 8) } };
  }

  it("S40, S41: simulado completo com 6 questões e cronômetro; retoma ao recarregar; encerra quando o tempo acaba", async () => {
    const { c, extra } = comCE();
    let agora = "2026-11-18T15:00:00.000Z";
    const storage = memoryStorage();
    const view = renderApp(BASE + "/simulado", { fetchJSON: servir(c, extra), agora: () => agora, storage });
    expect(await screen.findByText("Simulado completo: 6 questões.")).toBeTruthy();
    await view.user.click(screen.getByRole("button", { name: "Iniciar simulado" }));
    expect(await screen.findByText("Questão 1 de 6")).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toContain("4:00:00");
    await view.user.click(screen.getAllByRole("radio")[2]!);
    view.unmount();
    // recarregar: o simulado em andamento volta com a resposta e o tempo
    agora = "2026-11-18T16:00:00.000Z";
    const v2 = renderApp(BASE + "/simulado", { fetchJSON: servir(c, extra), agora: () => agora, storage });
    expect(await screen.findByText("Questão 1 de 6")).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toContain("3:00:00");
    expect((screen.getAllByRole("radio")[2] as HTMLInputElement).checked).toBe(true);
    agora = "2026-11-18T19:00:01.000Z";
    expect(await screen.findByText(/^Nota: \d+ de 16 pontos$/, {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText(/Referência do edital: mínimo de 9,6 pontos/)).toBeTruthy();
    expect(screen.getByRole("region", { name: "Histórico de simulados" }).textContent).toContain("18/11/2026");
    v2.unmount();
  });

  it("S10: um segundo concurso entra só com dados (manifesto e arquivos)", async () => {
    const man = manifest();
    const grupo = manifestoConcursos();
    const outro = { ...grupo.subtemas[0]!, slug: "outro-2028", nome: "Outro concurso", titulo: "Preparatório do outro", arquivo: "content/outro-2028/concurso.json" };
    grupo.subtemas.push(outro);
    (man.areas as unknown[]).push(grupo);
    const c2 = concurso();
    c2.prova.data = "2028-03-05";
    const files: Record<string, unknown> = { "content/areas.json": man, "content/outro-2028/concurso.json": c2 };
    renderApp("/atlas/concursos/outro-2028", { fetchJSON: async (u: string) => { if (!(u in files)) throw new Error("404"); return files[u]; }, agora: () => "2026-11-11T12:00:00.000Z" });
    expect(await screen.findByRole("heading", { level: 1, name: "Preparatório do outro" })).toBeTruthy();
    expect(screen.getByText(/05\/03\/2028 · data prevista/)).toBeTruthy();
  });
});

it("leva 1: teoria com fontes mostra 'Fontes consultadas' com links", async () => {
  const t = teoria() as Record<string, unknown>;
  (t["lp-crase"] as Record<string, unknown>).fontes = [{ titulo: "IBGE Cidades: Contagem", url: "https://cidades.ibge.gov.br/brasil/mg/contagem" }];
  renderApp(BASE + "/topico/lp-crase", { fetchJSON: servir(concurso(), { "content/teste-2027/teoria/lp.json": t }), agora: () => "2026-11-18T15:00:00.000Z" });
  expect(await screen.findByRole("heading", { name: "Fontes consultadas" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /IBGE Cidades: Contagem/ }).getAttribute("href")).toBe("https://cidades.ibge.gov.br/brasil/mg/contagem");
});
