"use client";

import Link from "next/link";
import { Receipt, Send, X } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { CartEntry } from "@/features/qr/interfaces/tableCart";

interface TableCtaBarProps {
  token: string;
  orderId: string | null;
  entries: CartEntry[];
  total: number;
  itemCount: number;
  saving: boolean;
  onSend: () => void;
  onDecrement: (productId: string) => void;
}

/**
 * Fixed bottom action bar for the table menu view. Two states:
 *
 *  1. No cart items → single "Ver cuenta" CTA (or hint if no order yet).
 *  2. Items in cart → "Ver cuenta" icon button + "Enviar pedido · $X" CTA
 *     with a small badge showing item count and a chip list of items.
 */
export function TableCtaBar({
  token,
  orderId,
  entries,
  total,
  itemCount,
  saving,
  onSend,
  onDecrement,
}: TableCtaBarProps) {
  const hasItems = entries.length > 0;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        {!hasItems ? (
          orderId ? (
            <Link
              href={`/q/${token}/table/bill?order_id=${orderId}`}
              className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99]"
            >
              <Receipt className="h-5 w-5" />
              Ver cuenta
            </Link>
          ) : (
            <p className="w-full text-center text-sm text-muted-foreground">
              Agrega productos para hacer tu pedido.
            </p>
          )
        ) : (
          <>
            {orderId && (
              <Link
                href={`/q/${token}/table/bill?order_id=${orderId}`}
                className="inline-flex min-h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface text-foreground hover:bg-border-soft/40"
                aria-label="Ver cuenta"
              >
                <Receipt className="h-5 w-5" />
              </Link>
            )}
            <button
              type="button"
              onClick={onSend}
              disabled={saving}
              className="relative inline-flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shadow">
                {itemCount}
              </span>
              <Send className="h-5 w-5" />
              {saving
                ? "Enviando..."
                : `Enviar pedido · ${formatCurrency(total)}`}
            </button>
          </>
        )}
      </div>

      {hasItems && (
        <div className="mx-auto mt-2 max-w-3xl">
          <div className="flex flex-wrap gap-1.5">
            {entries.map((e) => (
              <div
                key={e.product_id}
                className="flex items-center gap-1 rounded-full bg-border-soft/60 px-2.5 py-1 text-xs font-medium text-foreground"
              >
                <span>{e.quantity}×</span>
                <span className="max-w-[120px] truncate">{e.product_name}</span>
                <button
                  type="button"
                  onClick={() => onDecrement(e.product_id)}
                  aria-label={`Quitar ${e.product_name}`}
                  className="ml-0.5 text-muted-foreground hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
