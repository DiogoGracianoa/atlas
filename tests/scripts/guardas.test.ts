// Cenários Q01 (RN13, AC17: limite de tamanho) e Q03 (RN17, AC21: segredos).
import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { REPO } from "./helpers";

const run = (script: string, args: string[]) => {
  const r = spawnSync(process.execPath, [join(REPO, "scripts", script), ...args], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
};

// Texto pouco compressível, para o tamanho gzip ser previsível.
const noise = (kb: number) => randomBytes(kb * 1024).toString("base64");

function dist(files: Record<string, string>, manifest: object) {
  const root = mkdtempSync(join(tmpdir(), "dist-"));
  mkdirSync(join(root, ".vite"), { recursive: true });
  mkdirSync(join(root, "assets"), { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(join(root, f), body);
  writeFileSync(join(root, ".vite", "manifest.json"), JSON.stringify(manifest));
  return root;
}

const manifesto = {
  "index.html": { file: "assets/index.js", isEntry: true, imports: ["_vendor.js"], dynamicImports: ["node_modules/@supabase/supabase-js/dist/index.mjs"] },
  "_vendor.js": { file: "assets/vendor.js" },
  "node_modules/@supabase/supabase-js/dist/index.mjs": { file: "assets/supabase.js", isDynamicEntry: true },
};

describe("size-budget (Q01)", () => {
  it("passa quando o JS inicial cabe no limite e o Supabase fica de fora", () => {
    const d = dist({ "assets/index.js": noise(20), "assets/vendor.js": noise(20), "assets/supabase.js": noise(200) }, manifesto);
    const r = run("size-budget.mjs", ["--dist", d, "--limit-kb", "150"]);
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/JS inicial: [\d.]+ KB gzip/);
  });

  it("falha quando o JS inicial passa do limite", () => {
    const d = dist({ "assets/index.js": noise(100), "assets/vendor.js": noise(100), "assets/supabase.js": "x" }, manifesto);
    const r = run("size-budget.mjs", ["--dist", d, "--limit-kb", "150"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("acima do limite");
  });

  it("falha quando o Supabase entra no carregamento inicial", () => {
    const m = { ...manifesto, "index.html": { ...manifesto["index.html"], imports: ["_vendor.js", "node_modules/@supabase/supabase-js/dist/index.mjs"] } };
    const d = dist({ "assets/index.js": "a", "assets/vendor.js": "b", "assets/supabase.js": "c" }, m);
    const r = run("size-budget.mjs", ["--dist", d]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("supabase");
  });
});

describe("check-secrets (Q03)", () => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const jwt = (role: string) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: "supabase", role })}.${"a".repeat(43)}`;

  function repo(files: Record<string, string>) {
    const root = mkdtempSync(join(tmpdir(), "repo-"));
    for (const [f, body] of Object.entries(files)) {
      mkdirSync(join(root, f, ".."), { recursive: true });
      writeFileSync(join(root, f), body);
    }
    return root;
  }

  it("aceita a chave pública e textos que alertam sobre a service_role", () => {
    const d = repo({
      "src/config.ts": `const k = "${jwt("anon")}"; const p = "sb_publishable_abcdefghijklmnop";`,
      "README.md": "A chave service_role nunca entra no repositório.",
    });
    const r = run("check-secrets.mjs", ["--root", d]);
    expect(r.code, r.out).toBe(0);
  });

  it("acusa JWT com papel service_role, chave sb_secret_ e variável preenchida", () => {
    const d = repo({
      "src/a.ts": `const k = "${jwt("service_role")}";`,
      "dist/assets/b.js": `x="sb_secret_abcdefghijklmnopqrstuv"`,
      ".env.example": "SUPABASE_SERVICE_ROLE_KEY=valor-de-verdade",
    });
    const r = run("check-secrets.mjs", ["--root", d]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("src/a.ts");
    expect(r.out).toContain("dist/assets/b.js");
    expect(r.out).toContain(".env.example");
    expect(r.out).not.toContain("abcdefghijklmnopqrstuv");
  });
});
