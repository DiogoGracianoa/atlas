// Ações do cabeçalho comuns a todo o portal: indicador de sincronização (só
// para quem já entrou neste aparelho, RN18) e ajustes de leitura.
import { Ajustes } from "./Ajustes";
import { SyncIndicator } from "./conta";

export function HeaderActions() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <SyncIndicator />
      <Ajustes />
    </div>
  );
}
