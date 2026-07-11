"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";

import type { MergeableTable } from "@/features/qr/services/tableClientService";

interface CustomerMergeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: MergeableTable[];
  loading: boolean;
  merging: boolean;
  error: string | null;
  onLoad: () => void;
  onMerge: (secondaryOrderId: string) => Promise<boolean | void>;
}

/**
 * Customer-facing "combine tables" sheet. When opened it loads the other
 * active tables of the business; picking one and confirming merges it into
 * the current bill. Same visual language as the rest of the QR flow.
 */
export function CustomerMergeSheet({
  isOpen,
  onClose,
  candidates,
  loading,
  merging,
  error,
  onLoad,
  onMerge,
}: CustomerMergeSheetProps) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      onLoad();
    }
    // onLoad is stable enough for this trigger; re-run only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function handleConfirm() {
    if (!selected || merging) return;
    const ok = await onMerge(selected);
    if (ok) onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={() => {
        if (merging) return;
        onClose();
      }}
      title="Unir con otra mesa"
      description="Enviaremos una solicitud a la otra mesa. Cuando su responsable la acepte, las cuentas se unirán en una sola."
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando mesas...
          </div>
        ) : candidates.length === 0 ? (
          <Notification
            tone="info"
            message="No hay otras mesas activas para unir en este momento."
          />
        ) : (
          <div className="space-y-2">
            {candidates.map((t) => {
              const active = selected === t.order_id;
              return (
                <button
                  key={t.order_id}
                  type="button"
                  onClick={() => setSelected(t.order_id)}
                  aria-pressed={active}
                  className={`flex w-full min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent/5"
                      : "border-border bg-surface hover:border-accent/40"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-border-soft/60 text-muted-foreground">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && <Notification tone="error" message={error} />}

        {candidates.length > 0 && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || merging}
            className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {merging ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                Enviar solicitud
              </>
            )}
          </button>
        )}
      </div>
    </FormSheet>
  );
}
