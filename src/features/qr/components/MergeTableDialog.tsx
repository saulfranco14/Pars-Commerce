"use client";

import { useState } from "react";
import { Loader2, Users } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface MergeTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Occupied tables that can be absorbed into the current one. */
  candidates: QrCode[];
  onMerge: (secondaryOrderId: string) => Promise<boolean | void>;
  merging: boolean;
  error: string | null;
}

/**
 * Staff picker to merge another occupied table into the current bill. Lists
 * the other tables in use; confirming absorbs the chosen table's order.
 */
export function MergeTableDialog({
  isOpen,
  onClose,
  candidates,
  onMerge,
  merging,
  error,
}: MergeTableDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected || merging) return;
    const ok = await onMerge(selected);
    if (ok) {
      setSelected(null);
      onClose();
    }
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={() => {
        if (merging) return;
        setSelected(null);
        onClose();
      }}
      title="Unir con otra mesa"
      description="Las dos mesas compartirán una sola cuenta. Los productos de la mesa que elijas pasarán a esta."
    >
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <Notification
            tone="info"
            message="No hay otras mesas en uso para unir en este momento."
          />
        ) : (
          <div className="space-y-2">
            {candidates.map((t) => {
              const active = selected === t.current_order_id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.current_order_id ?? null)}
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

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || merging}
          className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {merging ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uniendo...
            </>
          ) : (
            <>
              <Users className="h-5 w-5" />
              Unir mesas
            </>
          )}
        </button>
      </div>
    </FormSheet>
  );
}
