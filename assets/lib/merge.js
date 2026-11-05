// Regras de mescla entre versões de uma mesma entrada.
// Horários são ISO 8601 UTC; comparação lexicográfica equivale à cronológica.

export const validAt = (at) => typeof at === "string" && !Number.isNaN(Date.parse(at));

const pad = (n) => String(n).padStart(2, "0");
export function fmtStamp(at) {
  const d = new Date(at);
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// Texto vencedor seguido da versão perdedora, com marcador datado (RN31).
export function conflictBody(winner, loser, loserAt, fmt = fmtStamp) {
  winner = winner || "";
  loser = loser || "";
  if (!loser || loser === winner) return winner;
  const marker = "— versão de outro aparelho (" + fmt(loserAt) + ") —\n" + loser;
  return winner ? winner + "\n\n" + marker : marker;
}
