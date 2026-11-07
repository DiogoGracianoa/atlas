import { test, expect } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import ts from "typescript";

test("a função transpilada inicia e recusa requisição anônima", () => {
  const root = mkdtempSync(join(process.cwd(), ".teste-funcao-"));
  try {
    mkdirSync(join(root, "api"));
    mkdirSync(join(root, "server"));
    const api = readFileSync("api/conteudo.ts", "utf8");
    writeFileSync(join(root, "api", "conteudo.js"), ts.transpileModule(api, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
    const server = readFileSync("server/conteudo.js", "utf8");
    writeFileSync(join(root, "server", "conteudo.js"), server);
    const script = `import handler from ${JSON.stringify(pathToFileURL(join(root, "api", "conteudo.js")).href)}; const response = await handler.fetch(new Request("https://atlas.test/api/conteudo?arquivo=content/areas.json")); if (response.status !== 401) process.exit(2);`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
