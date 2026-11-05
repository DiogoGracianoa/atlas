// Verificação única (cenário C01): o conteúdo de content/politica/curriculum.json
// precisa ser byte a byte igual ao bloco atlas-data do HTML original.
// O HTML original vive em exemplos/, que não é versionada: sem ela, o script
// encerra em silêncio com sucesso (clone limpo).
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "exemplos", "atlas-de-estudos-política.html");
const target = join(root, "content", "politica", "curriculum.json");

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
  console.error("Ausente: content/politica/curriculum.json");
  process.exit(1);
}
const file = readFileSync(target);
const sha = (b) => createHash("sha256").update(b).digest("hex");

if (!block.equals(file)) {
  console.error("DIFERENTE\n  original " + sha(block) + " (" + block.length + " bytes)\n  extraído " + sha(file) + " (" + file.length + " bytes)");
  process.exit(1);
}
console.log("Idêntico: " + sha(file) + " (" + file.length + " bytes)");
