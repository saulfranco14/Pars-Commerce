"use client";

import { Loader2, ShoppingBag, Trash2 } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { PickupTimePicker } from "@/features/checkout/components/cart/PickupTimePicker";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { KioskCartPanelProps } from "@/features/dispositivos/interfaces/kioskUi";

/**
 * El pedido en curso. En pantalla ancha vive como columna fija a la derecha; en
 * vertical es el cajón que sube desde la barra de abajo. Mismo contenido en las
 * dos, así que el componente es uno solo.
 */
export function KioskCartPanel({
  lines,
  total,
  itemCount,
  onAdd,
  onDecrement,
  onRemove,
  onClear,
  onConfirm,
  submitting,
  error,
  pickupScheduling,
  businessHours,
  scheduledFor,
  onScheduleChange,
}: KioskCartPanelProps) {
  const empty = itemCount === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <ShoppingBag className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          Tu pedido
        </h2>
        {!empty && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-border-soft"
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            Vaciar
          </button>
        )}
      </div>

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-border-soft/60">
            <ShoppingBag
              className="h-9 w-9 text-muted-foreground"
              aria-hidden
            />
          </span>
          <p className="text-lg font-semibold text-foreground">
            Todavía no eliges nada
          </p>
          <p className="text-base text-muted-foreground">
            Toca un producto y aparece aquí.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {lines.map((line) => (
            <li
              key={line.product.id}
              className="rounded-2xl border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground">
                  {line.product.name}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(line.product.id)}
                  aria-label={`Quitar ${line.product.name}`}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-full border border-accent/30 p-0.5">
                  <button
                    type="button"
                    onClick={() => onDecrement(line.product.id)}
                    aria-label={`Quitar uno de ${line.product.name}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-2xl font-bold text-accent transition-transform hover:bg-accent/10 active:scale-90"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-lg font-bold tabular-nums text-foreground">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdd(line.product.id)}
                    aria-label={`Agregar uno de ${line.product.name}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90"
                  >
                    +
                  </button>
                </div>
                <span className="text-xl font-bold tabular-nums text-foreground">
                  {formatCurrency(Number(line.product.price) * line.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!empty && (
        <div className="shrink-0 space-y-4 border-t border-border px-5 py-4">
          {pickupScheduling.enabled && (
            <PickupTimePicker
              config={pickupScheduling}
              businessHours={businessHours}
              value={scheduledFor}
              onChange={onScheduleChange}
              accentColor="var(--accent)"
              disabled={submitting}
            />
          )}

          {error && <Notification tone="error" message={error} />}

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Total
              </p>
              <p className="text-5xl font-bold tracking-tight tabular-nums text-foreground">
                {formatCurrency(total)}
              </p>
            </div>
            <p className="pb-2 text-base text-muted-foreground">
              {itemCount} {itemCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex min-h-20 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-accent px-6 text-2xl font-bold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              "Terminar pedido"
            )}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Pagas con tu celular o en el mostrador
          </p>
        </div>
      )}
    </div>
  );
}
