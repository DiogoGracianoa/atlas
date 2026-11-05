// Cenário R03 (contrato KR2): endereços antigos com # viram rotas limpas.
import { describe, expect, it } from "vitest";
import { legacyToPath, LEGACY_AREA } from "../../src/core/legacy";

describe("legacyToPath (KR2)", () => {
  it.each([
    ["", null],
    ["#", null],
    ["#/", "/atlas"],
    ["#/politica", "/atlas/politica"],
    ["#/politica/m1e1", "/atlas/politica/m1e1"],
    ["#/historia", "/atlas/historia"],
    ["#inicio", "/atlas/politica"],
    ["#m1e1", "/atlas/politica/m1e1"],
    ["#m3of", "/atlas/politica/m3of"],
    ["#zzz", "/atlas"],
    ["#/a/b/c", "/atlas"],
    ["#/politica/m1e1?x", "/atlas"],
    ["#%E0%A4%A", "/atlas"],
  ])("%j → %j", (hash, expected) => {
    expect(legacyToPath(hash)).toBe(expected);
  });

  it("aceita hash sem o caractere #", () => {
    expect(legacyToPath("/politica/m2e1")).toBe("/atlas/politica/m2e1");
  });

  it("área legada é política", () => {
    expect(LEGACY_AREA).toBe("politica");
  });
});
