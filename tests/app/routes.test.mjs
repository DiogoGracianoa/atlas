// Cenário C07: rotas por hash, incluindo legadas e inválidas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoute, hrefFor } from "../../assets/lib/routes.js";

const casos = [
  ["", { view: "mapa" }],
  ["#", { view: "mapa" }],
  ["#/", { view: "mapa" }],
  ["#/politica", { view: "area", area: "politica" }],
  ["#/politica/", { view: "area", area: "politica" }],
  ["#/politica/m1e1", { view: "item", area: "politica", id: "m1e1" }],
  ["#/politica/m7of", { view: "item", area: "politica", id: "m7of" }],
  ["#/hist%C3%B3ria", { view: "area", area: "história" }],
  ["#inicio", { view: "mapa" }],
  ["#m1e1", { view: "item", area: "politica", id: "m1e1" }],
  ["#m3of", { view: "item", area: "politica", id: "m3of" }],
  ["#qualquer-coisa", { view: "mapa" }],
  ["#/a/b/c", { view: "mapa" }],
  ["#/%E0%A4%A", { view: "mapa" }]
];

for (const [hash, esperado] of casos) {
  test("parseRoute(" + JSON.stringify(hash) + ")", () => {
    assert.deepEqual(parseRoute(hash), esperado);
  });
}

test("hrefFor gera os três formatos", () => {
  assert.equal(hrefFor({ view: "mapa" }), "#/");
  assert.equal(hrefFor({ view: "area", area: "politica" }), "#/politica");
  assert.equal(hrefFor({ view: "item", area: "politica", id: "m1e1" }), "#/politica/m1e1");
});

test("ida e volta preserva a rota", () => {
  for (const r of [{ view: "mapa" }, { view: "area", area: "historia" }, { view: "item", area: "historia", id: "m2e3" }]) {
    assert.deepEqual(parseRoute(hrefFor(r)), r);
  }
});
