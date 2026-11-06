// Cenários S11 e S13 (atlas-tecnologia-subtemas, RN06–RN09): padrão de
// conteúdo do subtema "Arquitetura e liderança técnica", igual ao do atlas de
// política: explicação completa antes de qualquer recomendação.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Curriculum, Manifest } from "../../src/core/types";
import { REPO } from "./helpers";

const SLUG = "arquitetura-lideranca-tecnica";
const man = JSON.parse(readFileSync(join(REPO, "public/content/areas.json"), "utf8")) as Manifest;
const cur = JSON.parse(readFileSync(join(REPO, "public/content", SLUG, "curriculum.json"), "utf8")) as Curriculum;
const temas = cur.modules.flatMap(m => m.steps);
const URL_OK = /^https:\/\/(books\.google\.com\/books\?q=|www\.youtube\.com\/results\?search_query=)\S+$/;

describe("manifesto", () => {
  it("Tecnologia agrupa o subtema, com as três trilhas como tradições", () => {
    const tec = man.areas.find(a => a.slug === "tecnologia")!;
    const sub = tec.subtemas!.find(s => s.slug === SLUG)!;
    expect(sub.status).toBe("disponivel");
    expect(Object.keys(sub.tradicoes!)).toEqual(["lideranca", "engenharia", "ia"]);
  });
});

describe("padrão de cada tema (RN06, RN07)", () => {
  it.each(temas.map(t => [t.id, t] as const))("%s", (_id, t) => {
    expect(t.definition.length, "parágrafos da definição").toBeGreaterThanOrEqual(5);
    expect(Math.min(...t.definition.map(p => p.length)), "parágrafo mais curto").toBeGreaterThanOrEqual(250);
    expect(t.concepts.length, "conceitos").toBeGreaterThanOrEqual(6);
    expect(t.theses.length, "teses").toBeGreaterThanOrEqual(3);
    expect((t.debate ?? []).length, "debates").toBeGreaterThanOrEqual(2);
    expect(t.check.length, "perguntas").toBeGreaterThanOrEqual(3);
    expect((t.videos ?? []).length, "vídeos").toBeGreaterThanOrEqual(1);
    expect(!!t.book || !!t.bridge, "livro ou ponte").toBe(true);
    expect(["lideranca", "engenharia", "ia"]).toContain(t.tradition);
  });
});

describe("oficinas (RN08) e fontes (RN09)", () => {
  it("toda oficina tem exercício concreto", () => {
    for (const m of cur.modules) expect(m.workshop.exercise.length, m.workshop.id).toBeGreaterThanOrEqual(600);
  });

  it("só links de busca do Google Books e do YouTube", () => {
    const urls = temas.flatMap(t => [...(t.videos ?? []).map(v => v.url), ...(t.book ? [t.book.url] : [])]);
    expect(urls.filter(u => !URL_OK.test(u))).toEqual([]);
  });

  it("módulos em ordem, com IDs no padrão", () => {
    cur.modules.forEach((m, i) => {
      expect(m.id).toBe("m" + (i + 1));
      expect(m.number).toBe(i + 1);
      expect(m.workshop.id).toBe(m.id + "of");
      m.steps.forEach((s, j) => expect(s.id).toBe(`${m.id}e${j + 1}`));
    });
  });
});
