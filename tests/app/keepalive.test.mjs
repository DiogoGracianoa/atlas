// Cenário P01: scripts/keepalive.sh (usado pela Action diária) contra um
// servidor local que imita a API REST do Supabase.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./helpers.mjs";

function serve(status, body = "[]") {
  const seen = [];
  const srv = createServer((req, res) => {
    seen.push({ url: req.url, apikey: req.headers.apikey, auth: req.headers.authorization });
    res.writeHead(status, { "Content-Type": "application/json" }).end(body);
  });
  return new Promise(r => srv.listen(0, "127.0.0.1", () => r({ srv, seen, url: "http://127.0.0.1:" + srv.address().port })));
}

function run(env) {
  return new Promise(resolve => {
    const p = spawn("bash", [join(REPO, "scripts", "keepalive.sh")], {
      env: { ...process.env, KEEPALIVE_RETRY: "0", ...env }
    });
    let out = "";
    p.stdout.on("data", d => (out += d));
    p.stderr.on("data", d => (out += d));
    p.on("close", code => resolve({ code, out }));
  });
}

test("200: consulta heartbeat com a chave no cabeçalho apikey e passa", async () => {
  const { srv, seen, url } = await serve(200, '[{"id":1}]');
  const r = await run({ SUPABASE_URL: url + "/", SUPABASE_ANON_KEY: "chave-publica" });
  srv.close();
  assert.equal(r.code, 0, r.out);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "/rest/v1/heartbeat?select=id&limit=1");
  assert.equal(seen[0].apikey, "chave-publica");
  assert.equal(seen[0].auth, undefined, "sem Authorization: funciona com chave anon e publishable");
  assert.doesNotMatch(r.out, /chave-publica/, "não imprime a chave");
});

for (const status of [401, 404, 500, 503]) {
  test(status + ": job falha", async () => {
    const { srv, url } = await serve(status, '{"message":"erro"}');
    const r = await run({ SUPABASE_URL: url, SUPABASE_ANON_KEY: "k" });
    srv.close();
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, new RegExp("HTTP " + status));
  });
}

test("secret ausente: job falha com mensagem clara", async () => {
  const r = await run({ SUPABASE_URL: "", SUPABASE_ANON_KEY: "" });
  assert.equal(r.code, 1);
  assert.match(r.out, /SUPABASE_URL/);
});

test("sem servidor: job falha", async () => {
  const r = await run({ SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_ANON_KEY: "k" });
  assert.equal(r.code, 1, r.out);
});

test("workflow: diário, disparo manual e usa os secrets", () => {
  const y = readFileSync(join(REPO, ".github", "workflows", "keepalive.yml"), "utf8");
  assert.match(y, /schedule:\s*\n\s*- cron: "\d+ \d+ \* \* \*"/);
  assert.match(y, /workflow_dispatch:/);
  assert.match(y, /SUPABASE_URL: \$\{\{ secrets\.SUPABASE_URL \}\}/);
  assert.match(y, /SUPABASE_ANON_KEY: \$\{\{ secrets\.SUPABASE_ANON_KEY \}\}/);
  assert.match(y, /bash scripts\/keepalive\.sh/);
  assert.doesNotMatch(y, /service_role|SERVICE_ROLE/);
});
