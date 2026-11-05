// Confirmação acessível (no lugar de window.confirm), sobre o Sheet.
import type { ReactNode } from "react";
import { Button } from "./primitives";
import { Sheet } from "./Sheet";

export function Confirm({ open, title, children, confirmLabel, danger, onConfirm, onCancel }: {
  open: boolean; title: string; children: ReactNode; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Sheet open={open} title={title} onClose={onCancel}>
      <div style={{ lineHeight: 1.55 }}>{children}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </Sheet>
  );
}
