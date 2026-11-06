// Ferramentas no rodapé do menu: exportar e importar backup (RN26), zerar
// (RN29) e salvar o roteiro da área em PDF (RN14).
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAccountSeen } from "../../../app/account";
import { useServices, useSyncState } from "../../../app/context";
import { exportBackup, planImport } from "../../../core/backup";
import { LEGACY_AREA } from "../../../core/legacy";
import type { AreaIndex } from "../../../core/types";
import { Confirm } from "../../../ui/Confirm";
import { useToast } from "../../../ui/Toast";
import s from "../Atlas.module.css";

export const BACKUP_FILE = "atlas-estudos-progresso.json";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function AtlasTools({ area, onAction, onPrint }: { area: AreaIndex | null; onAction?: () => void; onPrint?: () => void }) {
  const { store, content } = useServices();
  const sync = useSyncState();
  const seen = useAccountSeen();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ backup: unknown; isKnownItem: (key: string) => boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const synced = seen && !!sync.user;

  async function onFile(file: File) {
    try {
      const o: unknown = JSON.parse(await file.text());
      const legacy = !!o && typeof o === "object" && (o as { version?: unknown }).version !== 3;
      if (legacy && content.isAvailable(LEGACY_AREA)) await content.loadArea(LEGACY_AREA).catch(() => null);
      const loaded = new Map<string, AreaIndex>();
      for (const a of content.areas()) {
        if (content.isLoaded(a.slug)) loaded.set(a.slug, await content.loadArea(a.slug));
      }
      const isKnownItem = (key: string) => {
        const a = loaded.get(key.slice(0, key.indexOf("/")));
        return a ? !!a.byKey[key] : true;
      };
      // Valida agora (estrutura inválida cai no catch); o plano de verdade é
      // feito na confirmação, sobre o estado daquele momento (achado 2 da revisão).
      planImport(store.state, o, { now: new Date().toISOString(), isKnownItem });
      setPendingImport({ backup: o, isKnownItem });
    } catch {
      toast("Não foi possível ler esse arquivo. Selecione um backup exportado pelo Atlas.");
    }
  }

  return (
    <div className={s.tools}>
      <p className={s.toolsTitle}>Seu progresso</p>
      <div className={s.toolsGrid}>
        <button type="button" className={s.tool} onClick={() => {
          download(BACKUP_FILE, JSON.stringify(exportBackup(store.state, new Date().toISOString()), null, 2));
          toast("Backup exportado.");
        }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
          Exportar
        </button>
        <button type="button" className={s.tool} onClick={() => fileRef.current?.click()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7 9l5-5 5 5M5 20h14" /></svg>
          Importar
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label="Arquivo de backup"
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
        <button type="button" className={s.tool} disabled={!area} aria-label="Salvar em PDF"
          title={area ? "Salvar o roteiro da área em PDF" : "Abra uma área para salvar o roteiro em PDF."}
          onClick={() => { onAction?.(); toast("Na janela de impressão, escolha “Salvar como PDF”."); onPrint?.(); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></svg>
          PDF
        </button>
        <button type="button" className={[s.tool, s.toolDanger].join(" ")} onClick={() => setConfirmReset(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
          Zerar
        </button>
      </div>

      <Confirm
        open={!!pendingImport}
        title="Importar backup"
        confirmLabel="Mesclar"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          const p = pendingImport;
          setPendingImport(null);
          if (!p) return;
          const ops = planImport(store.state, p.backup, { now: new Date().toISOString(), isKnownItem: p.isKnownItem });
          store.applyOps(ops);
          toast(ops.length ? `Progresso importado (${ops.length} ${ops.length === 1 ? "alteração" : "alterações"}).` : "Nada novo no backup.");
        }}
      >
        Mesclar o backup com o progresso deste aparelho? Entradas mais recentes vencem e nada é apagado.
      </Confirm>

      <Confirm
        open={confirmReset}
        title="Zerar o progresso"
        confirmLabel="Zerar"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          store.resetAll();
          onAction?.();
          void navigate("/atlas");
          toast("Progresso zerado.");
        }}
      >
        {synced
          ? "Apagar todas as marcações e anotações de todas as áreas, em todos os aparelhos sincronizados?"
          : "Apagar todas as marcações e anotações de todas as áreas?"} Exporte um backup antes, se precisar.
      </Confirm>

    </div>
  );
}
