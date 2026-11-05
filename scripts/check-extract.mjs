// Verificação do cenário C01: os módulos extraídos do HTML original continuam
// byte a byte iguais em public/content/politica/curriculum.json. O bloco original
// termina em "]}"; módulos acrescentados depois (como o 8) entram antes desse
// fechamento, então o arquivo atual precisa começar pelo bloco sem esse final.
// O HTML original vive em exemplos/, que não é versionada: sem ela, o script
// encerra em silêncio com sucesso (clone limpo).
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "exemplos", "atlas-de-estudos-política.html");
const target = join(root, "public", "content", "politica", "curriculum.json");

if (!existsSync(source)) process.exit(0);

const html = readFileSync(source);
const open = Buffer.from('<script type="application/json" id="atlas-data">');
const start = html.indexOf(open);
const end = start < 0 ? -1 : html.indexOf(Buffer.from("</script>"), start);
if (start < 0 || end < 0) {
  console.error("Bloco atlas-data não encontrado no HTML original.");
  process.exit(1);
}
const block = html.subarray(start + open.length, end);

if (!existsSync(target)) {
  console.error("Ausente: public/content/politica/curriculum.json");
  process.exit(1);
}
const file = readFileSync(target);
const sha = (b) => createHash("sha256").update(b).digest("hex");
const closes = (b) => b.subarray(b.length - 2).toString("utf8") === "]}";
const body = block.subarray(0, block.length - 2);

if (!closes(block) || !closes(file) || !file.subarray(0, body.length).equals(body)) {
  console.error("DIFERENTE\n  original " + sha(block) + " (" + block.length + " bytes)\n  atual    " + sha(file) + " (" + file.length + " bytes)");
  process.exit(1);
}
const extra = file.length - block.length;
console.log("Módulos originais idênticos: " + sha(block) + " (" + block.length + " bytes)" +
  (extra ? "; mais " + extra + " bytes de módulos acrescentados depois." : "."));
