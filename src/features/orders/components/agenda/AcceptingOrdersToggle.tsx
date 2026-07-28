"use client";

import { useState } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { setAcceptingOrders } from "@/features/orders/services/acceptingOrdersService";

import type { AcceptingOrdersToggleProps } from "@/features/orders/interfaces/acceptingOrders";

/**
 * Abre y cierra la recepción de pedidos del sitio.
 *
 * Va detrás de una confirmación porque cerrar deja de vender de inmediato y el
 * botón vive junto a otros que no tienen consecuencia. La confirmación dice
 * qué NO pasa (el catálogo sigue arriba), que es la duda real de quien lo
 * toca la primera vez.
 */
export function AcceptingOrdersToggle({
  tenantId,
  accepting,
  onChanged,
}: AcceptingOrdersToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setSaving(true);
    setError(null);
    try {
      await setAcceptingOrders(tenantId, !accepting);
      onChanged(!accepting);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
            accepting
              ? "border-border bg-surface text-foreground hover:bg-border-soft/60"
              : "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          {accepting ? (
            <>
              <PauseCircle className="h-4 w-4 shrink-0" aria-hidden />
              Cerrar recepción
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
              Reabrir recepción
            </>
          )}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={apply}
        title={
          accepting ? "¿Cerrar la recepción?" : "¿Reabrir la recepción?"
        }
        description={
          accepting
            ? "Tu sitio dejará de aceptar pedidos nuevos. El catálogo sigue visible y los carritos de tus clientes se guardan, así que pueden terminar cuando reabras."
            : "Tu sitio volverá a aceptar pedidos de inmediato."
        }
        confirmLabel={accepting ? "Sí, cerrar" : "Sí, reabrir"}
        icon={accepting ? PauseCircle : PlayCircle}
        loading={saving}
      />
    </>
  );
}
